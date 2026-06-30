"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveKehadiranAction, getKehadiranListAction } from "../../kehadiranActions";

export default function KehadiranClient({
  pelatihan,
  kehadiranList,
}: {
  pelatihan: any;
  kehadiranList: any[];
}) {
  const router = useRouter();
  const [kehadiranState, setKehadiranState] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    kehadiranList.forEach((k) => {
      if (k.status_hadir) {
        initial[k.umkm_id] = k.status_hadir;
      }
    });
    return initial;
  });

  // Poll in the background to fetch latest attendance records from database
  useEffect(() => {
    let active = true;

    const poll = async () => {
      const res = await getKehadiranListAction(pelatihan.id);
      if (!active) return;
      
      if (res.success && res.presence) {
        setKehadiranState((prev) => {
          const updated = { ...prev };
          let changed = false;
          res.presence.forEach((p: any) => {
            // If the server has a status for this student and local state has no status yet
            if (p.status_hadir && !prev[p.umkm_id]) {
              updated[p.umkm_id] = p.status_hadir;
              changed = true;
            }
          });
          return changed ? updated : prev;
        });
      }
    };

    // Initial poll
    poll();

    const interval = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pelatihan.id]);

  const handleStatusChange = (umkmId: number, status: string) => {
    setKehadiranState((prev) => ({
      ...prev,
      [umkmId]: status,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    const Swal = (window as any).Swal;

    // Check if all UMKMs have attendance marked
    const unmarked = kehadiranList.filter((k) => !kehadiranState[k.umkm_id]);
    if (unmarked.length > 0) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: `Terdapat ${unmarked.length} UMKM yang belum diberi status kehadiran.`,
      });
      return;
    }

    Swal.fire({
      title: "Menyimpan Kehadiran...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await saveKehadiranAction(pelatihan.id, kehadiranState);

    if (res.success) {
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Kehadiran berhasil disimpan.",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: res.message || "Gagal menyimpan kehadiran.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-1">Kehadiran: {pelatihan.nama_pelatihan}</h5>
          <p className="text-muted fs-sm mb-0">
            {formatDate(pelatihan.tanggal)} — {pelatihan.lokasi}
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link 
            href={`/dashboard/pelatihan/kehadiran/${pelatihan.id}/qr`}
            target="_blank"
            className="btn rounded-pill px-4 fs-sm fw-semibold shadow-sm text-white d-flex align-items-center justify-content-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', border: 'none' }}
          >
            <i className="bi bi-qr-code me-2"></i> QR Code Absensi
          </Link>
          <Link href="/dashboard/pelatihan" className="btn-outline-custom">
            <i className="bi bi-arrow-left"></i> Kembali
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="panel-body">
          <form onSubmit={handleSubmit}>
            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th style={{ width: "80px" }}>No</th>
                    <th>Nama UMKM</th>
                    <th>Nama Pemilik</th>
                    <th style={{ width: "120px" }}>Hadir</th>
                    <th style={{ width: "120px" }}>Tidak Hadir</th>
                    <th style={{ width: "120px" }}>Izin</th>
                  </tr>
                </thead>
                <tbody>
                  {kehadiranList.map((k, idx) => (
                    <tr key={k.umkm_id}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{k.nama_umkm}</strong>
                      </td>
                      <td>{k.nama_pemilik}</td>
                      <td>
                        <input
                          type="radio"
                          name={`kehadiran_${k.umkm_id}`}
                          value="hadir"
                          checked={kehadiranState[k.umkm_id] === "hadir"}
                          onChange={() => handleStatusChange(k.umkm_id, "hadir")}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={`kehadiran_${k.umkm_id}`}
                          value="tidak_hadir"
                          checked={kehadiranState[k.umkm_id] === "tidak_hadir"}
                          onChange={() => handleStatusChange(k.umkm_id, "tidak_hadir")}
                        />
                      </td>
                      <td>
                        <input
                          type="radio"
                          name={`kehadiran_${k.umkm_id}`}
                          value="izin"
                          checked={kehadiranState[k.umkm_id] === "izin"}
                          onChange={() => handleStatusChange(k.umkm_id, "izin")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <button type="submit" className="btn-primary-custom">
                <i className="bi bi-check-lg me-2"></i> Simpan Kehadiran
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
