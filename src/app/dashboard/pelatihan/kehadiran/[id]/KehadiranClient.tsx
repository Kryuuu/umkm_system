"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveKehadiranAction, getPelatihanQrTokenAction, generateQrTokenAction } from "../../kehadiranActions";

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

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  const currentTokenRef = useRef<string | null>(null);
  currentTokenRef.current = qrToken;

  const handleGenerateQr = async () => {
    setLoadingQr(true);
    const res = await generateQrTokenAction(pelatihan.id);
    setLoadingQr(false);
    if (res.success && res.qrToken) {
      setQrToken(res.qrToken);
    } else {
      console.error("Gagal generate QR Token:", res.message);
    }
  };

  // Poll for token changes when modal is active
  useEffect(() => {
    if (!showQrModal) {
      setQrToken(null);
      return;
    }

    // Initial fetch/generate
    const initQr = async () => {
      setLoadingQr(true);
      const res = await getPelatihanQrTokenAction(pelatihan.id);
      if (res.success && res.qrToken) {
        // Check if expired
        const isExpired = res.qrExpiresAt && new Date(res.qrExpiresAt) < new Date();
        if (isExpired || !res.qrToken) {
          await handleGenerateQr();
        } else {
          setQrToken(res.qrToken);
          setLoadingQr(false);
        }
      } else {
        await handleGenerateQr();
      }
    };

    initQr();

    const interval = setInterval(async () => {
      const res = await getPelatihanQrTokenAction(pelatihan.id);
      if (res.success && res.qrToken) {
        if (res.qrToken !== currentTokenRef.current) {
          setQrToken(res.qrToken);
          router.refresh(); // refresh server side list
        }
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [showQrModal]);

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
          <button 
            type="button" 
            onClick={() => setShowQrModal(true)} 
            className="btn rounded-pill px-4 fs-sm fw-semibold shadow-sm text-white"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', border: 'none' }}
          >
            <i className="bi bi-qr-code me-2"></i> QR Code Absensi
          </button>
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

      {showQrModal && (
        <div className="modal-backdrop-custom d-flex align-items-center justify-content-center" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 1050,
        }}>
          <div className="panel border-0 shadow-lg rounded-4 p-4 text-center text-white" style={{
            maxWidth: '450px',
            width: '90%',
            background: 'linear-gradient(135deg, #1e1b4b, #311042)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold mb-0 text-white">QR Code Absensi Mandiri</h5>
              <button 
                type="button" 
                className="btn-close btn-close-white" 
                style={{ filter: 'invert(1)' }}
                onClick={() => setShowQrModal(false)}
              ></button>
            </div>
            <p className="fs-xs text-white-50 mb-4">
              Tunjukkan QR Code ini kepada UMKM. QR Code akan otomatis berubah setiap kali discan oleh satu UMKM untuk mencegah pembagian gambar.
            </p>

            <div className="bg-white p-3 rounded-4 d-inline-block shadow mb-4" style={{ border: '2px solid #a21caf' }}>
              {loadingQr ? (
                <div className="d-flex align-items-center justify-content-center" style={{ width: '250px', height: '250px' }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : qrToken ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrToken)}`}
                  alt="QR Code Absensi"
                  style={{ width: '250px', height: '250px', display: 'block' }}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center text-dark" style={{ width: '250px', height: '250px' }}>
                  Gagal membuat QR Code
                </div>
              )}
            </div>

            <div className="d-flex flex-column gap-2">
              <button 
                onClick={handleGenerateQr} 
                disabled={loadingQr}
                className="btn btn-outline-light rounded-pill fs-sm fw-semibold"
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Regenerasi Manual
              </button>
              <span className="text-white-50 fs-xs" style={{ fontSize: '0.75rem' }}>
                <i className="bi bi-clock-history me-1"></i> Menunggu scan / aktif melakukan polling...
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
