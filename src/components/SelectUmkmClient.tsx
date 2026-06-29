"use client";

import { useState } from "react";
import Link from "next/link";

interface Umkm {
  id: number;
  nama_umkm: string;
  nama_pemilik: string;
}

export default function SelectUmkmClient({
  umkmList,
  targetPage,
  targetLabel,
  user
}: {
  umkmList: Umkm[];
  targetPage: string;
  targetLabel: string;
  user: any;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUmkm = umkmList.filter(
    (u) =>
      u.nama_umkm?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.nama_pemilik?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1">Pilih UMKM</h5>
          <p className="text-muted fs-sm mb-0">
            Pilih UMKM untuk melihat atau mengelola {targetLabel}nya
          </p>
        </div>
        <div style={{ maxWidth: "350px", width: "100%" }}>
          <div className="position-relative">
            <i
              className="bi bi-search position-absolute text-muted"
              style={{ left: "16px", top: "50%", transform: "translateY(-50%)" }}
            ></i>
            <input
              type="text"
              className="form-control form-control-custom shadow-sm border-0"
              style={{
                paddingLeft: "45px",
                borderRadius: "50rem",
                transition: "all 0.3s ease",
                height: "45px",
              }}
              placeholder="Cari nama UMKM / pemilik..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="row g-3" id="umkmListContainer">
        {filteredUmkm.map((u) => (
          <div key={u.id} className="col-12 umkm-card-item">
            <Link href={`/dashboard/${targetPage}?umkm_id=${u.id}`} className="text-decoration-none">
              <div
                className="panel h-100 hover-elevate transition-all"
                style={{ cursor: "pointer", borderLeft: "4px solid var(--primary)" }}
              >
                <div className="panel-body d-flex align-items-center gap-3 p-3">
                  <div
                    className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "48px", height: "48px", flexShrink: 0 }}
                  >
                    <i className="bi bi-shop fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1">{u.nama_umkm}</h6>
                    <p className="text-muted fs-sm mb-0">
                      <i className="bi bi-person me-1"></i> {u.nama_pemilik}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {filteredUmkm.length === 0 && (
          <div className="col-12 text-center py-5">
            <div className="text-muted">
              <i className="bi bi-search mb-2 fs-3 d-block"></i>
              Tidak menemukan UMKM yang dicari.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .hover-elevate {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-elevate:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05) !important;
        }
      `}</style>
    </>
  );
}
