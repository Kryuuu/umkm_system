"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createKonsultasi, deleteKonsultasi } from "./actions";

export default function KonsultasiClient({ 
  threads, 
  conversations = [], 
  umkmList, 
  user, 
  isConversationsList = false 
}: { 
  threads: any[], 
  conversations?: any[], 
  umkmList: any[], 
  user: any, 
  isConversationsList?: boolean 
}) {
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo]);

  const confirmDelete = async (e: any, id: number) => {
    e.preventDefault();
    if (typeof window !== "undefined" && (window as any).Swal) {
      (window as any).Swal.fire({
        title: 'Hapus Riwayat Chat?',
        text: 'Semua pesan dalam thread ini akan terhapus secara permanen!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal',
        customClass: {
          popup: 'rounded-4'
        }
      }).then(async (result: any) => {
        if (result.isConfirmed) {
          const res = await deleteKonsultasi(id);
          if (res.success) {
            (window as any).Swal.fire({
              title: 'Berhasil!',
              text: 'Riwayat chat telah dihapus.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false,
              customClass: {
                popup: 'rounded-4'
              }
            });
          } else {
            (window as any).Swal.fire({
              title: 'Gagal!',
              text: 'Gagal menghapus: ' + res.message,
              icon: 'error',
              customClass: {
                popup: 'rounded-4'
              }
            });
          }
        }
      });
    } else {
      if (typeof window !== "undefined" && window.confirm('Yakin ingin menghapus riwayat chat ini? Semua pesan dalam thread ini akan terhapus.')) {
        const res = await deleteKonsultasi(id);
        if (res.success) {
            setAlertInfo({ type: 'success', message: "Riwayat chat berhasil dihapus." });
        } else {
            setAlertInfo({ type: 'danger', message: "Gagal menghapus: " + res.message });
        }
      }
    }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await createKonsultasi(formData);
    if (res.success) {
        setAlertInfo({ type: 'success', message: "Konsultasi baru berhasil dikirim!" });
        e.target.reset();
        // Hide modal
        if (typeof window !== "undefined") {
          const modalEl = document.getElementById('addKonsultasiModal');
          if (modalEl) {
            const bootstrap = (window as any).bootstrap;
            if (bootstrap) {
              const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
              modal.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
            }
          }
        }
    } else {
        setAlertInfo({ type: 'danger', message: "Gagal mengirim: " + res.message });
    }
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="content-header mb-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                  <h4 className="mb-1"><i className="bi bi-chat-dots-fill text-primary"></i> Konsultasi UMKM</h4>
                  <p className="text-muted mb-0">Tanya jawab antara UMKM dan Mentor/Fasilitator</p>
              </div>
              <div className="d-flex gap-2">
                  {!isConversationsList && user.role !== 'Mitra' && (
                  <Link href="/dashboard/konsultasi" className="btn btn-outline-secondary rounded-pill">
                      <i className="bi bi-arrow-left"></i> Kembali
                  </Link>
                  )}
                  <button className="btn btn-primary rounded-pill" data-bs-toggle="modal" data-bs-target="#addKonsultasiModal">
                      <i className="bi bi-plus-lg"></i> Buat Konsultasi Baru
                  </button>
              </div>
          </div>
      </div>

      {alertInfo && (
          <div className={`alert alert-${alertInfo.type} alert-dismissible fade show rounded-4 mb-4`} role="alert">
              <i className={`bi ${alertInfo.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
              {alertInfo.message}
              <button type="button" className="btn-close" onClick={() => setAlertInfo(null)} aria-label="Close"></button>
          </div>
      )}

      {/* Daftar Thread/Conversation Konsultasi */}
      <div className="panel">
          <div className="panel-body p-0">
              {isConversationsList ? (
                  conversations.length === 0 ? (
                      <div className="text-center py-5">
                          <i className="bi bi-chat-square-text fs-1 text-muted"></i>
                          <p className="text-muted mt-2">Belum ada percakapan UMKM. Klik tombol di atas untuk memulai konsultasi!</p>
                      </div>
                  ) : (
                      <div className="list-group list-group-flush">
                          {conversations.map((conv) => (
                              <Link 
                                  key={conv.umkm_id}
                                  href={`/dashboard/konsultasi?umkm_id=${conv.umkm_id}`}
                                  className="list-group-item list-group-item-action p-3"
                              >
                                  <div className="d-flex w-100 justify-content-between align-items-start gap-3">
                                      <div className="flex-grow-1">
                                          <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                                              <span className="badge bg-info rounded-pill"><i className="bi bi-shop"></i> UMKM</span>
                                              <strong className="fs-6">{conv.nama_umkm}</strong>
                                              <span className="text-muted small">({conv.nama_pemilik})</span>
                                              {conv.domisili && (
                                                  <span className="badge bg-light text-dark border ms-1">{conv.domisili}</span>
                                              )}
                                          </div>
                                          <h6 className="mb-1 fw-bold text-dark">{conv.subjek}</h6>
                                          <p className="mb-0 text-muted small">{conv.latest_message?.substring(0, 120)}...</p>
                                      </div>
                                      <div className="text-end flex-shrink-0 d-flex flex-column align-items-end justify-content-between h-100" style={{minWidth: '150px'}}>
                                          <div className="mb-2">
                                              <small className="text-muted">{formatDate(conv.latest_timestamp)}</small>
                                              {conv.unread_count > 0 && (
                                                  <><br /><span className="badge bg-danger rounded-pill mt-1">{conv.unread_count} Pesan Baru</span></>
                                              )}
                                          </div>
                                          <span className="btn btn-sm btn-outline-primary rounded-pill px-3 mt-1">
                                              Buka Chat <i className="bi bi-chevron-right ms-1"></i>
                                          </span>
                                      </div>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  )
              ) : (
                  threads.length === 0 ? (
                      <div className="text-center py-5">
                          <i className="bi bi-chat-square-text fs-1 text-muted"></i>
                          <p className="text-muted mt-2">Belum ada konsultasi. Klik tombol di atas untuk memulai!</p>
                      </div>
                  ) : (
                      <div className="list-group list-group-flush">
                          {threads.map((thread) => (
                              <div key={thread.id} className={`list-group-item p-3 ${!thread.is_read && thread.pengirim_role !== user.role ? 'bg-primary bg-opacity-10' : ''}`}>
                                  <div className="d-flex w-100 justify-content-between align-items-start gap-3">
                                      <Link href={`/dashboard/konsultasi/thread/${thread.id}`} className="flex-grow-1 text-decoration-none text-dark d-block">
                                          <div className="d-flex align-items-center gap-2 mb-1">
                                              {thread.pengirim_role === 'Mitra' && <span className="badge bg-info rounded-pill"><i className="bi bi-shop"></i> Mitra</span>}
                                              {thread.pengirim_role === 'Staff' && <span className="badge bg-warning text-dark rounded-pill"><i className="bi bi-person-badge"></i> Staff</span>}
                                              {thread.pengirim_role === 'Admin' && <span className="badge bg-danger rounded-pill"><i className="bi bi-shield-check"></i> Admin</span>}
                                              <strong>{thread.nama_umkm || 'Unknown'}</strong>
                                          </div>
                                          <h6 className="mb-1 fw-bold">{thread.subjek}</h6>
                                          <p className="mb-0 text-muted small">{thread.pesan?.substring(0, 120)}...</p>
                                      </Link>
                                      <div className="text-end flex-shrink-0 d-flex flex-column align-items-end justify-content-between h-100" style={{minWidth: '120px'}}>
                                          <div className="mb-2">
                                              <small className="text-muted">{formatDate(thread.created_at)}</small>
                                              {!thread.is_read && thread.pengirim_role !== user.role && <><br /><span className="badge bg-primary rounded-pill mt-1">Baru</span></>}
                                          </div>
                                          <button onClick={(e) => confirmDelete(e, thread.id)} className="btn btn-sm btn-outline-danger" title="Hapus Riwayat Chat">
                                              <i className="bi bi-trash"></i> Hapus
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )
              )}
          </div>
      </div>

      {/* Modal: Buat Konsultasi Baru */}
      <div className="modal fade" id="addKonsultasiModal" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
              <div className="modal-content">
                  <form onSubmit={handleCreate}>
                      <div className="modal-header">
                          <h5 className="modal-title"><i className="bi bi-chat-dots"></i> Buat Konsultasi Baru</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                      </div>
                      <div className="modal-body">
                          {user.role !== 'Mitra' && (
                          <div className="mb-3">
                              <label className="form-label fw-semibold">UMKM Terkait</label>
                              <select name="umkm_id" className="form-select" required>
                                  <option value="">-- Pilih UMKM --</option>
                                  {umkmList.map(u => (
                                      <option key={u.id} value={u.id}>{u.nama_umkm} - {u.nama_pemilik}</option>
                                  ))}
                              </select>
                          </div>
                          )}
                          <div className="mb-3">
                              <label className="form-label fw-semibold">Subjek</label>
                              <input type="text" name="subjek" className="form-control" required placeholder="Topik konsultasi..." />
                          </div>
                          <div className="mb-3">
                              <label className="form-label fw-semibold">Pesan</label>
                              <textarea name="pesan" className="form-control" rows={5} required placeholder="Tulis pertanyaan atau pesan Anda..."></textarea>
                          </div>
                      </div>
                      <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                          <button type="submit" className="btn btn-primary"><i className="bi bi-send"></i> Kirim</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
    </>
  );
}
