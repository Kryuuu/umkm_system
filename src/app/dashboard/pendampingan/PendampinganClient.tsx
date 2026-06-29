"use client";

import { useState } from "react";
import Link from "next/link";
import { createPendampingan, updatePendampingan, deletePendampingan } from "./actions";

export default function PendampinganClient({ pendampinganList, umkmList, user, activeUmkmId }: { pendampinganList: any[], umkmList: any[], user: any, activeUmkmId?: number }) {
  const [editData, setEditData] = useState<any>(null);

  const openEdit = (p: any) => {
    setEditData(p);
    if (typeof window !== "undefined" && window.bootstrap) {
      const modal = new window.bootstrap.Modal(document.getElementById('editPendampinganModal'));
      modal.show();
    }
  };

  const handleCreate = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await createPendampingan(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('addPendampinganModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Pendampingan berhasil ditambahkan!'});
          }
          e.target.reset();
      } else {
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Terjadi kesalahan.'});
          }
      }
  };

  const handleUpdate = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await updatePendampingan(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('editPendampinganModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Pendampingan berhasil diperbarui!'});
          }
      } else {
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Terjadi kesalahan.'});
          }
      }
  };

  const confirmDelete = (id: number) => {
    if (typeof window !== "undefined" && window.Swal) {
      window.Swal.fire({
          title: 'Apakah Anda Yakin?',
          text: "Data yang dihapus tidak dapat dikembalikan!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#e74c3c',
          cancelButtonColor: '#95a5a6',
          confirmButtonText: 'Ya, Hapus!',
          cancelButtonText: 'Batal',
          customClass: {
              confirmButton: 'btn btn-danger rounded-pill px-4 me-2',
              cancelButton: 'btn btn-secondary rounded-pill px-4'
          },
          buttonsStyling: false
      }).then(async (result: any) => {
          if (result.isConfirmed) {
              const res = await deletePendampingan(id);
              if (res.success) {
                  window.Swal.fire({icon: 'success', title: 'Terhapus!', text: 'Pendampingan berhasil dihapus.'});
              } else {
                  window.Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Gagal menghapus.'});
              }
          }
      });
    }
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Data Pendampingan</h5>
              <p className="text-muted fs-sm mb-0">Record kegiatan pendampingan fasilitator</p>
          </div>
          <div className="d-flex gap-2">
              {user.role !== 'umkm' && (
              <Link href="/dashboard/pendampingan" className="btn-outline-custom">
                  <i className="bi bi-arrow-left"></i> Kembali
              </Link>
              )}
              {user.role !== 'umkm' && (
              <button className="btn-primary-custom" data-bs-toggle="modal" data-bs-target="#addPendampinganModal">
                  <i className="bi bi-plus-lg"></i> Catat Pendampingan
              </button>
              )}
          </div>
      </div>

      <div className="panel">
          <div className="panel-body p-0">
              <div className="table-responsive p-3">
                  <table className="table-custom data-table" style={{width:'100%'}}>
                      <thead>
                          <tr>
                              <th>No</th>
                              <th>Tanggal</th>
                              <th>UMKM</th>
                              <th>Fasilitator</th>
                              <th>Jenis Pendampingan</th>
                              <th>Status Hasil</th>
                              <th>Catatan</th>
                              {user.role !== 'umkm' && <th>Aksi</th>}
                          </tr>
                      </thead>
                      <tbody>
                          {pendampinganList.map((p, idx) => {
                              const badgeStatus = {
                                  'Selesai': 'badge-naik-kelas',
                                  'Proses': 'badge-sedang-berkembang',
                                  'Ditolak': 'badge-batal'
                              }[p.hasil as string] || 'bg-secondary';

                              return (
                              <tr key={p.id}>
                                  <td>{idx + 1}</td>
                                  <td>{formatDate(p.tanggal)}</td>
                                  <td><strong>{p.nama_umkm || '-'}</strong></td>
                                  <td>{p.nama_fasilitator || '-'}</td>
                                  <td><span className="badge-status badge-naik-kelas">{p.jenis_pendampingan}</span></td>
                                  <td><span className={`badge-status ${badgeStatus}`}>{p.hasil}</span></td>
                                  <td className="fs-sm text-muted">{p.catatan?.substring(0, 40) || '-'}</td>
                                  {user.role !== 'umkm' && (
                                  <td>
                                      <div className="d-flex gap-1">
                                          <button className="btn-warning-custom btn-table-action" onClick={() => openEdit(p)} title="Edit"><i className="bi bi-pencil"></i></button>
                                          <button onClick={() => confirmDelete(p.id)} className="btn-danger-custom btn-table-action" title="Hapus"><i className="bi bi-trash"></i></button>
                                      </div>
                                  </td>
                                  )}
                              </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="addPendampinganModal" tabIndex={-1}>
          <div className="modal-dialog">
              <div className="modal-content border-0 rounded-4 overflow-hidden">
                  <div className="modal-header bg-primary text-white p-4">
                      <h5 className="modal-title m-0 fw-bold"><i className="bi bi-plus-circle-fill me-2"></i>Tambah Pendampingan</h5>
                      <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleCreate}>
                      <div className="modal-body p-4 bg-light">
                          <div className="row g-3">
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>UMKM Binaan</label>
                                      {activeUmkmId ? (
                                          <>
                                              <input type="hidden" name="umkm_id" value={activeUmkmId} />
                                              <input
                                                  type="text"
                                                  className="form-control form-control-custom bg-light"
                                                  value={umkmList.find(u => u.id === activeUmkmId)?.nama_umkm || ""}
                                                  readOnly
                                              />
                                          </>
                                      ) : (
                                          <select name="umkm_id" className="form-control form-control-custom" required>
                                              <option value="">-- Pilih UMKM --</option>
                                              {umkmList.map(u => (
                                                  <option key={u.id} value={u.id}>{u.nama_umkm}</option>
                                              ))}
                                          </select>
                                      )}
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Tanggal</label>
                                      <input type="date" name="tanggal" className="form-control form-control-custom" defaultValue={new Date().toISOString().split('T')[0]} required />
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Hasil / Status</label>
                                      <select name="hasil" className="form-control form-control-custom" required>
                                          <option value="Proses">Proses</option>
                                          <option value="Selesai">Selesai (+ Point)</option>
                                          <option value="Ditolak">Ditolak</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>Jenis Pendampingan</label>
                                      <select name="jenis_pendampingan" className="form-control form-control-custom" required>
                                          <option value="Manajemen Usaha">Manajemen Usaha</option>
                                          <option value="Pemasaran Digital">Pemasaran Digital</option>
                                          <option value="Pengembangan Produk">Pengembangan Produk</option>
                                          <option value="Branding">Branding</option>
                                          <option value="Legalitas Usaha">Legalitas Usaha</option>
                                          <option value="Manajemen Keuangan">Manajemen Keuangan</option>
                                          <option value="Packaging">Packaging</option>
                                          <option value="Sertifikasi">Sertifikasi</option>
                                          <option value="Ekspor">Ekspor</option>
                                          <option value="Quality Control">Quality Control</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>Catatan Pendampingan</label>
                                      <textarea name="catatan" className="form-control form-control-custom" rows={3} placeholder="Masukkan detail hasil pendampingan..."></textarea>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="modal-footer bg-white border-top-0 px-4 pb-4">
                          <button type="button" className="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
                          <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">Simpan Data</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="editModal" tabIndex={-1}>
          <div className="modal-dialog">
              <div className="modal-content border-0 rounded-4 overflow-hidden">
                  <div className="modal-header bg-warning p-4">
                      <h5 className="modal-title m-0 fw-bold text-dark"><i className="bi bi-pencil-square me-2"></i>Edit Status Pendampingan</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleUpdate}>
                      <input type="hidden" name="id" value={editData?.id || ''} />
                      <div className="modal-body p-4 bg-light">
                          <div className="row g-3">
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>UMKM</label>
                                      <select name="umkm_id" className="form-control form-control-custom" disabled defaultValue={editData?.umkm_id || ''}>
                                          {umkmList.map(u => (
                                              <option key={u.id} value={u.id}>{u.nama_umkm}</option>
                                          ))}
                                      </select>
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Tanggal</label>
                                      <input type="date" name="tanggal" className="form-control form-control-custom" required defaultValue={editData?.tanggal || ''} />
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Hasil / Status</label>
                                      <select name="hasil" className="form-control form-control-custom" required defaultValue={editData?.hasil || 'Proses'}>
                                          <option value="Proses">Proses</option>
                                          <option value="Selesai">Selesai</option>
                                          <option value="Ditolak">Ditolak</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>Jenis</label>
                                      <select name="jenis_pendampingan" className="form-control form-control-custom" required defaultValue={editData?.jenis_pendampingan || ''}>
                                          <option value="Manajemen Usaha">Manajemen Usaha</option>
                                          <option value="Pemasaran Digital">Pemasaran Digital</option>
                                          <option value="Pengembangan Produk">Pengembangan Produk</option>
                                          <option value="Branding">Branding</option>
                                          <option value="Legalitas Usaha">Legalitas Usaha</option>
                                          <option value="Manajemen Keuangan">Manajemen Keuangan</option>
                                          <option value="Packaging">Packaging</option>
                                          <option value="Sertifikasi">Sertifikasi</option>
                                          <option value="Ekspor">Ekspor</option>
                                          <option value="Quality Control">Quality Control</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>Catatan</label>
                                      <textarea name="catatan" className="form-control form-control-custom" rows={3} defaultValue={editData?.catatan || ''}></textarea>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="modal-footer bg-white border-top-0 px-4 pb-4">
                          <button type="button" className="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
                          <button type="submit" className="btn btn-warning rounded-pill px-4 fw-bold">Update Status</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
    </>
  );
}

declare global {
  interface Window {
    bootstrap: any;
    Swal: any;
  }
}
