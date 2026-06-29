"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createMonitoringAction, updateMonitoringAction, deleteMonitoringAction, getAvailablePeriodsAction, getAutoFillDataAction } from "./actions";

export default function MonitoringClient({ monitoringList, umkmList, user, activeUmkmId }: { monitoringList: any[], umkmList: any[], user: any, activeUmkmId?: number }) {
  const [editData, setEditData] = useState<any>(null);

  const [periods, setPeriods] = useState<any[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(false);
  const [selectedUmkm, setSelectedUmkm] = useState<number | undefined>(activeUmkmId || (user.role === 'umkm' ? (user.umkm_id || user.id) : undefined));
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [stats, setStats] = useState({ omzet: 0, jumlah_produk: 0, jumlah_tenaga_kerja: 0, jumlah_pelanggan: 0 });

  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  // Extract unique years from monitoringList
  const uniqueYears = Array.from(
    new Set(monitoringList.map(m => m.tahun ? m.tahun.toString() : ''))
  ).filter(y => y !== '').sort((a, b) => b.localeCompare(a));

  // Filter monitoring list
  const filteredList = monitoringList.filter(m => {
    if (filterBulan && m.bulan !== filterBulan) {
      return false;
    }
    if (filterTahun && m.tahun?.toString() !== filterTahun) {
      return false;
    }
    return true;
  });

  // Re-initialize jQuery DataTable on filteredList changes using leaf node DOM
  useEffect(() => {
    if (typeof window !== "undefined" && window.$) {
      const existingTable = window.$('#monitoring-table');
      if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
        existingTable.DataTable().destroy();
      }
    }

    if (tableContainerRef.current) {
      tableContainerRef.current.innerHTML = '';
    }

    const tableHtml = `
      <table id="monitoring-table" class="table-custom" style="width:100%">
          <thead>
              <tr>
                  <th>No</th>
                  <th>UMKM</th>
                  <th>Bulan</th>
                  <th>Tahun</th>
                  <th>Omzet</th>
                  <th>Produk</th>
                  <th>Tenaga Kerja</th>
                  <th>Pelanggan</th>
                  <th>Media Pemasaran</th>
                  <th>Aksi</th>
              </tr>
          </thead>
          <tbody>
              ${filteredList.map((m, idx) => `
              <tr data-id="${m.id}">
                  <td>${idx + 1}</td>
                  <td><strong>${m.nama_umkm || '-'}</strong></td>
                  <td>${m.bulan}</td>
                  <td>${m.tahun}</td>
                  <td class="fw-bold text-success">Rp ${Number(m.omzet || 0).toLocaleString('id-ID')}</td>
                  <td>${m.jumlah_produk || 0}</td>
                  <td>${m.jumlah_tenaga_kerja || 0}</td>
                  <td>${m.jumlah_pelanggan || 0}</td>
                  <td class="fs-sm">${m.media_pemasaran ? m.media_pemasaran.substring(0, 40).replace(/"/g, '&quot;') : '-'}</td>
                  <td>
                      <div class="d-flex gap-1">
                          <button class="btn-warning-custom btn-table-action btn-edit" data-index="${idx}" title="Edit"><i class="bi bi-pencil"></i></button>
                          ${user.role === 'admin' ? `
                          <button class="btn-danger-custom btn-table-action btn-delete" data-id="${m.id}" title="Hapus"><i class="bi bi-trash"></i></button>
                          ` : ''}
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
      const table = window.$('#monitoring-table');
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

      // Bind actions
      table.on('click', '.btn-edit', function(this: any) {
        const idx = window.$(this).data('index');
        const item = filteredList[idx];
        openEdit(item);
      });

      table.on('click', '.btn-delete', function(this: any) {
        const id = window.$(this).data('id');
        confirmDelete(Number(id));
      });
    }

    return () => {
      if (typeof window !== "undefined" && window.$) {
        const existingTable = window.$('#monitoring-table');
        if (existingTable.length && window.$.fn.DataTable && window.$.fn.DataTable.isDataTable(existingTable[0])) {
          existingTable.DataTable().destroy();
        }
      }
      if (tableContainerRef.current) {
        tableContainerRef.current.innerHTML = '';
      }
    };
  }, [filterBulan, filterTahun, monitoringList]);

  // Load periods when selectedUmkm changes
  useEffect(() => {
    if (!selectedUmkm) {
      setPeriods([]);
      setSelectedPeriod("");
      return;
    }
    setLoadingPeriods(true);
    getAvailablePeriodsAction(selectedUmkm).then((res) => {
      setLoadingPeriods(false);
      if (res.success && res.periods) {
        setPeriods(res.periods);
      } else {
        setPeriods([]);
      }
    });
  }, [selectedUmkm]);

  // Load autofill data when selectedPeriod changes
  useEffect(() => {
    if (!selectedUmkm || !selectedPeriod) {
      setStats({ omzet: 0, jumlah_produk: 0, jumlah_tenaga_kerja: 0, jumlah_pelanggan: 0 });
      return;
    }
    const [month, year] = selectedPeriod.split("|").map(Number);
    getAutoFillDataAction(selectedUmkm, month, year).then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
      }
    });
  }, [selectedUmkm, selectedPeriod]);

  const openEdit = (m: any) => {
    setEditData(m);
    if (typeof window !== "undefined" && (window as any).bootstrap) {
      const modal = new (window as any).bootstrap.Modal(document.getElementById('editMonitoringModal'));
      modal.show();
    }
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (user.role === 'umkm') {
      formData.set('umkm_id', (user.umkm_id || user.id).toString());
    }

    if (typeof window === 'undefined') return;
    const Swal = (window as any).Swal;

    Swal.fire({
      title: 'Menyimpan Data...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const res = await createMonitoringAction(formData);

    if (res.success) {
      if ((window as any).bootstrap) {
        const modalEl = document.getElementById('addMonitoringModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      Swal.fire({icon: 'success', title: 'Berhasil', text: 'Data monitoring berhasil disimpan!'}).then(() => {
        window.location.reload();
      });
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
      title: 'Memperbarui Data...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const res = await updateMonitoringAction(formData);

    if (res.success) {
      if ((window as any).bootstrap) {
        const modalEl = document.getElementById('editMonitoringModal');
        const modal = (window as any).bootstrap.Modal.getInstance(modalEl);
        modal?.hide();
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
      }
      Swal.fire({icon: 'success', title: 'Berhasil', text: 'Data monitoring berhasil diperbarui!'}).then(() => {
        window.location.reload();
      });
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

              const res = await deleteMonitoringAction(id);
              if (res.success) {
                  Swal.fire({icon: 'success', title: 'Terhapus!', text: 'Data monitoring berhasil dihapus.'}).then(() => {
                    window.location.reload();
                  });
              } else {
                  Swal.fire({icon: 'error', title: 'Gagal', text: res.message || 'Gagal menghapus.'});
              }
          }
      });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Perkembangan Usaha</h5>
              <p className="text-muted fs-sm mb-0">Monitoring perkembangan usaha UMKM</p>
          </div>
          <div className="d-flex gap-2">
              {user.role !== 'umkm' && (
              <Link href="/dashboard/monitoring" className="btn-outline-custom">
                  <i className="bi bi-arrow-left"></i> Kembali
              </Link>
              )}
          </div>
      </div>

      {/* Filter Panel */}
      <div className="panel mb-4 p-3">
          <div className="row g-3 align-items-end">
              <div className="col-md-5">
                  <label className="form-label fs-xs text-muted fw-bold text-uppercase">Filter Bulan</label>
                  <select
                      className="form-control form-control-custom"
                      value={filterBulan}
                      onChange={(e) => setFilterBulan(e.target.value)}
                  >
                      <option value="">-- Semua Bulan --</option>
                      {months.map(m => (
                          <option key={m} value={m}>{m}</option>
                      ))}
                  </select>
              </div>
              <div className="col-md-5">
                  <label className="form-label fs-xs text-muted fw-bold text-uppercase">Filter Tahun</label>
                  <select
                      className="form-control form-control-custom"
                      value={filterTahun}
                      onChange={(e) => setFilterTahun(e.target.value)}
                  >
                      <option value="">-- Semua Tahun --</option>
                      {uniqueYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                      ))}
                  </select>
              </div>
              <div className="col-md-2">
                  <button
                      className="btn-outline-custom w-100 justify-content-center"
                      onClick={() => {
                          setFilterBulan("");
                          setFilterTahun("");
                      }}
                  >
                      <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Filter
                  </button>
              </div>
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
      <div className="modal fade" id="addMonitoringModal" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
              <div className="modal-content">
                  <div className="modal-header">
                      <h5 className="modal-title"><i className="bi bi-plus-circle text-primary me-2"></i>Tambah Monitoring</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <form onSubmit={handleCreate}>
                      <div className="modal-body">
                          <div className="row g-3">
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>UMKM</label>
                                      {user.role !== 'umkm' ? (
                                          activeUmkmId ? (
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
                                              <select name="umkm_id" className="form-control form-control-custom" onChange={(e) => setSelectedUmkm(e.target.value ? Number(e.target.value) : undefined)} required>
                                                  <option value="">-- Pilih UMKM --</option>
                                                  {umkmList.map(u => (
                                                      <option key={u.id} value={u.id}>{u.nama_umkm}</option>
                                                  ))}
                                              </select>
                                          )
                                      ) : (
                                      <>
                                          <div className="p-2 border rounded bg-light fw-bold">{user.nickname || 'UMKM Anda'}</div>
                                          <input type="hidden" name="umkm_id" value={user.umkm_id || user.id} />
                                      </>
                                      )}
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Periode Penjualan</label>
                                      <select
                                          name="periode"
                                          className="form-control form-control-custom"
                                          value={selectedPeriod}
                                          onChange={(e) => setSelectedPeriod(e.target.value)}
                                          required
                                      >
                                          <option value="">-- Pilih Periode --</option>
                                          {loadingPeriods ? (
                                              <option value="" disabled>Loading periode...</option>
                                          ) : periods.length === 0 ? (
                                              <option value="" disabled>-- Belum ada data Penjualan --</option>
                                          ) : (
                                              periods.map((p) => (
                                                  <option key={p.val} value={p.val}>{p.label}</option>
                                              ))
                                          )}
                                      </select>
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Omzet (Rp) <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto dari Penjualan</span></label>
                                      <input type="number" name="omzet" value={stats.omzet} className="form-control form-control-custom bg-light" readOnly required />
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Jumlah Produk <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto dari Data Produk</span></label>
                                      <input type="number" name="jumlah_produk" value={stats.jumlah_produk} className="form-control form-control-custom bg-light" readOnly required />
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Jumlah Tenaga Kerja <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto dari Penjualan</span></label>
                                      <input type="number" name="jumlah_tenaga_kerja" value={stats.jumlah_tenaga_kerja} className="form-control form-control-custom bg-light" readOnly required />
                                  </div>
                              </div>
                              <div className="col-md-6">
                                  <div className="form-group-custom">
                                      <label>Jumlah Pelanggan <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto dari Penjualan</span></label>
                                      <input type="number" name="jumlah_pelanggan" value={stats.jumlah_pelanggan} className="form-control form-control-custom bg-light" readOnly required />
                                  </div>
                              </div>
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>Media Pemasaran</label>
                                      <input type="text" name="media_pemasaran" className="form-control form-control-custom" placeholder="Instagram, Shopee, dll" />
                                  </div>
                              </div>
                              <div className="col-12">
                                  <div className="form-group-custom">
                                      <label>Catatan</label>
                                      <textarea name="catatan" className="form-control form-control-custom" rows={2}></textarea>
                                  </div>
                              </div>
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
      <div className="modal fade" id="editMonitoringModal" tabIndex={-1}>
          <div className="modal-dialog modal-lg">
              <div className="modal-content">
                  <div className="modal-header">
                      <h5 className="modal-title"><i className="bi bi-pencil-square text-warning me-2"></i>Edit Monitoring</h5>
                      <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                   <form onSubmit={handleUpdate} key={editData?.id || 'empty'}>
                       <input type="hidden" name="id" value={editData?.id || ''} />
                       <div className="modal-body">
                           <div className="row g-3">
                               <div className="col-md-6">
                                   <div className="form-group-custom"><label>UMKM</label>
                                       <select name="umkm_id" className="form-control form-control-custom" disabled defaultValue={editData?.umkm_id || ''}>
                                           {umkmList.map(u => (
                                               <option key={u.id} value={u.id}>{u.nama_umkm}</option>
                                           ))}
                                       </select>
                                   </div>
                               </div>
                               <div className="col-md-6">
                                   <div className="form-group-custom"><label>Periode Penjualan</label>
                                       <select name="periode" className="form-control form-control-custom" disabled defaultValue={`${editData?.bulan}|${editData?.tahun}`}>
                                           <option value={`${editData?.bulan}|${editData?.tahun}`}>{editData?.bulan} {editData?.tahun}</option>
                                       </select>
                                   </div>
                               </div>
                               <div className="col-md-6">
                                   <div className="form-group-custom">
                                       <label>Omzet (Rp) <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto</span></label>
                                       <input type="number" name="omzet" className="form-control form-control-custom bg-light" required defaultValue={editData?.omzet || 0} readOnly />
                                   </div>
                               </div>
                               <div className="col-md-6">
                                   <div className="form-group-custom">
                                       <label>Jumlah Produk <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto</span></label>
                                       <input type="number" name="jumlah_produk" className="form-control form-control-custom bg-light" required defaultValue={editData?.jumlah_produk || 0} readOnly />
                                   </div>
                               </div>
                               <div className="col-md-6">
                                   <div className="form-group-custom">
                                       <label>Jumlah Tenaga Kerja <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto</span></label>
                                       <input type="number" name="jumlah_tenaga_kerja" className="form-control form-control-custom bg-light" required defaultValue={editData?.jumlah_tenaga_kerja || 0} readOnly />
                                   </div>
                               </div>
                               <div className="col-md-6">
                                   <div className="form-group-custom">
                                       <label>Jumlah Pelanggan <span className="badge bg-secondary bg-opacity-10 text-secondary ms-1 fs-xs">Auto</span></label>
                                       <input type="number" name="jumlah_pelanggan" className="form-control form-control-custom bg-light" required defaultValue={editData?.jumlah_pelanggan || 0} readOnly />
                                   </div>
                               </div>
                               <div className="col-12"><div className="form-group-custom"><label>Media Pemasaran</label><input type="text" name="media_pemasaran" className="form-control form-control-custom" defaultValue={editData?.media_pemasaran || ''} /></div></div>
                               <div className="col-12"><div className="form-group-custom"><label>Catatan</label><textarea name="catatan" className="form-control form-control-custom" rows={2} defaultValue={editData?.catatan || ''}></textarea></div></div>
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
