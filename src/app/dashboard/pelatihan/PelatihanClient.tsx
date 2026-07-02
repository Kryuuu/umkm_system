"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPelatihan, updatePelatihan, deletePelatihan } from "./actions";

export default function PelatihanClient({ pelatihanList, user }: { pelatihanList: any[], user: any }) {
  const [editData, setEditData] = useState<any>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openEdit = (p: any) => {
    setEditData(p);
    if (typeof window !== "undefined" && window.bootstrap) {
      const modal = new window.bootstrap.Modal(document.getElementById('editPelatihanModal'));
      modal.show();
    }
  };

  const handleCreate = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      if (typeof window === 'undefined') return;
      const Swal = (window as any).Swal;

      Swal.fire({
          title: 'Menyimpan Pelatihan...',
          allowOutsideClick: false,
          didOpen: () => {
              Swal.showLoading();
          }
      });

      const res = await createPelatihan(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('addPelatihanModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          Swal.fire({icon: 'success', title: 'Berhasil', text: 'Pelatihan berhasil ditambahkan!'});
          e.target.reset();
      } else {
          Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Terjadi kesalahan.'});
      }
  };

  const handleUpdate = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      if (typeof window === 'undefined') return;
      const Swal = (window as any).Swal;

      Swal.fire({
          title: 'Memperbarui Pelatihan...',
          allowOutsideClick: false,
          didOpen: () => {
              Swal.showLoading();
          }
      });

      const res = await updatePelatihan(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('editPelatihanModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          Swal.fire({icon: 'success', title: 'Berhasil', text: 'Pelatihan berhasil diperbarui!'});
      } else {
          Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Terjadi kesalahan.'});
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
              const res = await deletePelatihan(id);
              if (res.success) {
                  window.Swal.fire({icon: 'success', title: 'Terhapus!', text: 'Pelatihan berhasil dihapus.'});
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

  // Re-initialize jQuery DataTable on pelatihanList changes using leaf node DOM
  useEffect(() => {
    if (typeof window !== "undefined" && window.$) {
      const existingTable = window.$('#pelatihan-table');
      if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
        existingTable.DataTable().destroy();
      }
    }

    if (tableContainerRef.current) {
      tableContainerRef.current.innerHTML = '';
    }

    const showAksi = user.role !== 'umkm';
    const tableHtml = `
      <table id="pelatihan-table" class="table-custom" style="width:100%">
          <thead>
              <tr>
                  <th>No</th>
                  <th>Nama Pelatihan</th>
                  <th>Tanggal</th>
                  <th>Pemateri</th>
                  <th>Lokasi</th>
                  <th>Materi</th>
                  ${showAksi ? '<th>Aksi</th>' : ''}
              </tr>
          </thead>
          <tbody>
              ${pelatihanList.map((p, idx) => `
              <tr data-id="${p.id}">
                  <td>${idx + 1}</td>
                  <td><strong>${p.nama_pelatihan}</strong></td>
                  <td>${formatDate(p.tanggal)}</td>
                  <td>${p.pemateri}</td>
                  <td>${p.lokasi}</td>
                  <td>
                      ${p.file_materi ? `
                          <a href="/uploads/materi/${p.file_materi}" class="btn btn-sm btn-outline-success rounded-pill" download title="Download Materi">
                              <i class="bi bi-download"></i> Unduh
                          </a>
                      ` : `
                          <span class="text-muted small">-</span>
                      `}
                  </td>
                  ${showAksi ? `
                  <td>
                      <div class="d-flex gap-1">
                          <button class="btn-success-custom btn-kehadiran" data-id="${p.id}" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 0.85rem;" title="Kehadiran">
                              <i class="bi bi-clipboard-check"></i>
                          </button>
                          <button class="btn-qr-code" data-id="${p.id}" style="background: linear-gradient(135deg, #6366f1, #a855f7); color: white; border: none; width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 0.85rem;" title="QR Code Live Presenter">
                              <i class="bi bi-qr-code"></i>
                          </button>
                          <button class="btn-warning-custom btn-edit" data-index="${idx}" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 0.85rem;" title="Edit">
                              <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn-danger-custom btn-delete" data-id="${p.id}" style="width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 0.85rem;" title="Hapus">
                              <i class="bi bi-trash"></i>
                          </button>
                      </div>
                  </td>
                  ` : ''}
              </tr>
              `).join('')}
          </tbody>
       </table>
    `;

    if (tableContainerRef.current) {
      tableContainerRef.current.innerHTML = tableHtml;
    }

    if (typeof window !== "undefined" && window.$ && window.$.fn.DataTable) {
      const table = window.$('#pelatihan-table');
      table.DataTable({
        language: {
            search: "Cari:",
            lengthMenu: "Tampilkan _MENU_ data",
            info: "Menampilkan _START_ - _END_ dari _TOTAL_ data",
            paginate: {
                first: "Pertama",
                last: "Terakhir",
                next: "›",
                previous: "‹"
            },
            emptyTable: "Tidak ada data tersedia",
            zeroRecords: "Data tidak ditemukan"
        },
        responsive: true,
        pageLength: 10,
        destroy: true
      });

      table.on('click', '.btn-kehadiran', function(this: any) {
        const id = window.$(this).data('id');
        router.push(`/dashboard/pelatihan/kehadiran/${id}`);
      });

      table.on('click', '.btn-qr-code', function(this: any) {
        const id = window.$(this).data('id');
        window.open(`/dashboard/pelatihan/kehadiran/${id}/qr`, '_blank');
      });

      table.on('click', '.btn-edit', function(this: any) {
        const index = window.$(this).data('index');
        const item = pelatihanList[Number(index)];
        if (item) openEdit(item);
      });

      table.on('click', '.btn-delete', function(this: any) {
        const id = window.$(this).data('id');
        confirmDelete(Number(id));
      });
    }

    return () => {
      if (typeof window !== "undefined" && window.$) {
        const existingTable = window.$('#pelatihan-table');
        if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
          existingTable.DataTable().destroy();
        }
      }
      if (tableContainerRef.current) {
        tableContainerRef.current.innerHTML = '';
      }
    };
  }, [pelatihanList]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Pelatihan UMKM</h5>
              <p className="text-muted fs-sm mb-0">Kelola program pelatihan UMKM</p>
          </div>
          {user.role !== 'umkm' ? (
          <button className="btn-primary-custom" data-bs-toggle="modal" data-bs-target="#addPelatihanModal">
              <i className="bi bi-plus-lg"></i> Tambah Pelatihan
          </button>
          ) : (
          <Link 
            href="/dashboard/pelatihan/scan" 
            className="btn rounded-pill px-4 fs-sm fw-semibold shadow-sm text-white d-flex align-items-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', border: 'none', padding: '8px 20px' }}
          >
            <i className="bi bi-qr-code-scan me-2"></i> Scan Absensi
          </Link>
          )}
      </div>

      <div className="panel">
          <div className="panel-body p-0">
              <div className="table-responsive p-3" ref={tableContainerRef}></div>
          </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="addPelatihanModal" tabIndex={-1}>
          <div className="modal-dialog">
              <div className="modal-content">
                   <div className="modal-header">
                       <h5 className="modal-title"><i className="bi bi-plus-circle text-primary me-2"></i>Tambah Pelatihan</h5>
                       <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                   </div>
                   <form onSubmit={handleCreate}>
                       <div className="modal-body">
                           <div className="form-group-custom mb-3"><label>Nama Pelatihan</label><input type="text" name="nama_pelatihan" className="form-control form-control-custom" required /></div>
                           <div className="form-group-custom mb-3"><label>Tanggal</label><input type="date" name="tanggal" className="form-control form-control-custom" required /></div>
                           <div className="form-group-custom mb-3"><label>Pemateri</label><input type="text" name="pemateri" className="form-control form-control-custom" required /></div>
                           <div className="form-group-custom mb-3"><label>Lokasi</label><input type="text" name="lokasi" className="form-control form-control-custom" required /></div>
                           <div className="form-group-custom mb-3"><label>Deskripsi</label><textarea name="deskripsi" className="form-control form-control-custom" rows={2}></textarea></div>
                           <div className="form-group-custom mb-3"><label>File Materi (PDF/DOC)</label><input type="file" name="file_materi" className="form-control form-control-custom" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></div>
                       </div>
                       <div className="modal-footer">
                           <button type="button" className="btn-outline-custom" data-bs-dismiss="modal">Batal</button>
                           <button type="submit" className="btn-primary-custom"><i className="bi bi-check-lg"></i> Simpan</button>
                       </div>
                   </form>
              </div>
          </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="editPelatihanModal" tabIndex={-1}>
          <div className="modal-dialog">
              <div className="modal-content">
                   <div className="modal-header">
                       <h5 className="modal-title"><i className="bi bi-pencil-square text-warning me-2"></i>Edit Pelatihan</h5>
                       <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                   </div>
                   <form onSubmit={handleUpdate}>
                       <input type="hidden" name="id" value={editData?.id || ''} />
                       <div className="modal-body">
                           <div className="form-group-custom mb-3"><label>Nama Pelatihan</label><input type="text" name="nama_pelatihan" className="form-control form-control-custom" required defaultValue={editData?.nama_pelatihan || ''} /></div>
                           <div className="form-group-custom mb-3"><label>Tanggal</label><input type="date" name="tanggal" className="form-control form-control-custom" required defaultValue={editData?.tanggal || ''} /></div>
                           <div className="form-group-custom mb-3"><label>Pemateri</label><input type="text" name="pemateri" className="form-control form-control-custom" required defaultValue={editData?.pemateri || ''} /></div>
                           <div className="form-group-custom mb-3"><label>Lokasi</label><input type="text" name="lokasi" className="form-control form-control-custom" required defaultValue={editData?.lokasi || ''} /></div>
                           <div className="form-group-custom mb-3"><label>Deskripsi</label><textarea name="deskripsi" className="form-control form-control-custom" rows={2} defaultValue={editData?.deskripsi || ''}></textarea></div>
                           <div className="form-group-custom mb-3"><label>File Materi (PDF/DOC)</label><input type="file" name="file_materi" className="form-control form-control-custom" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /><small className="text-muted">Kosongkan jika tidak ingin mengganti file</small></div>
                       </div>
                       <div className="modal-footer">
                           <button type="button" className="btn-outline-custom" data-bs-dismiss="modal">Batal</button>
                           <button type="submit" className="btn-primary-custom"><i className="bi bi-check-lg"></i> Simpan</button>
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
    $: any;
  }
}
