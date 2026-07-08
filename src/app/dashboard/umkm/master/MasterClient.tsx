"use client";

import { useState } from "react";
import Link from "next/link";
import { createUmkm, updateUmkm, deleteUmkm } from "../actions";

export default function MasterClient({ umkmList, fasilitatorList }: { umkmList: any[], fasilitatorList: any[] }) {
  const [editData, setEditData] = useState<any>(null);

  const openEdit = (u: any) => {
    setEditData(u);
    if (typeof window !== "undefined" && window.bootstrap) {
      const modal = new window.bootstrap.Modal(document.getElementById('editUmkmModal'));
      modal.show();
    }
  };

  const handleCreate = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await createUmkm(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('addUmkmModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Data UMKM berhasil ditambahkan!'});
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
      const res = await updateUmkm(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('editUmkmModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Data UMKM berhasil diperbarui!'});
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
              const res = await deleteUmkm(id);
              if (res.success) {
                  window.Swal.fire({icon: 'success', title: 'Terhapus!', text: 'Data UMKM berhasil dihapus.'});
              } else {
                  window.Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Gagal menghapus.'});
              }
          }
      });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Master Data UMKM</h5>
              <p className="text-muted fs-sm mb-0">Kelola informasi lengkap UMKM binaan</p>
          </div>
          <div className="d-flex gap-2">
              <Link href="/dashboard" className="btn-outline-custom">
                  <i className="bi bi-arrow-left"></i> Kembali
              </Link>
              <button className="btn-primary-custom" data-bs-toggle="modal" data-bs-target="#addUmkmModal">
                  <i className="bi bi-person-plus-fill me-2"></i> Tambah UMKM
              </button>
          </div>
      </div>

      <div className="panel">
          <div className="panel-body p-0">
              <div className="table-responsive p-3">
                  <table className="table-custom data-table" style={{width:'100%'}}>
                      <thead>
                          <tr>
                              <th>No</th>
                              <th>Username</th>
                              <th>Nama UMKM</th>
                              <th>Pemilik</th>
                              <th>Sektor/Status Usaha</th>
                              <th>Domisili</th>
                              <th>Aksi</th>
                          </tr>
                      </thead>
                      <tbody>
                          {umkmList.map((u, idx) => (
                          <tr key={u.id}>
                              <td>
                                <div className="d-flex flex-column align-items-start">
                                  <span>{idx + 1}</span>
                                  {u.id_umkm && <code className="text-primary mt-1 px-1 bg-primary bg-opacity-10 rounded" style={{fontSize: '0.7rem'}}>{u.id_umkm}</code>}
                                </div>
                              </td>
                              <td><strong>{u.username}</strong></td>
                              <td>{u.nama_umkm}</td>
                              <td>{u.nama_pemilik}</td>
                              <td><span className="badge-status badge-pemula">{u.status_usaha || 'Pemula'}</span></td>
                              <td>{u.domisili || '-'}</td>
                              <td>
                                  <div className="d-flex gap-1">
                                      <button className="btn-warning-custom shadow-sm" onClick={() => openEdit(u)} title="Edit"><i className="bi bi-pencil-square"></i></button>
                                      <button onClick={() => confirmDelete(u.id)} className="btn-danger-custom shadow-sm" title="Hapus"><i className="bi bi-trash"></i></button>
                                  </div>
                              </td>
                          </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="addUmkmModal" tabIndex={-1}>
          <div className="modal-dialog modal-xl">
              <div className="modal-content border-0 rounded-4 overflow-hidden">
                  <div className="modal-header bg-primary text-white p-4">
                      <h5 className="modal-title m-0 fw-bold"><i className="bi bi-plus-circle me-2"></i>Tambah Data UMKM Baru</h5>
                      <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleCreate} encType="multipart/form-data">
                      <div className="modal-body p-4 bg-light">
                          <div className="row">
                              <div className="col-lg-6 pe-lg-4 border-end">
                                   <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-shield-lock me-2"></i>Informasi UMKM</h6>
                                   <div className="row g-3">
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>ID UMKM <span className="text-danger">*</span></label><input type="text" name="id_umkm" className="form-control form-control-custom" placeholder="Contoh: UMKM-001" required /><small className="text-muted mt-1 d-block">ID unik untuk identifikasi UMKM (kombinasi huruf dan angka)</small></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Nama UMKM</label><input type="text" name="nama_umkm" className="form-control form-control-custom" required /></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Nama Pemilik</label><input type="text" name="nama_pemilik" className="form-control form-control-custom" required /></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Deskripsi Usaha</label><textarea name="deskripsi" className="form-control form-control-custom" rows={2}></textarea></div>
                                       </div>
                                       <div className="col-md-6">
                                           <div className="form-group-custom"><label>NIK Pemilik</label><input type="text" name="nik" className="form-control form-control-custom" /></div>
                                       </div>
                                       <div className="col-md-6">
                                           <div className="form-group-custom"><label>NIB Usaha</label><input type="text" name="nib" className="form-control form-control-custom" /></div>
                                       </div>
                                   </div>

                                   <h6 className="fw-bold mt-4 mb-3 text-primary"><i className="bi bi-key me-2"></i>Akun Login</h6>
                                   <div className="row g-3">
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Username <span className="text-danger">*</span></label><input type="text" name="username" className="form-control form-control-custom" autoComplete="off" required /></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Password <span className="text-danger">*</span></label><input type="password" name="password" className="form-control form-control-custom" autoComplete="new-password" required /></div>
                                       </div>
                                   </div>
                              </div>

                              <div className="col-lg-6 ps-lg-4 mt-4 mt-lg-0">
                                  <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-geo-alt me-2"></i>Kontak & Lokasi</h6>
                                  <div className="row g-3">
                                      <div className="col-md-6">
                                          <div className="form-group-custom"><label>No. Telepon / WhatsApp</label><input type="text" name="no_telpon" className="form-control form-control-custom" required /></div>
                                      </div>
                                      <div className="col-md-6">
                                          <div className="form-group-custom"><label>Email</label><input type="email" name="email" className="form-control form-control-custom" /></div>
                                      </div>
                                      <div className="col-12">
                                          <div className="form-group-custom"><label>Domisili (Kota/Kab)</label><input type="text" name="domisili" className="form-control form-control-custom" required /></div>
                                      </div>
                                      <div className="col-12">
                                          <div className="form-group-custom"><label>Alamat Lengkap</label><textarea name="alamat" className="form-control form-control-custom" rows={2} required></textarea></div>
                                      </div>
                                  </div>

                                  <h6 className="fw-bold mt-4 mb-3 text-primary"><i className="bi bi-award me-2"></i>Legalitas</h6>
                                  <div className="row g-3">
                                      <div className="col-12">
                                          <div className="form-group-custom"><label>Sertifikat Halal</label><input type="file" name="sertifikat_halal" className="form-control form-control-custom" /></div>
                                      </div>
                                      <div className="col-12">
                                          <div className="form-group-custom"><label>Sertifikat PIRT</label><input type="file" name="sertifikat_pirt" className="form-control form-control-custom" /></div>
                                      </div>
                                  </div>
                                  <div className="row g-3">
                                      <div className="col-12">
                                          <div className="form-group-custom">
                                              <label>Fasilitator Pendamping</label>
                                              <select name="fasilitator_id" className="form-select form-control-custom">
                                                  <option value="">-- Tanpa Fasilitator --</option>
                                                  {fasilitatorList.map(f => (
                                                      <option key={f.id} value={f.id}>{f.nickname} ({f.domisili || 'Semua Area'})</option>
                                                  ))}
                                              </select>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="modal-footer bg-white border-top">
                          <button type="button" className="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
                          <button type="submit" className="btn-primary-custom"><i className="bi bi-check-lg"></i> Simpan UMKM</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="editUmkmModal" tabIndex={-1}>
          <div className="modal-dialog modal-xl">
              <div className="modal-content border-0 rounded-4 overflow-hidden">
                  <div className="modal-header bg-warning text-black p-4">
                      <h5 className="modal-title m-0 fw-bold"><i className="bi bi-pencil-square me-2"></i>Edit Data UMKM</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleUpdate} encType="multipart/form-data">
                      <input type="hidden" name="id" value={editData?.id || ''} />
                      <div className="modal-body p-4 bg-light">
                          <div className="row">
                              <div className="col-lg-6 pe-lg-4 border-end">
                                   <h6 className="fw-bold mb-3 text-warning"><i className="bi bi-shield-lock me-2"></i>Informasi UMKM</h6>
                                   <div className="row g-3">
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>ID UMKM (Tidak bisa diubah)</label><input type="text" className="form-control form-control-custom bg-light" defaultValue={editData?.id_umkm || editData?.id || ''} disabled autoComplete="off" /></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Nama UMKM</label><input type="text" name="nama_umkm" className="form-control form-control-custom" required defaultValue={editData?.nama_umkm || ''} /></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Nama Pemilik</label><input type="text" name="nama_pemilik" className="form-control form-control-custom" required defaultValue={editData?.nama_pemilik || ''} /></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Deskripsi Usaha</label><textarea name="deskripsi" className="form-control form-control-custom" rows={2} defaultValue={editData?.deskripsi || ''}></textarea></div>
                                       </div>
                                       <div className="col-md-6">
                                           <div className="form-group-custom"><label>NIK Pemilik</label><input type="text" name="nik" className="form-control form-control-custom" defaultValue={editData?.nik || ''} /></div>
                                       </div>
                                       <div className="col-md-6">
                                           <div className="form-group-custom"><label>NIB Usaha</label><input type="text" name="nib" className="form-control form-control-custom" defaultValue={editData?.nib || ''} /></div>
                                       </div>
                                   </div>

                                   <h6 className="fw-bold mt-4 mb-3 text-warning"><i className="bi bi-key me-2"></i>Akun Login</h6>
                                   <div className="row g-3">
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Username (Tidak bisa diubah)</label><input type="text" className="form-control form-control-custom bg-light" defaultValue={editData?.username || ''} disabled autoComplete="off" /></div>
                                       </div>
                                       <div className="col-12">
                                           <div className="form-group-custom"><label>Password Baru <span className="text-muted fw-normal">(kosongkan jika tidak diubah)</span></label><input type="password" name="password" className="form-control form-control-custom" autoComplete="new-password" /></div>
                                       </div>
                                   </div>
                              </div>

                              <div className="col-lg-6 ps-lg-4 mt-4 mt-lg-0">
                                  <h6 className="fw-bold mb-3 text-warning"><i className="bi bi-geo-alt me-2"></i>Kontak & Lokasi</h6>
                                  <div className="row g-3">
                                      <div className="col-md-6">
                                          <div className="form-group-custom"><label>No. Telepon / WhatsApp</label><input type="text" name="no_telpon" className="form-control form-control-custom" required defaultValue={editData?.no_telpon || ''} /></div>
                                      </div>
                                      <div className="col-md-6">
                                          <div className="form-group-custom"><label>Email</label><input type="email" name="email" className="form-control form-control-custom" defaultValue={editData?.email || ''} /></div>
                                      </div>
                                      <div className="col-12">
                                          <div className="form-group-custom"><label>Domisili (Kota/Kab)</label><input type="text" name="domisili" className="form-control form-control-custom" required defaultValue={editData?.domisili || ''} /></div>
                                      </div>
                                      <div className="col-12">
                                          <div className="form-group-custom"><label>Alamat Lengkap</label><textarea name="alamat" className="form-control form-control-custom" rows={2} required defaultValue={editData?.alamat || ''}></textarea></div>
                                      </div>
                                  </div>

                                  <h6 className="fw-bold mt-4 mb-3 text-warning"><i className="bi bi-award me-2"></i>Legalitas</h6>
                                  <div className="row g-3">
                                      <div className="col-12">
                                          <div className="form-group-custom">
                                              <label>Sertifikat Halal <span className="text-muted fw-normal">(abaikan jika tidak ingin mengubah)</span></label>
                                              <input type="file" name="sertifikat_halal" className="form-control form-control-custom" />
                                          </div>
                                      </div>
                                      <div className="col-12">
                                          <div className="form-group-custom">
                                              <label>Sertifikat PIRT <span className="text-muted fw-normal">(abaikan jika tidak ingin mengubah)</span></label>
                                              <input type="file" name="sertifikat_pirt" className="form-control form-control-custom" />
                                          </div>
                                      </div>
                                  </div>
                                  <div className="row g-3">
                                      <div className="col-12">
                                          <div className="form-group-custom">
                                              <label>Fasilitator Pendamping</label>
                                              <select name="fasilitator_id" className="form-select form-control-custom" defaultValue={editData?.fasilitator_id || ''}>
                                                  <option value="">-- Tanpa Fasilitator --</option>
                                                  {fasilitatorList.map(f => (
                                                      <option key={f.id} value={f.id}>{f.nickname} ({f.domisili || 'Semua Area'})</option>
                                                  ))}
                                              </select>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>
                      <div className="modal-footer bg-white border-top">
                          <button type="button" className="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
                          <button type="submit" className="btn-warning-custom px-4 fw-bold text-black"><i className="bi bi-check-lg"></i> Update Data</button>
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
