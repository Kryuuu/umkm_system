"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createPenjualanAction, deletePenjualanAction } from "./actions";

export default function PenjualanClient({ penjualanList, umkmList, produkList, user, activeUmkmId }: { penjualanList: any[], umkmList: any[], produkList: any[], user: any, activeUmkmId?: number }) {
  const [selectedUmkm, setSelectedUmkm] = useState<string>(activeUmkmId ? activeUmkmId.toString() : '');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Re-initialize jQuery DataTable on penjualanList changes using leaf node DOM
  useEffect(() => {
    if (typeof window !== "undefined" && window.$) {
      const existingTable = window.$('#penjualan-table');
      if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
        existingTable.DataTable().destroy();
      }
    }

    if (tableContainerRef.current) {
      tableContainerRef.current.innerHTML = '';
    }

    const tableHtml = `
      <table id="penjualan-table" class="table-custom" style="width:100%">
          <thead>
              <tr>
                  <th>No</th>
                  <th>Tanggal</th>
                  <th>UMKM</th>
                  <th>Nama Produk</th>
                  <th>Jumlah Terjual</th>
                  <th>Jml Pelanggan</th>
                  <th>Total Harga</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
              </tr>
          </thead>
          <tbody>
              ${penjualanList.map((s, idx) => `
              <tr data-id="${s.id}">
                  <td>${idx + 1}</td>
                  <td>${formatDate(s.tanggal)}</td>
                  <td>${s.nama_umkm || '-'}</td>
                  <td><strong>${s.nama_produk || '-'}</strong></td>
                  <td>${s.jumlah} pcs</td>
                  <td>${s.jumlah_pelanggan ? `${s.jumlah_pelanggan} org` : '-'}</td>
                  <td class="fw-bold text-primary">Rp ${Number(s.total_harga || 0).toLocaleString('id-ID')}</td>
                  <td class="fs-xs">${s.catatan || '-'}</td>
                  <td>
                      <button class="btn-danger-custom btn-table-action btn-delete" data-id="${s.id}" title="Hapus"><i class="bi bi-trash"></i></button>
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
      const table = window.$('#penjualan-table');
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
        pageLength: 10
      });

      table.on('click', '.btn-delete', function(this: any) {
        const id = window.$(this).data('id');
        confirmDelete(Number(id));
      });
    }

    return () => {
      if (typeof window !== "undefined" && window.$) {
        const existingTable = window.$('#penjualan-table');
        if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
          existingTable.DataTable().destroy();
        }
      }
      if (tableContainerRef.current) {
        tableContainerRef.current.innerHTML = '';
      }
    };
  }, [penjualanList]);


  const handleCreate = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (user.role === 'Mitra') {
      formData.set('umkm_id', (user.umkm_id || user.id).toString());
    }

    if (typeof window === 'undefined') return;
    const Swal = (window as any).Swal;

    Swal.fire({
      title: 'Menyimpan Catatan...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const res = await createPenjualanAction(formData);

    if (res.success) {
      if ((window as any).bootstrap) {
        const modalEl = document.getElementById('addPenjualanModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      Swal.fire({icon: 'success', title: 'Berhasil', text: 'Data penjualan berhasil dicatat!'}).then(() => {
        window.location.reload();
      });
      e.target.reset();
    } else {
      Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Terjadi kesalahan.'});
    }
  };

  const confirmDelete = (id: number) => {
    if (typeof window !== "undefined" && (window as any).Swal) {
      const Swal = (window as any).Swal;
      Swal.fire({
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
              Swal.fire({
                title: 'Menghapus Data...',
                allowOutsideClick: false,
                didOpen: () => {
                  Swal.showLoading();
                }
              });

              const res = await deletePenjualanAction(id);
              if (res.success) {
                  Swal.fire({icon: 'success', title: 'Terhapus!', text: 'Data penjualan berhasil dihapus.'}).then(() => {
                    window.location.reload();
                  });
              } else {
                  Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Gagal menghapus.'});
              }
          }
      });
    }
  };

  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const availableProduk = user.role === 'Mitra' 
    ? produkList.filter(p => p.umkm_id === (user.umkm_id || user.id))
    : produkList.filter(p => p.umkm_id == selectedUmkm);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Catatan Penjualan Produk</h5>
              <p className="text-muted fs-sm mb-0">Record penjualan harian UMKM per produk</p>
          </div>
          <div className="d-flex gap-2">
              {user.role !== 'Mitra' && (
              <Link href="/dashboard/penjualan" className="btn-outline-custom">
                  <i className="bi bi-arrow-left"></i> Kembali
              </Link>
              )}
              <button className="btn-primary-custom" data-bs-toggle="modal" data-bs-target="#addPenjualanModal">
                  <i className="bi bi-cart-plus-fill me-1"></i> Catat Penjualan
              </button>
          </div>
      </div>

      <div className="panel">
          <div className="panel-body p-0">
              <div className="table-responsive p-3">
                  <div ref={tableContainerRef}></div>
              </div>
          </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="addPenjualanModal" tabIndex={-1}>
          <div className="modal-dialog">
              <div className="modal-content">
                  <div className="modal-header">
                      <h5 className="modal-title"><i className="bi bi-cart-check text-primary me-2"></i>Catat Penjualan Baru</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleCreate}>
                      <div className="modal-body">
                          <div className="form-group-custom mb-3"><label>Tanggal Penjualan</label><input type="date" name="tanggal" className="form-control form-control-custom" defaultValue={new Date().toISOString().split('T')[0]} required /></div>
                          
                          {user.role !== 'Mitra' && (
                              <div className="form-group-custom mb-3">
                                  <label>UMKM</label>
                                  {activeUmkmId ? (
                                      <>
                                          <input type="hidden" name="umkm_id" value={activeUmkmId} />
                                          <input
                                              type="text"
                                              className="form-control form-control-custom bg-light fw-bold"
                                              value={umkmList.find(u => u.id === activeUmkmId)?.nama_umkm || ""}
                                              readOnly
                                          />
                                      </>
                                  ) : (
                                      <select name="umkm_id" className="form-control form-control-custom" onChange={(e) => setSelectedUmkm(e.target.value)} required>
                                          <option value="">-- Pilih UMKM --</option>
                                          {umkmList.map(u => (
                                              <option key={u.id} value={u.id}>{u.nama_umkm}</option>
                                          ))}
                                      </select>
                                  )}
                              </div>
                          )}

                          <div className="form-group-custom mb-3">
                              <label>Pilih Produk</label>
                              <select name="produk_id" className="form-control form-control-custom" required>
                                  <option value="">-- Pilih Produk --</option>
                                  {availableProduk.length === 0 && <option value="" disabled>-- Belum ada produk --</option>}
                                  {availableProduk.map(p => (
                                      <option key={p.id} value={p.id}>{p.nama_produk} (Rp {Number(p.harga_produk).toLocaleString('id-ID')})</option>
                                  ))}
                              </select>
                          </div>

                          <div className="row g-2 mb-3">
                              <div className="col-4">
                                  <div className="form-group-custom"><label>Jumlah Terjual</label><input type="number" name="jumlah" className="form-control form-control-custom" min="1" defaultValue={1} required /></div>
                              </div>
                              <div className="col-4">
                                  <div className="form-group-custom"><label>Jml Pelanggan</label><input type="number" name="jumlah_pelanggan" className="form-control form-control-custom" min="1" defaultValue={1} required /></div>
                              </div>
                              <div className="col-4">
                                  <div className="form-group-custom"><label>Tenaga Kerja</label><input type="number" name="jumlah_tenaga_kerja" className="form-control form-control-custom" min="0" defaultValue={0} required /></div>
                              </div>
                          </div>
                          <div className="form-group-custom"><label>Catatan (Opsional)</label><textarea name="catatan" className="form-control form-control-custom" rows={2} placeholder="e.g. Pembelian via WhatsApp"></textarea></div>
                      </div>
                      <div className="modal-footer">
                          <button type="button" className="btn-outline-custom" data-bs-dismiss="modal">Batal</button>
                          <button type="submit" className="btn-primary-custom"><i className="bi bi-check-lg"></i> Simpan Catatan</button>
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
