"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProduk, updateProduk, deleteProduk } from "./actions";

export default function ProdukClient({ produkList, umkmList, user, activeUmkmId }: { produkList: any[], umkmList: any[], user: any, activeUmkmId?: number }) {
  const router = useRouter();
  const [editData, setEditData] = useState<any>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const openEdit = (p: any) => {
    setEditData(p);
    if (typeof window !== "undefined" && window.bootstrap) {
      const modal = new window.bootstrap.Modal(document.getElementById('editProdukModal'));
      modal.show();
    }
  };

  const handleCreate = async (e: any) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const res = await createProduk(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('addProdukModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Produk berhasil ditambahkan!'});
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
      const res = await updateProduk(formData);
      if (res.success) {
          if (typeof window !== "undefined" && window.bootstrap) {
              const modalEl = document.getElementById('editProdukModal');
              const modal = window.bootstrap.Modal.getInstance(modalEl);
              modal?.hide();
              document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
              document.body.classList.remove('modal-open');
              document.body.style.overflow = '';
              document.body.style.paddingRight = '';
          }
          if (typeof window !== "undefined" && window.Swal) {
              window.Swal.fire({icon: 'success', title: 'Berhasil', text: 'Produk berhasil diperbarui!'});
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
              const res = await deleteProduk(id);
              if (res.success) {
                  window.Swal.fire({icon: 'success', title: 'Terhapus!', text: 'Produk berhasil dihapus.'});
              } else {
                  window.Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Gagal menghapus.'});
              }
          }
      });
    }
  };

  // Re-initialize jQuery DataTable on produkList changes using leaf node DOM
  useEffect(() => {
    if (typeof window !== "undefined" && window.$) {
      const existingTable = window.$('#produk-table');
      if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
        existingTable.DataTable().destroy();
      }
    }

    if (tableContainerRef.current) {
      tableContainerRef.current.innerHTML = '';
    }

    const tableHtml = `
      <table id="produk-table" class="table-custom" style="width:100%">
          <thead>
              <tr>
                  <th>No</th>
                  <th>UMKM</th>
                  <th>Nama Produk</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Deskripsi</th>
                  <th>Aksi</th>
              </tr>
          </thead>
          <tbody>
              ${produkList.map((p, idx) => `
              <tr data-id="${p.id}">
                  <td>${idx + 1}</td>
                  <td>${p.nama_umkm || '-'}</td>
                  <td><strong>${p.nama_produk}</strong></td>
                  <td><span class="badge-status badge-naik-kelas">${p.kategori_produk || '-'}</span></td>
                  <td>Rp ${Number(p.harga_produk).toLocaleString('id-ID')}</td>
                  <td class="text-muted fs-sm">${(p.deskripsi_produk || '').substring(0, 50)}</td>
                  <td>
                      <div class="d-flex gap-1">
                          <button class="btn-warning-custom btn-edit" data-id="${p.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                          <button class="btn-danger-custom btn-delete" data-id="${p.id}" title="Hapus"><i class="bi bi-trash"></i></button>
                      </div>
                  </td>
              </tr>
              `).join('')}
          </tbody>
      </table>
    `;

    if (tableContainerRef.current) {
      tableContainerRef.current.innerHTML = tableHtml;
    }

    if (typeof window !== "undefined" && window.$ && window.$.fn.DataTable) {
      const table = window.$('#produk-table');
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

      // Handle Edit Click
      table.on('click', '.btn-edit', function(this: any) {
        const id = window.$(this).data('id');
        const prod = produkList.find(p => p.id === Number(id));
        if (prod) {
          openEdit(prod);
        }
      });

      // Handle Delete Click
      table.on('click', '.btn-delete', function(this: any) {
        const id = window.$(this).data('id');
        confirmDelete(Number(id));
      });
    }

    return () => {
      if (typeof window !== "undefined" && window.$) {
        const existingTable = window.$('#produk-table');
        if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
          existingTable.DataTable().destroy();
        }
      }
      if (tableContainerRef.current) {
        tableContainerRef.current.innerHTML = '';
      }
    };
  }, [produkList]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Produk UMKM</h5>
              <p className="text-muted fs-sm mb-0">Kelola data produk UMKM</p>
          </div>
          <div className="d-flex gap-2">
              {user.role !== 'umkm' && (
              <Link href="/dashboard/produk" className="btn-outline-custom">
                  <i className="bi bi-arrow-left"></i> Kembali
              </Link>
              )}
              <button className="btn-primary-custom" data-bs-toggle="modal" data-bs-target="#addProdukModal">
                  <i className="bi bi-plus-lg"></i> Tambah Produk
              </button>
          </div>
      </div>

      <div className="panel">
          <div className="panel-body p-0">
              <div className="table-responsive p-3" ref={tableContainerRef}></div>
          </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="addProdukModal" tabIndex={-1}>
          <div className="modal-dialog">
              <div className="modal-content">
                  <div className="modal-header">
                      <h5 className="modal-title"><i className="bi bi-plus-circle text-primary me-2"></i>Tambah Produk</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleCreate}>
                      <div className="modal-body">
                          <div className="form-group-custom mb-3">
                              <label>UMKM</label>
                              {activeUmkmId ? (
                                  <>
                                      <input type="hidden" name="umkm_id" value={activeUmkmId} />
                                      <input
                                          type="text"
                                          className="form-control form-control-custom bg-light"
                                          value={umkmList.find(u => u.id === activeUmkmId)?.nama_umkm || (user.role === 'umkm' ? user.name : "")}
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
                          <div className="form-group-custom mb-3">
                              <label>Nama Produk</label>
                              <input type="text" name="nama_produk" className="form-control form-control-custom" required />
                          </div>
                          <div className="form-group-custom mb-3">
                              <label>Kategori</label>
                              <select name="kategori_produk" className="form-control form-control-custom" required>
                                  <option value="">-- Pilih Kategori --</option>
                                  <option value="Makanan">Makanan</option>
                                  <option value="Minuman">Minuman</option>
                                  <option value="Fashion">Fashion</option>
                                  <option value="Kerajinan">Kerajinan</option>
                                  <option value="Jasa">Jasa</option>
                                  <option value="Lainnya">Lainnya</option>
                              </select>
                          </div>
                          <div className="form-group-custom mb-3">
                              <label>Harga (Rp)</label>
                              <input type="number" name="harga_produk" className="form-control form-control-custom" required min="0" />
                          </div>
                          <div className="form-group-custom mb-3">
                              <label>Deskripsi</label>
                              <textarea name="deskripsi_produk" className="form-control form-control-custom" rows={2}></textarea>
                          </div>
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
      <div className="modal fade" id="editProdukModal" tabIndex={-1}>
          <div className="modal-dialog">
              <div className="modal-content">
                  <div className="modal-header">
                      <h5 className="modal-title"><i className="bi bi-pencil-square text-warning me-2"></i>Edit Produk</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleUpdate}>
                      <input type="hidden" name="id" value={editData?.id || ''} />
                      <div className="modal-body">
                          <div className="form-group-custom mb-3">
                              <label>UMKM</label>
                              {activeUmkmId ? (
                                  <>
                                      <input type="hidden" name="umkm_id" value={activeUmkmId} />
                                      <input
                                          type="text"
                                          className="form-control form-control-custom bg-light"
                                          value={umkmList.find(u => u.id === activeUmkmId)?.nama_umkm || (user.role === 'umkm' ? user.name : "")}
                                          readOnly
                                      />
                                  </>
                              ) : (
                                  <select name="umkm_id" className="form-control form-control-custom" required defaultValue={editData?.umkm_id || ''}>
                                      {umkmList.map(u => (
                                          <option key={u.id} value={u.id}>{u.nama_umkm}</option>
                                      ))}
                                  </select>
                              )}
                          </div>
                          <div className="form-group-custom mb-3">
                              <label>Nama Produk</label>
                              <input type="text" name="nama_produk" className="form-control form-control-custom" required defaultValue={editData?.nama_produk || ''} />
                          </div>
                          <div className="form-group-custom mb-3">
                              <label>Kategori</label>
                              <select name="kategori_produk" className="form-control form-control-custom" required defaultValue={editData?.kategori_produk || ''}>
                                  <option value="Makanan">Makanan</option>
                                  <option value="Minuman">Minuman</option>
                                  <option value="Fashion">Fashion</option>
                                  <option value="Kerajinan">Kerajinan</option>
                                  <option value="Jasa">Jasa</option>
                                  <option value="Lainnya">Lainnya</option>
                              </select>
                          </div>
                          <div className="form-group-custom mb-3">
                              <label>Harga (Rp)</label>
                              <input type="number" name="harga_produk" className="form-control form-control-custom" required min="0" defaultValue={editData?.harga_produk || ''} />
                          </div>
                          <div className="form-group-custom mb-3">
                              <label>Deskripsi</label>
                              <textarea name="deskripsi_produk" className="form-control form-control-custom" rows={2} defaultValue={editData?.deskripsi_produk || ''}></textarea>
                          </div>
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
  }
}
