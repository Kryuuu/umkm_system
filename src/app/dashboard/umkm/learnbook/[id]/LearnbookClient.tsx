"use client";

import { useState } from "react";
import Link from "next/link";
import { generateAiCurriculumAction, completeModuleAction } from "../../learnbookActions";

export default function LearnbookClient({
  umkm,
  modules,
  historyBatches,
  isHistoryView,
  activeBatchId,
  maxBatchId,
  user,
}: {
  umkm: any;
  modules: any[];
  historyBatches: any[];
  isHistoryView: boolean;
  activeBatchId: number;
  maxBatchId: number;
  user: any;
}) {
  const [activeModuleIndex, setActiveModuleIndex] = useState(() => {
    if (modules.length === 0) return 0;
    const activeIdx = modules.findIndex((m) => m.status === "active");
    if (activeIdx !== -1) return activeIdx;
    const allCompleted = modules.every((m) => m.status === "completed");
    if (allCompleted) return modules.length - 1;
    return 0;
  });

  const totalModules = modules.length;
  const completedModules = modules.filter((m) => m.status === "completed").length;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  const handleGenerate = async () => {
    if (typeof window === "undefined") return;
    const Swal = (window as any).Swal;

    Swal.fire({
      title: "Menganalisis Data...",
      html: `AI sedang merakit kurikulum terbaik untuk <b>${umkm.nama_umkm}</b>.<br/>Proses ini memakan waktu sekitar 10-20 detik.`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const res = await generateAiCurriculumAction(umkm.id);

    if (res.success) {
      Swal.fire({
        title: "Berhasil!",
        text: res.isFallback
          ? "Menggunakan data cadangan karena limit API Google tercapai."
          : "Kurikulum AI telah selesai dibuat.",
        icon: "success",
        confirmButtonText: "Buka Modul",
        customClass: { confirmButton: "btn btn-success rounded-pill px-4" },
        buttonsStyling: false,
      }).then(() => {
        window.location.href = `/dashboard/umkm/learnbook/${umkm.id}`;
      });
    } else {
      Swal.fire({
        title: "Gagal",
        text: res.message || "Terjadi kesalahan saat menghubungi API AI.",
        icon: "error",
      });
    }
  };

  const handleComplete = async (moduleId: number) => {
    if (typeof window === "undefined") return;
    const Swal = (window as any).Swal;

    Swal.fire({
      title: "Konfirmasi",
      text: "Apakah kamu sudah mempraktikkan tugas ini?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Selesai!",
      cancelButtonText: "Belum",
      customClass: {
        confirmButton: "btn btn-primary rounded-pill px-4 me-2",
        cancelButton: "btn btn-secondary rounded-pill px-4",
      },
      buttonsStyling: false,
    }).then(async (result: any) => {
      if (result.isConfirmed) {
        const res = await completeModuleAction(moduleId, umkm.id);
        if (res.success) {
          const successModalEl = document.getElementById("successModulModal");
          if (successModalEl && (window as any).bootstrap) {
            const successModal = new (window as any).bootstrap.Modal(successModalEl);
            successModal.show();
          } else {
            window.location.reload();
          }
        } else {
          Swal.fire("Error", res.message || "Gagal menyimpan progress.", "error");
        }
      }
    });
  };

  const handleReset = () => {
    if (typeof window === "undefined") return;
    const Swal = (window as any).Swal;

    Swal.fire({
      title: "Generate Ulang?",
      text: "Progress kamu akan disimpan sebagai riwayat dan AI akan membuat materi baru.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Generate Ulang",
      cancelButtonText: "Batal",
      customClass: {
        confirmButton: "btn btn-danger rounded-pill px-4 me-2",
        cancelButton: "btn btn-secondary rounded-pill px-4",
      },
      buttonsStyling: false,
    }).then((result: any) => {
      if (result.isConfirmed) {
        handleGenerate();
      }
    });
  };

  return (
    <>
      <div className="content-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link
            href={`/dashboard/umkm/analisis/${umkm.id}`}
            className="text-muted text-decoration-none mb-2 d-inline-block"
          >
            <i className="bi bi-arrow-left"></i> Kembali ke Analisis
          </Link>
          <h4 className="mb-1">
            <i className="bi bi-robot text-primary me-2"></i> AI Learn Book
          </h4>
          <p className="text-muted mb-0">
            Modul pembelajaran yang dikurasi khusus oleh AI untuk {umkm.nama_umkm}
          </p>
        </div>

        {(historyBatches.length > 1 || (historyBatches.length === 1 && isHistoryView)) && (
          <div>
            <button
              className="btn btn-outline-secondary rounded-pill fw-bold"
              data-bs-toggle="modal"
              data-bs-target="#historyModal"
            >
              <i className="bi bi-clock-history me-2"></i> Riwayat Kurikulum
            </button>
          </div>
        )}
      </div>

      {isHistoryView && (
        <div className="alert alert-warning border-0 bg-warning bg-opacity-10 d-flex gap-3 mb-4 rounded-4 align-items-center">
          <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
          <div>
            <strong>Mode Riwayat:</strong> Kamu sedang melihat arsip kurikulum lama. Progress pada kurikulum ini tidak
            dapat diubah lagi.{" "}
            <Link
              href={`/dashboard/umkm/learnbook/${umkm.id}`}
              className="text-warning fw-bold text-decoration-none ms-2"
            >
              Kembali ke Kurikulum Aktif <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      )}

      {modules.length === 0 ? (
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 text-center py-5">
            <div className="mb-4">
              <i className="bi bi-cpu-fill text-primary" style={{ fontSize: "5rem" }}></i>
            </div>
            <h3 className="fw-bold mb-3">Kurikulum AI Belum Dibuat</h3>
            <p className="text-muted mb-4">
              Sistem AI kami siap menganalisis kelemahan bisnis <strong>{umkm.nama_umkm}</strong> dan membuatkan materi
              belajar khusus untuk meningkatkan omzet dan kinerja UMKM ini.
            </p>

            <div id="generate-area">
              <button className="btn btn-primary btn-lg rounded-pill px-5 fw-bold" onClick={handleGenerate}>
                <i className="bi bi-stars me-2"></i> Generate Kurikulum Sekarang
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Sidebar Modul */}
          <div className="col-lg-4">
            <div className="panel mb-4">
              <div className="panel-body text-center">
                <div className="mb-3">
                  <div
                    className="avatar bg-primary bg-opacity-10 text-primary fs-1 mx-auto d-flex align-items-center justify-content-center"
                    style={{ width: "80px", height: "80px", borderRadius: "50%" }}
                  >
                    <i className="bi bi-book-half"></i>
                  </div>
                </div>
                <h5 className="fw-bold mb-1">Kurikulum Prioritas</h5>
                <p className="text-muted fs-sm mb-3">Fokus peningkatan untuk {umkm.status_usaha || "Go Modern"}</p>
                <div className="progress mb-2" style={{ height: "10px" }}>
                  <div
                    className={`progress-bar bg-success progress-bar-striped ${
                      progressPercent < 100 ? "progress-bar-animated" : ""
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="text-muted fs-sm text-end">{progressPercent}% Selesai</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header border-bottom-0 pb-0">
                <h6 className="fw-bold">
                  <i className="bi bi-list-ol me-2"></i>Daftar Materi
                </h6>
              </div>
              <div className="panel-body p-0">
                <div className="list-group list-group-flush mt-2">
                  {modules.map((m, index) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveModuleIndex(index)}
                      className={`list-group-item list-group-item-action text-start py-3 border-start border-4 ${
                        index === activeModuleIndex ? "border-primary bg-light" : "border-transparent"
                      }`}
                    >
                      <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                        <h6
                          className={`mb-0 fw-bold ${index === activeModuleIndex ? "text-primary" : ""} judul-menu-modul`}
                        >
                          {m.urutan}. {m.judul}
                        </h6>
                        <small>
                          {m.status === "completed" ? (
                            <i className="bi bi-check-circle-fill text-success"></i>
                          ) : m.status === "active" ? (
                            <i className="bi bi-unlock-fill text-primary"></i>
                          ) : (
                            <i className="bi bi-lock-fill text-muted"></i>
                          )}
                        </small>
                      </div>
                      <p className="mb-0 fs-sm text-muted">{m.deskripsi}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="panel-footer text-center p-3 bg-light rounded-bottom-4">
                <button className="btn btn-outline-danger btn-sm rounded-pill" onClick={handleReset}>
                  <i className="bi bi-arrow-clockwise"></i> Generate Ulang
                </button>
              </div>
            </div>
          </div>

          {/* Konten Materi Utama */}
          <div className="col-lg-8">
            <div className="panel h-100">
              <div className="panel-header d-flex justify-content-between align-items-center">
                <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill">
                  <i className="bi bi-stars me-1"></i> Generated by Gemini AI
                </span>
                <span className="text-muted fs-sm">
                  <i className="bi bi-clock me-1"></i> Estimasi baca: 5-10 Menit
                </span>
              </div>
              <div className="panel-body p-4 p-md-5">
                {modules.map((m, index) => {
                  if (index !== activeModuleIndex) return null;
                  return (
                    <div key={m.id} className="content-modul">
                      <h3 className="fw-bold mb-4">
                        Modul {m.urutan}: {m.judul}
                      </h3>

                      {m.status === "locked" ? (
                        <div className="alert alert-secondary border-0 bg-secondary bg-opacity-10 d-flex gap-3 mb-4 text-center py-5 rounded-4 flex-column align-items-center">
                          <i className="bi bi-lock-fill text-muted" style={{ fontSize: "3rem" }}></i>
                          <h5 className="fw-bold text-dark mt-2">Modul Terkunci</h5>
                          <p className="text-muted">Selesaikan tugas pada modul sebelumnya untuk membuka materi ini.</p>
                        </div>
                      ) : (
                        <>
                          <div
                            className="content-materi"
                            style={{ lineHeight: "1.8", fontSize: "1.05rem", color: "#4a5568" }}
                            dangerouslySetInnerHTML={{ __html: m.konten_html }}
                          />

                          {m.status === "completed" ? (
                            <div className="bg-success bg-opacity-10 p-4 rounded-4 mt-5 border border-success text-center">
                              <i className="bi bi-check-circle-fill fs-1 text-success mb-3 d-block"></i>
                              <h5 className="fw-bold mb-2 text-success">Luar Biasa! Tugas Selesai</h5>
                              <p className="text-muted mb-4">Kamu telah menyelesaikan instruksi pada modul ini.</p>

                              {index < modules.length - 1 && (
                                <button
                                  className="btn btn-success rounded-pill px-4 py-2 fw-bold"
                                  onClick={() => setActiveModuleIndex(index + 1)}
                                >
                                  Lanjut ke Modul Selanjutnya <i className="bi bi-arrow-right ms-2"></i>
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="bg-light p-4 rounded-4 mt-5 border text-center">
                              <i className="bi bi-rocket-takeoff-fill fs-1 text-primary mb-3 d-block"></i>
                              <h5 className="fw-bold mb-2 text-dark">{m.tugas_judul}</h5>
                              <p className="text-muted mb-4">{m.tugas_deskripsi}</p>

                              {!isHistoryView ? (
                                <button
                                  className="btn btn-primary rounded-pill px-4 py-2 fw-bold"
                                  onClick={() => handleComplete(m.id)}
                                >
                                  <i className="bi bi-check-circle me-2"></i> Saya Sudah Menyelesaikan Tugas Ini
                                </button>
                              ) : (
                                <button className="btn btn-secondary rounded-pill px-4 py-2 fw-bold" disabled>
                                  <i className="bi bi-lock-fill me-2"></i> Terkunci di Mode Riwayat
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <div className="modal fade" id="historyModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content border-0 rounded-4">
            <div className="modal-header border-bottom-0 pb-0">
              <h5 className="modal-title fw-bold">
                <i className="bi bi-clock-history text-primary me-2"></i> Riwayat Kurikulum AI
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <p className="text-muted fs-sm mb-4">
                Setiap kali kamu meng-generate ulang kurikulum, versi sebelumnya akan diarsipkan di sini sebagai
                perjalanan UMKM kamu.
              </p>

              <div className="list-group list-group-flush gap-2">
                {historyBatches.map((batch) => {
                  const isCurrent = batch.batch_id === maxBatchId;
                  const isActive = batch.batch_id === activeBatchId;
                  return (
                    <Link
                      key={batch.batch_id}
                      href={`/dashboard/umkm/learnbook/${umkm.id}?batch_id=${batch.batch_id}`}
                      className={`list-group-item list-group-item-action rounded-3 border ${
                        isActive ? "border-primary bg-primary bg-opacity-10" : ""
                      } p-3`}
                      onClick={() => {
                        // Dismiss modal if we click
                        if (typeof window !== "undefined" && (window as any).bootstrap) {
                          const modalEl = document.getElementById("historyModal");
                          const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
                          modal?.hide();
                        }
                      }}
                    >
                      <div className="d-flex w-100 justify-content-between align-items-center mb-1">
                        <h6 className="mb-0 fw-bold">
                          Generasi Ke-{batch.batch_id}
                          {isCurrent && <span className="badge bg-success ms-2">Aktif Saat Ini</span>}
                        </h6>
                        <small className="text-muted">
                          <i className="bi bi-calendar3"></i>{" "}
                          {new Date(batch.generated_at).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </small>
                      </div>
                      <p className="mb-0 fs-sm text-muted">Terdiri dari {batch.total_modul} modul AI.</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <div className="modal fade" id="successModulModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 rounded-4 text-center p-4">
            <div className="modal-body p-0">
              <div className="text-success mb-3">
                <i className="bi bi-check-circle-fill" style={{ fontSize: "4rem" }}></i>
              </div>
              <h4 className="fw-bold mb-2">Mantap!</h4>
              <p className="text-muted mb-4">Tugas berhasil diselesaikan. Progress belajarmu telah disimpan!</p>
              <button
                type="button"
                className="btn btn-success rounded-pill px-5 fw-bold"
                onClick={() => {
                  window.location.reload();
                }}
              >
                Oke, Lanjut!
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
