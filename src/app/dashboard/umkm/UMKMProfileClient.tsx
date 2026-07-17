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
  pelatihanList = [],
  kehadiranList = [],
  dynamicBreakdown,
  isAdmin = false,
  initialTab = "analisis",
}: {
  umkm: any;
  produkCount: number;
  latestMonitoring: any;
  pelatihanList?: any[];
  kehadiranList?: any[];
  dynamicBreakdown?: any;
  isAdmin?: boolean;
  initialTab?: "analisis" | "edit";
}) {
  const [activeTab, setActiveTab] = useState<"analisis" | "edit">(initialTab);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllTrainings, setShowAllTrainings] = useState(false);
  
  const getSwal = () => {
    if (typeof window !== "undefined") {
      return (window as any).Swal;
    }
    return null;
  };

  // 1. Use Dynamic Score Breakdown
  const breakdown = dynamicBreakdown || {
    omzet: { score: 0, max: 100, value: 0, desc: "Belum memenuhi kriteria" }
  };

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
            className={`nav-link fw-bold px-3 py-2 border-0 transition-all ${
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
            className={`nav-link fw-bold px-3 py-2 border-0 transition-all ${
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
                        width: "60px",
                        height: "60px",
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

                  <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
                    <h2 className="mb-0 fw-bold text-primary" style={{ fontSize: "2.5rem" }}>
                      {breakdown.omzet.score}
                    </h2>
                    <span className="text-muted fw-bold">pts</span>
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
              <div className="d-flex flex-column gap-3 h-100">
                
                {/* 1. Omzet Premium Widget */}
                <div 
                  className="p-4 rounded-4 position-relative overflow-hidden shadow-sm" 
                  style={{ 
                    background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.02) 100%)", 
                    border: "1px solid rgba(16,185,129,0.2)" 
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-4 position-relative" style={{ zIndex: 1 }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: "42px", height: "42px", fontSize: "1.2rem" }}>
                        <i className="bi bi-cash-coin"></i>
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0 text-dark">Omzet Bulanan</h6>
                        <span className="text-muted" style={{ fontSize: "0.8rem" }}>Parameter Utama</span>
                      </div>
                    </div>
                    <div className="text-end">
                       <h3 className="fw-bold mb-0 text-success d-inline-block me-1">{breakdown.omzet.score}</h3>
                       <span className="text-muted fw-semibold fs-sm">/ {breakdown.omzet.max} pts</span>
                    </div>
                  </div>
                  
                  <div className="progress bg-white shadow-sm mb-4 position-relative" style={{ height: "12px", borderRadius: "10px", zIndex: 1, border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div
                      className="progress-bar bg-success rounded-pill"
                      style={{
                        width: `${(breakdown.omzet.score / breakdown.omzet.max) * 100}%`,
                        background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)"
                      }}
                    ></div>
                  </div>
                  
                  <div className="d-flex justify-content-between align-items-end position-relative" style={{ zIndex: 1 }}>
                    <span className="badge bg-white text-success border border-success border-opacity-25 shadow-sm rounded-pill px-3 py-2 fs-sm fw-semibold">
                       <i className="bi bi-graph-up-arrow me-2"></i> {breakdown.omzet.desc}
                    </span>
                    <div className="text-end">
                      <span className="d-block text-muted mb-1" style={{ fontSize: "0.75rem" }}>Total Pendapatan</span>
                      <span className="fw-bolder fs-4 text-dark" style={{ letterSpacing: "-0.5px" }}>
                        Rp {breakdown.omzet.value.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                  
                  {/* Decorative Background Icon */}
                  <i className="bi bi-wallet2 position-absolute text-success" style={{ fontSize: "12rem", right: "-20px", bottom: "-30px", opacity: 0.05, transform: "rotate(-15deg)", zIndex: 0 }}></i>
                </div>

                {/* 2. Jadwal Pelatihan & Absensi - Modern Timeline */}
                <div 
                  className="p-4 rounded-4 shadow-sm flex-grow-1" 
                  style={{ 
                    background: "linear-gradient(to bottom right, #ffffff, #f8fafc)", 
                    border: "1px solid rgba(0,0,0,0.05)" 
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-2">
                      <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "36px", height: "36px" }}>
                        <i className="bi bi-calendar-check fs-5"></i>
                      </div>
                      <h6 className="fw-bold mb-0 text-dark">Riwayat Pelatihan</h6>
                    </div>
                  </div>
                  
                  {pelatihanList.length === 0 ? (
                    <div className="text-center py-5">
                       <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "64px", height: "64px" }}>
                         <i className="bi bi-inbox text-muted fs-2 opacity-50"></i>
                       </div>
                       <h6 className="text-muted fw-semibold">Belum ada jadwal pelatihan</h6>
                       <p className="text-muted fs-sm mx-auto" style={{ maxWidth: "250px" }}>Jadwal pelatihan dan event yang Anda ikuti akan muncul di sini.</p>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 position-relative">
                      {/* Timeline Line Generator */}
                      <div className="position-absolute h-100" style={{ left: "19px", top: "15px", width: "2px", background: "linear-gradient(to bottom, rgba(79,70,229,0.3) 0%, rgba(79,70,229,0.05) 100%)", zIndex: 0 }}></div>
                      
                      {(showAllTrainings ? pelatihanList : pelatihanList.slice(0, 3)).map((p: any) => {
                        const isUpcoming = new Date(p.tanggal) >= new Date();
                        const kehadiran = kehadiranList.find((k: any) => k.pelatihan_id === p.id);
                        
                        let statusBadge = <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1"><i className="bi bi-clock-history me-1"></i>Selesai</span>;
                        let statusColor = "#94a3b8"; // slate-400
                        let iconClass = "bi-check2-all";

                        if (!isUpcoming) {
                          if (kehadiran) {
                            if (kehadiran.status_hadir === 'hadir') {
                               statusBadge = <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2 py-1"><i className="bi bi-check-circle-fill me-1"></i>Hadir</span>;
                               statusColor = "#10b981"; // emerald-500
                               iconClass = "bi-check-lg";
                            } else if (kehadiran.status_hadir === 'izin') {
                               statusBadge = <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 rounded-pill px-2 py-1"><i className="bi bi-envelope-paper-fill me-1"></i>Izin</span>;
                               statusColor = "#f59e0b"; // amber-500
                               iconClass = "bi-envelope";
                            } else {
                               statusBadge = <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i>Tidak Hadir</span>;
                               statusColor = "#ef4444"; // red-500
                               iconClass = "bi-x-lg";
                            }
                          } else {
                            statusBadge = <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1"><i className="bi bi-x-circle-fill me-1"></i>Alpa</span>;
                            statusColor = "#ef4444";
                            iconClass = "bi-x-lg";
                          }
                        } else {
                           statusBadge = <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-2 py-1"><i className="bi bi-hourglass-split me-1"></i>Segera</span>;
                           statusColor = "#3b82f6"; // blue-500
                           iconClass = "bi-calendar-plus";
                        }
                        
                        return (
                          <div key={p.id} className="d-flex gap-3 align-items-start position-relative" style={{ zIndex: 1 }}>
                            {/* Timeline Dot */}
                            <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm mt-1" style={{ width: "40px", height: "40px", border: `2.5px solid ${statusColor}`, flexShrink: 0 }}>
                               <i className={`bi ${iconClass}`} style={{ color: statusColor, fontSize: "1.1rem" }}></i>
                            </div>
                            
                            {/* Card Content */}
                            <div className="flex-grow-1 p-3 bg-white rounded-4 shadow-sm" style={{ border: "1px solid rgba(0,0,0,0.06)", transition: "transform 0.2s ease, box-shadow 0.2s ease", cursor: "default" }}>
                              <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                  <h6 className="fw-bold mb-1 text-dark" style={{ lineHeight: "1.4", fontSize: "0.95rem" }}>{p.nama_pelatihan}</h6>
                                  <div className="text-muted" style={{fontSize: "0.8rem"}}>
                                    <i className="bi bi-calendar3 text-primary opacity-75 me-1"></i> 
                                    {new Date(p.tanggal).toLocaleDateString("id-ID", {
                                      day: "numeric", month: "long", year: "numeric"
                                    })}
                                  </div>
                                </div>
                                <div className="ms-2 flex-shrink-0">
                                  {statusBadge}
                                </div>
                              </div>
                              <div className="d-flex flex-wrap gap-3 text-muted mt-3 pt-2 border-top border-opacity-10" style={{fontSize: "0.8rem"}}>
                                <span className="d-flex align-items-center"><i className="bi bi-geo-alt-fill text-danger opacity-75 me-1 fs-6"></i> {p.lokasi}</span>
                                <span className="d-flex align-items-center"><i className="bi bi-person-badge-fill text-info opacity-75 me-1 fs-6"></i> {p.pemateri}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {pelatihanList.length > 3 && (
                        <div className="text-center mt-3 position-relative" style={{ zIndex: 1 }}>
                            <button 
                              onClick={() => setShowAllTrainings(!showAllTrainings)}
                              className="btn rounded-pill px-4 shadow-sm fw-semibold"
                              style={{ 
                                border: "1px solid rgba(79,70,229,0.2)", 
                                fontSize: "0.85rem", 
                                background: "linear-gradient(to right, #ffffff, #f8fafc)",
                                color: "#4f46e5"
                              }}
                            >
                              {showAllTrainings ? (
                                <><i className="bi bi-chevron-up me-1"></i> Sembunyikan</>
                              ) : (
                                <><i className="bi bi-chevron-down me-1"></i> Tampilkan Semua ({pelatihanList.length})</>
                              )}
                            </button>
                        </div>
                      )}
                    </div>
                  )}
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
                        className={`form-control form-control-custom ${!isAdmin ? 'bg-secondary bg-opacity-10 text-muted' : 'bg-light'}`}
                        defaultValue={umkm.nama_umkm || ""}
                        readOnly={!isAdmin}
                        required
                        title={!isAdmin ? "Hubungi Admin/Fasilitator untuk mengubah data ini" : ""}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Nama Pemilik <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        name="nama_pemilik"
                        className={`form-control form-control-custom ${!isAdmin ? 'bg-secondary bg-opacity-10 text-muted' : 'bg-light'}`}
                        defaultValue={umkm.nama_pemilik || ""}
                        readOnly={!isAdmin}
                        required
                        title={!isAdmin ? "Hubungi Admin/Fasilitator untuk mengubah data ini" : ""}
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
                        className={`form-control form-control-custom ${!isAdmin ? 'bg-secondary bg-opacity-10 text-muted' : 'bg-light'}`}
                        defaultValue={umkm.email || ""}
                        readOnly={!isAdmin}
                        title={!isAdmin ? "Hubungi Admin/Fasilitator untuk mengubah data ini" : ""}
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
                        name={isAdmin ? "domisili" : undefined}
                        className={`form-control form-control-custom ${!isAdmin ? 'bg-secondary bg-opacity-10 text-muted' : 'bg-light'}`}
                        defaultValue={umkm.domisili || ""}
                        disabled={!isAdmin}
                        required
                        title={!isAdmin ? "Hubungi Admin/Fasilitator untuk mengubah data ini" : ""}
                      >
                        <option value="">-- Pilih Kota / Kabupaten --</option>
                        {DOMISILI_KALSEL.map((kota, idx) => (
                          <option key={idx} value={kota}>
                            {kota}
                          </option>
                        ))}
                      </select>
                      {/* Hidden input to submit the disabled select value */}
                      {!isAdmin && <input type="hidden" name="domisili" value={umkm.domisili || ""} />}
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="form-group-custom">
                      <label className="form-label fs-sm fw-semibold">Alamat Lengkap</label>
                      <textarea
                        name="alamat"
                        className={`form-control form-control-custom ${!isAdmin ? 'bg-secondary bg-opacity-10 text-muted' : 'bg-light'}`}
                        rows={2}
                        defaultValue={umkm.alamat || ""}
                        readOnly={!isAdmin}
                        title={!isAdmin ? "Hubungi Admin/Fasilitator untuk mengubah data ini" : ""}
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
