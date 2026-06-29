"use client";

import { useRouter } from "next/navigation";
import { createFasilitator, updateFasilitator, deleteFasilitator } from "./actions";

export default function FasilClient({ fasilitator, allFasilitator, user, domisiliKalsel }: { fasilitator: any, allFasilitator: any[], user: any, domisiliKalsel: string[] }) {
  const router = useRouter();

  const handleCreate = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await createFasilitator(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('addFasilModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              // clean up backdrop
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Fasilitator berhasil ditambahkan!'});
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
      const res = await updateFasilitator(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Profil berhasil diperbarui!'});
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
              const res = await deleteFasilitator(id);
              if (res.success) {
                  window.Swal.fire({icon: 'success', title: 'Terhapus!', text: 'Fasilitator berhasil dihapus.'});
              } else {
                  window.Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Gagal menghapus.'});
              }
          }
      });
    }
  };

  return (
    <div className="row g-4">
        {/* Profile Card */}
        <div className="col-lg-4">
            <div className="panel">
                <div className="panel-header">
                    <h5><i className="bi bi-person-circle"></i> Profil Saya</h5>
                </div>
                <div className="panel-body text-center">
                    <div style={{width:'80px',height:'80px',borderRadius:'20px',background:'linear-gradient(135deg,var(--primary),var(--accent-violet))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'2rem',fontWeight:800,margin:'0 auto 16px'}}>
                        {fasilitator?.nickname?.substring(0, 2).toUpperCase()}
                    </div>
                    <h5 className="fw-bold mb-1">{fasilitator?.nickname}</h5>
                    <p className="text-muted fs-sm mb-3">@{fasilitator?.username}</p>
                    <div className="text-start">
                        <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted fs-sm">Domisili</span>
                            <span className="fw-600 fs-sm">{fasilitator?.domisili || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted fs-sm">Telepon</span>
                            <span className="fw-600 fs-sm">{fasilitator?.no_telpon || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2 border-bottom">
                            <span className="text-muted fs-sm">Agama</span>
                            <span className="fw-600 fs-sm">{fasilitator?.agama || '-'}</span>
                        </div>
                        <div className="d-flex justify-content-between py-2">
                            <span className="text-muted fs-sm">Email</span>
                            <span className="fw-600 fs-sm">{fasilitator?.email || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Edit Form */}
        <div className="col-lg-8">
            <div className="panel mb-4">
                <div className="panel-header">
                    <h5><i className="bi bi-pencil-square"></i> Edit Profil</h5>
                </div>
                <div className="panel-body">
                    <form onSubmit={handleUpdate}>
                        <input type="hidden" name="id" value={fasilitator?.id} />
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className="form-group-custom">
                                    <label>Nickname</label>
                                    <input type="text" name="nickname" className="form-control form-control-custom" defaultValue={fasilitator?.nickname} required />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group-custom">
                                    <label>Domisili</label>
                                    <select name="domisili" className="form-control form-control-custom" defaultValue={fasilitator?.domisili || ''}>
                                        <option value="">-- Pilih Kota --</option>
                                        {domisiliKalsel.map(kota => (
                                            <option key={kota} value={kota}>{kota}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group-custom">
                                    <label>No. Telepon</label>
                                    <input type="text" name="no_telpon" className="form-control form-control-custom" defaultValue={fasilitator?.no_telpon || ''} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group-custom">
                                    <label>Agama</label>
                                    <select name="agama" className="form-control form-control-custom" defaultValue={fasilitator?.agama || ''}>
                                        {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(a => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group-custom">
                                    <label>Email</label>
                                    <input type="email" name="email" className="form-control form-control-custom" defaultValue={fasilitator?.email || ''} />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group-custom">
                                    <label>Password Baru <span className="text-muted">(kosongkan jika tidak diubah)</span></label>
                                    <input type="password" name="password" className="form-control form-control-custom" placeholder="••••••••" autoComplete="new-password" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-3">
                            <button type="submit" className="btn-primary-custom">
                                <i className="bi bi-check-lg"></i> Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {user.role === 'admin' && (
            <div className="panel">
                <div className="panel-header d-flex justify-content-between align-items-center">
                    <h5><i className="bi bi-people"></i> Daftar Fasilitator</h5>
                    <button className="btn btn-primary btn-sm rounded-3" data-bs-toggle="modal" data-bs-target="#addFasilModal">
                        <i className="bi bi-plus-lg"></i> Tambah Baru
                    </button>
                </div>
                <div className="panel-body p-0">
                    <div className="table-responsive">
                        <table className="table-custom data-table">
                            <thead>
                                <tr>
                                    <th>No</th>
                                    <th>Username</th>
                                    <th>Nickname</th>
                                    <th>Domisili</th>
                                    <th>Telepon</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allFasilitator.map((f, idx) => (
                                <tr key={f.id}>
                                    <td>{idx + 1}</td>
                                    <td><strong>{f.username}</strong></td>
                                    <td>{f.nickname}</td>
                                    <td>{f.domisili || '-'}</td>
                                    <td>{f.no_telpon || '-'}</td>
                                    <td>{f.email || '-'}</td>
                                    <td><span className={`badge-status ${f.role === 'admin' ? 'badge-siap-pameran' : 'badge-naik-kelas'}`}>{f.role === 'admin' ? 'Administrator' : 'Fasilitator'}</span></td>
                                    <td>
                                        {f.id !== user.id ? (
                                        <button onClick={() => confirmDelete(f.id)} className="btn btn-link text-danger p-0" title="Hapus Fasilitator">
                                            <i className="bi bi-trash"></i>
                                        </button>
                                        ) : (
                                        <span className="text-muted fs-xs">Self</span>
                                        )}
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            )}
        </div>

        {/* Modal Tambah Fasilitator */}
        <div className="modal fade" id="addFasilModal" tabIndex={-1}>
            <div className="modal-dialog">
                <div className="modal-content border-0 rounded-4 overflow-hidden">
                    <div className="modal-header bg-primary text-white p-4">
                        <h5 className="modal-title m-0 fw-bold"><i className="bi bi-person-plus-fill me-2"></i>Tambah Fasilitator Baru</h5>
                        <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <form onSubmit={handleCreate}>
                        <div className="modal-body p-4 bg-light">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="form-group-custom">
                                        <label>Username</label>
                                        <input type="text" name="username" className="form-control form-control-custom" placeholder="e.g. joko99" autoComplete="off" required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group-custom">
                                        <label>Password</label>
                                        <input type="password" name="password" className="form-control form-control-custom" placeholder="••••••••" autoComplete="new-password" required />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group-custom">
                                        <label>Nama Lengkap (Nickname)</label>
                                        <input type="text" name="nickname" className="form-control form-control-custom" placeholder="Nama yang muncul di sistem" required />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group-custom">
                                        <label>Role</label>
                                        <select name="role" className="form-control form-control-custom">
                                            <option value="fasilitator">Fasilitator</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group-custom">
                                        <label>No. Telepon</label>
                                        <input type="text" name="no_telpon" className="form-control form-control-custom" placeholder="0812..." />
                                    </div>
                                </div>
                                <div className="col-12">
                                    <div className="form-group-custom">
                                        <label>Email</label>
                                        <input type="email" name="email" className="form-control form-control-custom" placeholder="email@rumahbumn.id" />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group-custom">
                                        <label>Agama</label>
                                        <select name="agama" className="form-control form-control-custom">
                                            {['Islam','Kristen','Katolik','Hindu','Buddha','Konghucu'].map(a => (
                                                <option key={a} value={a}>{a}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group-custom">
                                        <label>Domisili</label>
                                        <select name="domisili" className="form-control form-control-custom" required>
                                            <option value="">-- Pilih Kota --</option>
                                            {domisiliKalsel.map(kota => (
                                                <option key={kota} value={kota}>{kota}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer bg-white border-top-0 px-4 pb-4">
                            <button type="button" className="btn btn-outline-secondary rounded-pill px-4" data-bs-dismiss="modal">Batal</button>
                            <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">Daftarkan Fasilitator</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
}

declare global {
  interface Window {
    bootstrap: any;
    Swal: any;
  }
}
