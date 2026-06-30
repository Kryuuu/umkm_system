"use client";

import { useState } from "react";
import Link from "next/link";
import { updateUmkm } from "./actions";

const DOMISILI_KALSEL = [
  "Banjarmasin",
  "Banjarbaru",
  "Martapura (Kab. Banjar)",
  "Pelaihari (Kab. Tanah Laut)",
  "Rantau (Kab. Tapin)",
  "Kandangan (Kab. Hulu Sungai Selatan)",
  "Barabai (Kab. Hulu Sungai Tengah)",
  "Amuntai (Kab. Hulu Sungai Utara)",
  "Tanjung (Kab. Tabalong)",
  "Balangan",
  "Marabahan (Kab. Barito Kuala)",
  "Batulicin (Kab. Tanah Bumbu)",
  "Kotabaru",
];

export default function UMKMProfileClient({
  umkm,
  produkCount,
  latestMonitoring,
}: {
  umkm: any;
  produkCount: number;
  latestMonitoring: any;
}) {
  const [activeTab, setActiveTab] = useState<"analisis" | "edit">("analisis");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const getSwal = () => {
    if (typeof window !== "undefined") {
      return (window as any).Swal;
    }
    return null;
  };

  // 1. Calculate Score Breakdown
  const breakdown = {
    omzet: { score: 0, max: 30, value: 0, desc: "Kurang dari Rp 2.000.000" },
    produk: { score: 0, max: 20, value: produkCount, desc: "Tidak ada produk" },
    pekerja: { score: 0, max: 15, value: 0, desc: "Tidak ada data tenaga kerja" },
    pelanggan: { score: 0, max: 15, value: 0, desc: "Tidak ada data pelanggan" },
    legalitas: { score: 0, max: 20, value: 0, desc: "Tidak memiliki izin usaha lengkap" },
  };

  // Omzet
  if (latestMonitoring) {
    const omzet = Number(latestMonitoring.omzet || 0);
    breakdown.omzet.value = omzet;
    if (omzet >= 25000000) {
      breakdown.omzet.score = 30;
      breakdown.omzet.desc = "Sangat Tinggi (≥ Rp 25 Juta)";
    } else if (omzet >= 15000000) {
      breakdown.omzet.score = 25;
      breakdown.omzet.desc = "Tinggi (≥ Rp 15 Juta)";
    } else if (omzet >= 10000000) {
      breakdown.omzet.score = 20;
      breakdown.omzet.desc = "Cukup Tinggi (≥ Rp 10 Juta)";
    } else if (omzet >= 5000000) {
      breakdown.omzet.score = 15;
      breakdown.omzet.desc = "Menengah (≥ Rp 5 Juta)";
    } else if (omzet >= 2000000) {
      breakdown.omzet.score = 10;
      breakdown.omzet.desc = "Rendah (≥ Rp 2 Juta)";
    } else {
      breakdown.omzet.score = 5;
      breakdown.omzet.desc = "Sangat Rendah (< Rp 2 Juta)";
    }
  }

  // Produk
  if (produkCount >= 5) {
    breakdown.produk.score = 20;
    breakdown.produk.desc = "Sangat Baik (≥ 5 Produk)";
  } else if (produkCount >= 3) {
    breakdown.produk.score = 15;
    breakdown.produk.desc = "Baik (≥ 3 Produk)";
  } else if (produkCount >= 2) {
    breakdown.produk.score = 10;
    breakdown.produk.desc = "Cukup (≥ 2 Produk)";
  } else if (produkCount >= 1) {
    breakdown.produk.score = 5;
    breakdown.produk.desc = "Kurang (1 Produk)";
  }

  // Pekerja
  if (latestMonitoring) {
    const tk = Number(latestMonitoring.jumlah_tenaga_kerja || 0);
    breakdown.pekerja.value = tk;
    if (tk >= 8) {
      breakdown.pekerja.score = 15;
      breakdown.pekerja.desc = "Sangat Baik (≥ 8 Pekerja)";
    } else if (tk >= 5) {
      breakdown.pekerja.score = 12;
      breakdown.pekerja.desc = "Baik (≥ 5 Pekerja)";
    } else if (tk >= 3) {
      breakdown.pekerja.score = 8;
      breakdown.pekerja.desc = "Cukup (≥ 3 Pekerja)";
    } else if (tk >= 1) {
      breakdown.pekerja.score = 5;
      breakdown.pekerja.desc = "Kurang (1-2 Pekerja)";
    }
  }

  // Pelanggan
  if (latestMonitoring) {
    const pl = Number(latestMonitoring.jumlah_pelanggan || 0);
    breakdown.pelanggan.value = pl;
    if (pl >= 200) {
      breakdown.pelanggan.score = 15;
      breakdown.pelanggan.desc = "Jangkauan Luas (≥ 200 Pelanggan)";
    } else if (pl >= 100) {
      breakdown.pelanggan.score = 12;
      breakdown.pelanggan.desc = "Jangkauan Menengah (≥ 100 Pelanggan)";
    } else if (pl >= 50) {
      breakdown.pelanggan.score = 8;
      breakdown.pelanggan.desc = "Jangkauan Cukup (≥ 50 Pelanggan)";
    } else if (pl >= 20) {
      breakdown.pelanggan.score = 5;
      breakdown.pelanggan.desc = "Jangkauan Terbatas (≥ 20 Pelanggan)";
    }
  }

  // Legalitas
  const legals: string[] = [];
  if (umkm.nib) {
    breakdown.legalitas.score += 7;
    legals.push("NIB");
  }
  if (umkm.sertifikat_halal) {
    breakdown.legalitas.score += 7;
    legals.push("Halal");
  }
  if (umkm.sertifikat_pirt) {
    breakdown.legalitas.score += 6;
    legals.push("PIRT");
  }
  breakdown.legalitas.value = legals.length;
  if (legals.length > 0) {
    breakdown.legalitas.desc = "Memiliki izin: " + legals.join(", ");
  }

  // 2. Legalitas Warnings
  const warnings: { type: "danger" | "warning"; icon: string; msg: string }[] = [];
  const today = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(today.getDate() + 30);

  const checkCert = (name: string, file: string | null, expiryDate: string | null) => {
    if (!file || !expiryDate) {
      warnings.push({
        type: "danger",
        icon: "bi-x-circle",
        msg: `Anda belum melengkapi dokumen atau masa berlaku <b>${name}</b>.`,
      });
    } else {
      const exp = new Date(expiryDate);
      if (exp < today) {
        warnings.push({
          type: "danger",
          icon: "bi-x-circle",
          msg: `<b>${name}</b> Anda telah kadaluarsa pada ${exp.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}.`,
        });
      } else if (exp <= thirtyDays) {
        warnings.push({
          type: "warning",
          icon: "bi-exclamation-triangle",
          msg: `<b>${name}</b> Anda akan segera kadaluarsa pada ${exp.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}.`,
        });
      }
    }
  };

  checkCert("NIB", umkm.dokumen_nib, umkm.nib_berlaku);
  checkCert("Sertifikat Halal", umkm.sertifikat_halal, umkm.halal_berlaku);
  checkCert("Sertifikat PIRT", umkm.sertifikat_pirt, umkm.pirt_berlaku);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const Swal = getSwal();

    try {
      const res = await updateUmkm(formData);
      if (res.success) {
        if (Swal) {
          await Swal.fire({
            icon: "success",
            title: "Berhasil!",
            text: "Profil UMKM Anda berhasil diperbarui.",
            confirmButtonColor: "#4f46e5",
          });
        }
        window.location.reload();
      } else {
        if (Swal) {
          await Swal.fire({
            icon: "error",
            title: "Gagal!",
            text: res.message || "Gagal memperbarui profil.",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    } catch (err: any) {
      if (Swal) {
        await Swal.fire({
          icon: "error",
          title: "Error!",
          text: err.message || "Terjadi kesalahan sistem.",
          confirmButtonColor: "#ef4444",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="content-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1 fw-bold text-dark">
            <i className="bi bi-shop text-primary me-2"></i> Info UMKM
          </h4>
          <p className="text-muted mb-0">
            Kelola informasi profil, kredensial, dan pantau skor usahamu di sini
          </p>
        </div>
      </div>

      {/* Nav Tabs */}
      <ul
        className="nav nav-tabs custom-tabs mb-4 d-flex"
        style={{ borderBottom: "2px solid rgba(0,0,0,0.05)" }}
      >
        <li className="nav-item">
          <button
            onClick={() => setActiveTab("analisis")}
            className={`nav-link fw-bold px-4 py-3 border-0 transition-all ${
              activeTab === "analisis"
                ? "text-primary border-bottom border-3 border-primary active"
                : "text-muted"
            }`}
            style={{
              background: "transparent",
              borderBottom: activeTab === "analisis" ? "3px solid #4f46e5 !important" : "none",
            }}
          >
            <i className="bi bi-clipboard-data me-1"></i> Analisis & Rekomendasi AI
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab("edit")}
            className={`nav-link fw-bold px-4 py-3 border-0 transition-all ${
              activeTab === "edit"
                ? "text-primary border-bottom border-3 border-primary active"
                : "text-muted"
            }`}
            style={{
              background: "transparent",
              borderBottom: activeTab === "edit" ? "3px solid #4f46e5 !important" : "none",
            }}
          >
            <i className="bi bi-person-lines-fill me-1"></i> Profil & Akun
          </button>
        </li>
      </ul>

      <div className="tab-content">
        {/* TAB 1: Analisis Usaha */}
        {activeTab === "analisis" && (
          <div className="row g-4 animate-fade-in">
            {/* Kolom Kiri: Profil Singkat & AI */}
            <div className="col-lg-4">
              <div className="panel mb-4 text-center border-0 shadow-sm rounded-4">
                <div className="panel-body p-4">
                  <div className="mb-3">
                    <div
                      className="avatar bg-primary bg-opacity-10 text-primary fs-1 mx-auto"
                      style={{
                        width: "80px",
                        height: "80px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                      }}
                    >
                      <i className="bi bi-shop"></i>
                    </div>
                  </div>
                  <h5 className="fw-bold mb-1">{umkm.nama_umkm}</h5>
                  <p className="text-muted fs-sm mb-3">{umkm.nama_pemilik}</p>

                  <div className="d-flex justify-content-center align-items-center gap-2 mb-4">
                    <h2 className="mb-0 fw-bold text-primary" style={{ fontSize: "3rem" }}>
                      {Math.round(umkm.skor_usaha || 0)}
                    </h2>
                    <span className="text-muted fw-bold">/ 100</span>
                  </div>

                  <div className="mb-2">
                    <span
                      className={`badge bg-primary bg-opacity-10 text-primary fs-6 px-4 py-2 rounded-pill`}
                    >
                      {umkm.status_usaha || "Pemula"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="panel border-0 shadow-sm rounded-4">
                <div className="panel-header border-bottom-0 pt-4 pb-2 px-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-robot text-primary me-2"></i> Rekomendasi AI
                  </h5>
                </div>
                <div className="panel-body px-4 pb-4">
                  <div
                    className="p-3 mb-4 rounded-3"
                    style={{
                      background: "linear-gradient(145deg, rgba(79,70,229,0.05), rgba(79,70,229,0.1))",
                      border: "1px dashed rgba(79,70,229,0.2)",
                    }}
                  >
                    <p className="mb-0 fs-sm" style={{ lineHeight: "1.6" }}>
                      {umkm.rekomendasi || "Sistem belum meng-generate rekomendasi otomatis."}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/umkm/learnbook/${umkm.id}`}
                    className="btn btn-primary w-100 rounded-pill py-2 shadow-sm text-center text-white"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                      border: "none",
                    }}
                  >
                    <i className="bi bi-journal-text me-2"></i> Buka Learn Book AI
                  </Link>
                </div>
              </div>

              {/* Notifikasi Peringatan Legalitas */}
              {warnings.length > 0 ? (
                <div
                  className="panel border-0 shadow-sm rounded-4 mt-4"
                  style={{
                    background: "linear-gradient(145deg, rgba(239,68,68,0.05), rgba(239,68,68,0.1))",
                    border: "1px dashed rgba(239,68,68,0.3)",
                  }}
                >
                  <div className="panel-header border-bottom-0 pt-4 pb-2 px-4">
                    <h6 className="fw-bold mb-0 text-danger">
                      <i className="bi bi-shield-exclamation me-2"></i> Peringatan Legalitas
                    </h6>
                  </div>
                  <div className="panel-body px-4 pb-4">
                    <div className="d-flex flex-column gap-3">
                      {warnings.map((w, index) => (
                        <div
                          key={index}
                          className={`d-flex align-items-start gap-3 p-3 rounded-3 bg-white shadow-sm border border-${w.type} border-opacity-25`}
                        >
                          <div className={`text-${w.type} fs-4 mt-n1`}>
                            <i className={`bi ${w.icon}`}></i>
                          </div>
                          <div>
                            <p
                              className="mb-0 fs-sm"
                              style={{ lineHeight: "1.5" }}
                              dangerouslySetInnerHTML={{ __html: w.msg }}
                            ></p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveTab("edit")}
                      className="btn btn-outline-danger w-100 rounded-pill py-2 mt-3 fs-sm"
                    >
                      <i className="bi bi-pencil-square me-1"></i> Lengkapi Sekarang
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="panel border-0 shadow-sm rounded-4 mt-4"
                  style={{
                    background: "linear-gradient(145deg, rgba(34,197,94,0.05), rgba(34,197,94,0.1))",
                    border: "1px dashed rgba(34,197,94,0.3)",
                  }}
                >
                  <div className="panel-body p-4 text-center">
                    <div className="text-success fs-1 mb-2">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <h6 className="fw-bold text-success mb-1">Legalitas Lengkap</h6>
                    <p className="fs-sm text-muted mb-0">
                      Semua dokumen izin usaha Anda berstatus valid dan aktif.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Kolom Kanan: Rincian Penilaian */}
            <div className="col-lg-8">
              <div className="panel border-0 shadow-sm rounded-4 h-100">
                <div className="panel-header border-bottom-0 pt-4 pb-2 px-4">
                  <h5 className="fw-bold mb-0">
                    <i className="bi bi-list-check text-success me-2"></i> Rincian Parameter Penilaian
                  </h5>
                </div>
                <div className="panel-body p-4">
                  <div className="list-group list-group-flush gap-3">
                    {/* 1. Omzet */}
                    <div className="list-group-item p-4 rounded-3 border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-cash-stack text-success me-2"></i> Omzet Bulanan
                        </h6>
                        <span className="fw-bold fs-5 text-success">
                          {breakdown.omzet.score}{" "}
                          <span className="fs-sm text-muted fw-normal">
                            / {breakdown.omzet.max} pts
                          </span>
                        </span>
                      </div>
                      <div className="progress mb-3 bg-white" style={{ height: "12px", borderRadius: "10px" }}>
                        <div
                          className="progress-bar bg-success rounded-pill"
                          style={{
                            width: `${(breakdown.omzet.score / breakdown.omzet.max) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted fs-sm">
                        <span>
                          <i className="bi bi-info-circle me-1"></i> {breakdown.omzet.desc}
                        </span>
                        <span className="fw-bold text-heading">
                          Rp {breakdown.omzet.value.toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>

                    {/* 2. Produk */}
                    <div className="list-group-item p-4 rounded-3 border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-box-seam text-info me-2"></i> Variasi Produk
                        </h6>
                        <span className="fw-bold fs-5 text-info">
                          {breakdown.produk.score}{" "}
                          <span className="fs-sm text-muted fw-normal">
                            / {breakdown.produk.max} pts
                          </span>
                        </span>
                      </div>
                      <div className="progress mb-3 bg-white" style={{ height: "12px", borderRadius: "10px" }}>
                        <div
                          className="progress-bar bg-info rounded-pill"
                          style={{
                            width: `${(breakdown.produk.score / breakdown.produk.max) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted fs-sm">
                        <span>
                          <i className="bi bi-info-circle me-1"></i> {breakdown.produk.desc}
                        </span>
                        <span className="fw-bold text-heading">{breakdown.produk.value} produk</span>
                      </div>
                    </div>

                    {/* 3. Pekerja */}
                    <div className="list-group-item p-4 rounded-3 border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-person-workspace text-warning me-2"></i> Serapan Tenaga Kerja
                        </h6>
                        <span className="fw-bold fs-5 text-warning">
                          {breakdown.pekerja.score}{" "}
                          <span className="fs-sm text-muted fw-normal">
                            / {breakdown.pekerja.max} pts
                          </span>
                        </span>
                      </div>
                      <div className="progress mb-3 bg-white" style={{ height: "12px", borderRadius: "10px" }}>
                        <div
                          className="progress-bar bg-warning rounded-pill"
                          style={{
                            width: `${(breakdown.pekerja.score / breakdown.pekerja.max) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted fs-sm">
                        <span>
                          <i className="bi bi-info-circle me-1"></i> {breakdown.pekerja.desc}
                        </span>
                        <span className="fw-bold text-heading">{breakdown.pekerja.value} orang</span>
                      </div>
                    </div>

                    {/* 4. Pelanggan */}
                    <div className="list-group-item p-4 rounded-3 border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-people text-primary me-2"></i> Jangkauan Pelanggan
                        </h6>
                        <span className="fw-bold fs-5 text-primary">
                          {breakdown.pelanggan.score}{" "}
                          <span className="fs-sm text-muted fw-normal">
                            / {breakdown.pelanggan.max} pts
                          </span>
                        </span>
                      </div>
                      <div className="progress mb-3 bg-white" style={{ height: "12px", borderRadius: "10px" }}>
                        <div
                          className="progress-bar bg-primary rounded-pill"
                          style={{
                            width: `${(breakdown.pelanggan.score / breakdown.pelanggan.max) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted fs-sm">
                        <span>
                          <i className="bi bi-info-circle me-1"></i> {breakdown.pelanggan.desc}
                        </span>
                        <span className="fw-bold text-heading">{breakdown.pelanggan.value} pelanggan</span>
                      </div>
                    </div>

                    {/* 5. Legalitas */}
                    <div className="list-group-item p-4 rounded-3 border bg-light">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold mb-0">
                          <i className="bi bi-shield-check text-danger me-2"></i> Legalitas Usaha
                        </h6>
                        <span className="fw-bold fs-5 text-danger">
                          {breakdown.legalitas.score}{" "}
                          <span className="fs-sm text-muted fw-normal">
                            / {breakdown.legalitas.max} pts
                          </span>
                        </span>
                      </div>
                      <div className="progress mb-3 bg-white" style={{ height: "12px", borderRadius: "10px" }}>
                        <div
                          className="progress-bar bg-danger rounded-pill"
                          style={{
                            width: `${(breakdown.legalitas.score / breakdown.legalitas.max) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between text-muted fs-sm">
                        <span>
                          <i className="bi bi-info-circle me-1"></i> {breakdown.legalitas.desc}
                        </span>
                        <span className="fw-bold text-heading">{breakdown.legalitas.value} sertifikat</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Profil & Akun */}
        {activeTab === "edit" && (
          <div className="panel border-0 shadow-sm rounded-4 animate-fade-in">
            <div className="panel-header pt-4 px-4 pb-0 border-bottom-0">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-pencil-square text-primary me-2"></i> Perbarui Data Usaha & Akun
              </h5>
            </div>
            <div className="panel-body p-4">
              <form onSubmit={handleSubmit}>
                <input type="hidden" name="id" value={umkm.id} />

                <h6 className="fw-bold mb-3 text-primary">
                  <i className="bi bi-person-vcard me-2"></i> Informasi Dasar
                </h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Nama UMKM <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="nama_umkm"
                        className="form-control form-control-custom bg-light"
                        defaultValue={umkm.nama_umkm || ""}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Nama Pemilik <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="nama_pemilik"
                        className="form-control form-control-custom bg-light"
                        defaultValue={umkm.nama_pemilik || ""}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">No. Telepon</label>
                      <input
                        type="text"
                        name="no_telpon"
                        className="form-control form-control-custom bg-light"
                        defaultValue={umkm.no_telpon || ""}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="form-control form-control-custom bg-light"
                        defaultValue={umkm.email || ""}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">
                        Password Baru <span className="text-muted fs-xs">(isi jika ingin mengubah sandi)</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        className="form-control form-control-custom bg-light"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Domisili / Kota <span className="text-danger">*</span></label>
                      <select
                        name="domisili"
                        className="form-control form-control-custom bg-light"
                        defaultValue={umkm.domisili || ""}
                        required
                      >
                        <option value="">-- Pilih Kota / Kabupaten --</option>
                        {DOMISILI_KALSEL.map((kota, idx) => (
                          <option key={idx} value={kota}>
                            {kota}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Alamat Lengkap</label>
                      <textarea
                        name="alamat"
                        className="form-control form-control-custom bg-light"
                        rows={2}
                        defaultValue={umkm.alamat || ""}
                      ></textarea>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Deskripsi Usaha</label>
                      <textarea
                        name="deskripsi"
                        className="form-control form-control-custom bg-light"
                        rows={3}
                        defaultValue={umkm.deskripsi || ""}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold mb-3 text-primary">
                  <i className="bi bi-file-earmark-check me-2"></i> Legalitas & Sertifikasi
                </h6>
                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 text-center h-100 bg-light">
                      <h6 className="fw-bold fs-sm mb-3">Nomor Induk Berusaha (NIB)</h6>
                      <div className="form-group-custom text-start mb-2">
                        <label className="fs-xs fw-semibold">No. NIB</label>
                        <input
                          type="text"
                          name="nib"
                          className="form-control form-control-custom form-control-sm bg-white"
                          defaultValue={umkm.nib || ""}
                        />
                      </div>
                      <div className="form-group-custom text-start mb-2">
                        <label className="fs-xs fw-semibold">File Dokumen</label>
                        {umkm.dokumen_nib && (
                          <div className="mb-1 fs-xs text-success">
                            <i className="bi bi-check-circle"></i> Sudah Diupload ({umkm.dokumen_nib})
                          </div>
                        )}
                        <input
                          type="file"
                          name="dokumen_nib"
                          className="form-control form-control-custom form-control-sm bg-white"
                          accept=".pdf,.jpg,.png"
                        />
                      </div>
                      <div className="form-group-custom text-start mb-0">
                        <label className="fs-xs fw-semibold">Masa Berlaku</label>
                        <input
                          type="date"
                          name="nib_berlaku"
                          className="form-control form-control-custom form-control-sm bg-white"
                          defaultValue={umkm.nib_berlaku || ""}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 text-center h-100 bg-light">
                      <h6 className="fw-bold fs-sm mb-3">Sertifikat Halal</h6>
                      <div className="form-group-custom text-start mb-2">
                        <label className="fs-xs fw-semibold">File Sertifikat</label>
                        {umkm.sertifikat_halal && (
                          <div className="mb-1 fs-xs text-success">
                            <i className="bi bi-check-circle"></i> Sudah Diupload ({umkm.sertifikat_halal})
                          </div>
                        )}
                        <input
                          type="file"
                          name="sertifikat_halal"
                          className="form-control form-control-custom form-control-sm bg-white"
                          accept=".pdf,.jpg,.png"
                        />
                      </div>
                      <div className="form-group-custom text-start mb-0 mt-auto">
                        <label className="fs-xs fw-semibold">Masa Berlaku</label>
                        <input
                          type="date"
                          name="halal_berlaku"
                          className="form-control form-control-custom form-control-sm bg-white"
                          defaultValue={umkm.halal_berlaku || ""}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 text-center h-100 bg-light">
                      <h6 className="fw-bold fs-sm mb-3">Sertifikat PIRT</h6>
                      <div className="form-group-custom text-start mb-2">
                        <label className="fs-xs fw-semibold">File Sertifikat</label>
                        {umkm.sertifikat_pirt && (
                          <div className="mb-1 fs-xs text-success">
                            <i className="bi bi-check-circle"></i> Sudah Diupload ({umkm.sertifikat_pirt})
                          </div>
                        )}
                        <input
                          type="file"
                          name="sertifikat_pirt"
                          className="form-control form-control-custom form-control-sm bg-white"
                          accept=".pdf,.jpg,.png"
                        />
                      </div>
                      <div className="form-group-custom text-start mb-0 mt-auto">
                        <label className="fs-xs fw-semibold">Masa Berlaku</label>
                        <input
                          type="date"
                          name="pirt_berlaku"
                          className="form-control form-control-custom form-control-sm bg-white"
                          defaultValue={umkm.pirt_berlaku || ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn btn-primary px-4 py-2 rounded-pill shadow-sm text-white"
                    style={{
                      background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                      border: "none",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i> Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
