"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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

  // Compute stats
  const stats = useMemo(() => {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    const todayStr = today.toISOString().split('T')[0];

    const bulanIni = pelatihanList.filter(p => {
      const d = new Date(p.tanggal);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;

    const upcoming = pelatihanList.filter(p => p.tanggal >= todayStr).length;
    const withMateri = pelatihanList.filter(p => p.file_materi).length;

    return { total: pelatihanList.length, bulanIni, upcoming, withMateri };
  }, [pelatihanList]);

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

    const showAksi = user.role !== 'Mitra';

    const getDateParts = (dateString: string) => {
      const d = new Date(dateString);
      return {
        day: d.getDate().toString().padStart(2, '0'),
        month: d.toLocaleDateString('id-ID', { month: 'short' }),
        year: d.getFullYear()
      };
    };

    const getStatusInfo = (dateString: string) => {
      const today = new Date().toISOString().split('T')[0];
      if (dateString < today) return { text: 'Selesai', color: '#059669', bg: 'rgba(16,185,129,0.08)', icon: 'bi-check-circle-fill' };
      if (dateString === today) return { text: 'Hari Ini', color: '#d97706', bg: 'rgba(245,158,11,0.08)', icon: 'bi-broadcast' };
      return { text: 'Mendatang', color: '#4f46e5', bg: 'rgba(79,70,229,0.08)', icon: 'bi-clock' };
    };

    const tableHtml = `
      <table id="pelatihan-table" class="table-custom pelatihan-table-premium" style="width:100%">
          <thead>
              <tr>
                  <th style="width:48px">No</th>
                  <th>Pelatihan</th>
                  <th>Tanggal</th>
                  <th>Pemateri</th>
                  <th>Lokasi</th>
                  <th style="width:100px">Materi</th>
                  ${showAksi ? '<th style="width:160px">Aksi</th>' : ''}
              </tr>
          </thead>
          <tbody>
              ${pelatihanList.map((p, idx) => {
                const dp = getDateParts(p.tanggal);
                const st = getStatusInfo(p.tanggal);
                return `
              <tr data-id="${p.id}">
                  <td>
                    <span class="pelatihan-row-num">${idx + 1}</span>
                  </td>
                  <td>
                    <div class="pelatihan-name-cell">
                      <strong class="pelatihan-title">${p.nama_pelatihan}</strong>
                      <span class="pelatihan-status-pill" style="color:${st.color};background:${st.bg}">
                        <i class="bi ${st.icon}" style="font-size:0.55rem"></i> ${st.text}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div class="pelatihan-date-badge">
                      <span class="pelatihan-date-day">${dp.day}</span>
                      <div class="pelatihan-date-meta">
                        <span class="pelatihan-date-month">${dp.month}</span>
                        <span class="pelatihan-date-year">${dp.year}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="pelatihan-pemateri">
                      <span class="pelatihan-pemateri-avatar">${(p.pemateri || 'N')[0].toUpperCase()}</span>
                      <span>${p.pemateri}</span>
                    </div>
                  </td>
                  <td>
                    <div class="pelatihan-lokasi">
                      <i class="bi bi-geo-alt-fill text-danger" style="font-size:0.7rem"></i>
                      <span>${p.lokasi}</span>
                    </div>
                  </td>
                  <td class="text-center">
                      ${p.file_materi ? `
                          <a href="/uploads/materi/${p.file_materi}" class="pelatihan-dl-btn" download title="Download Materi">
                              <i class="bi bi-cloud-arrow-down-fill"></i> Unduh
                          </a>
                      ` : `
                          <span class="text-muted" style="font-size:0.75rem">—</span>
                      `}
                  </td>
                  ${showAksi ? `
                  <td>
                      <div class="pelatihan-actions">
                          <button class="pelatihan-act-btn act-kehadiran btn-kehadiran" data-id="${p.id}" title="Kehadiran">
                              <i class="bi bi-clipboard-check-fill"></i>
                          </button>
                          <button class="pelatihan-act-btn act-qr btn-qr-code" data-id="${p.id}" title="QR Code Live">
                              <i class="bi bi-qr-code"></i>
                          </button>
                          <button class="pelatihan-act-btn act-edit btn-edit" data-index="${idx}" title="Edit">
                              <i class="bi bi-pencil-fill"></i>
                          </button>
                          <button class="pelatihan-act-btn act-delete btn-delete" data-id="${p.id}" title="Hapus">
                              <i class="bi bi-trash3-fill"></i>
                          </button>
                      </div>
                  </td>
                  ` : ''}
              </tr>
              `}).join('')}
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
      {/* ── Hero Banner ── */}
      <div className="pelatihan-hero">
        <div className="pelatihan-hero-bg"></div>
        <div className="pelatihan-hero-content">
          <div>
            <div className="pelatihan-hero-eyebrow">MANAJEMEN PELATIHAN</div>
            <h3 className="pelatihan-hero-title">Program Pelatihan UMKM</h3>
            <p className="pelatihan-hero-sub">Kelola, pantau, dan evaluasi seluruh program pelatihan untuk pengembangan kapasitas UMKM Binaan.</p>
          </div>
          <div className="pelatihan-hero-action">
            {user.role !== 'Mitra' ? (
              <button className="pelatihan-hero-btn" data-bs-toggle="modal" data-bs-target="#addPelatihanModal">
                <i className="bi bi-plus-lg"></i> Tambah Pelatihan
              </button>
            ) : (
              <Link href="/dashboard/pelatihan/scan" className="pelatihan-hero-btn pelatihan-hero-btn-scan">
                <i className="bi bi-qr-code-scan"></i> Scan Absensi
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="row g-3 mb-4">
        {[
          { icon: 'bi-mortarboard-fill', label: 'Total Pelatihan', value: stats.total, color: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
          { icon: 'bi-calendar-check-fill', label: 'Bulan Ini', value: stats.bulanIni, color: '#059669', bg: 'rgba(16,185,129,0.08)' },
          { icon: 'bi-clock-fill', label: 'Akan Datang', value: stats.upcoming, color: '#d97706', bg: 'rgba(245,158,11,0.08)' },
          { icon: 'bi-file-earmark-text-fill', label: 'Memiliki Materi', value: stats.withMateri, color: '#0284c7', bg: 'rgba(14,165,233,0.08)' },
        ].map((s, i) => (
          <div className="col-6 col-lg-3" key={i}>
            <div className="pelatihan-stat-card">
              <div className="pelatihan-stat-icon" style={{ color: s.color, background: s.bg }}>
                <i className={`bi ${s.icon}`}></i>
              </div>
              <div>
                <div className="pelatihan-stat-value">{s.value}</div>
                <div className="pelatihan-stat-label">{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table Panel ── */}
      <div className="panel border-0 shadow-sm rounded-4">
          <div className="panel-header border-bottom-0 d-flex align-items-center gap-2 px-4 pt-4 pb-2">
            <i className="bi bi-table text-primary"></i>
            <h5 className="fw-bold mb-0" style={{fontSize:'0.95rem'}}>Daftar Pelatihan</h5>
          </div>
          <div className="panel-body p-0">
              <div className="table-responsive p-3 pt-1" ref={tableContainerRef}></div>
          </div>
      </div>

      {/* Add Modal */}
      <div className="modal fade" id="addPelatihanModal" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{borderRadius:'20px'}}>
                   <div className="modal-header border-0 pb-0 pt-4 px-4">
                       <div>
                         <h5 className="modal-title fw-bold"><i className="bi bi-plus-circle-fill text-primary me-2"></i>Tambah Pelatihan Baru</h5>
                         <p className="text-muted fs-xs mb-0 mt-1">Isi formulir di bawah untuk menambahkan program pelatihan</p>
                       </div>
                       <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                   </div>
                   <form onSubmit={handleCreate}>
                       <div className="modal-body px-4 pt-3">
                           <div className="row g-3">
                             <div className="col-12"><div className="form-group-custom"><label>Nama Pelatihan</label><input type="text" name="nama_pelatihan" className="form-control form-control-custom" required placeholder="Contoh: Seminar Digital Marketing" /></div></div>
                             <div className="col-sm-6"><div className="form-group-custom"><label>Tanggal</label><input type="date" name="tanggal" className="form-control form-control-custom" required /></div></div>
                             <div className="col-sm-6"><div className="form-group-custom"><label>Pemateri</label><input type="text" name="pemateri" className="form-control form-control-custom" required placeholder="Nama pemateri" /></div></div>
                             <div className="col-12"><div className="form-group-custom"><label>Lokasi</label><input type="text" name="lokasi" className="form-control form-control-custom" required placeholder="Lokasi acara" /></div></div>
                             <div className="col-12"><div className="form-group-custom"><label>Deskripsi</label><textarea name="deskripsi" className="form-control form-control-custom" rows={2} placeholder="Deskripsi singkat pelatihan (opsional)"></textarea></div></div>
                             <div className="col-12"><div className="form-group-custom"><label>File Materi (PDF/DOC)</label><input type="file" name="file_materi" className="form-control form-control-custom" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /></div></div>
                           </div>
                       </div>
                       <div className="modal-footer border-0 px-4 pb-4 pt-2">
                           <button type="button" className="btn-outline-custom rounded-pill" data-bs-dismiss="modal">Batal</button>
                           <button type="submit" className="btn-primary-custom rounded-pill"><i className="bi bi-check-lg"></i> Simpan</button>
                       </div>
                   </form>
              </div>
          </div>
      </div>

      {/* Edit Modal */}
      <div className="modal fade" id="editPelatihanModal" tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg" style={{borderRadius:'20px'}}>
                   <div className="modal-header border-0 pb-0 pt-4 px-4">
                       <div>
                         <h5 className="modal-title fw-bold"><i className="bi bi-pencil-square text-warning me-2"></i>Edit Pelatihan</h5>
                         <p className="text-muted fs-xs mb-0 mt-1">Perbarui informasi pelatihan yang sudah ada</p>
                       </div>
                       <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                   </div>
                   <form onSubmit={handleUpdate}>
                       <input type="hidden" name="id" value={editData?.id || ''} />
                       <div className="modal-body px-4 pt-3">
                           <div className="row g-3">
                             <div className="col-12"><div className="form-group-custom"><label>Nama Pelatihan</label><input type="text" name="nama_pelatihan" className="form-control form-control-custom" required defaultValue={editData?.nama_pelatihan || ''} /></div></div>
                             <div className="col-sm-6"><div className="form-group-custom"><label>Tanggal</label><input type="date" name="tanggal" className="form-control form-control-custom" required defaultValue={editData?.tanggal || ''} /></div></div>
                             <div className="col-sm-6"><div className="form-group-custom"><label>Pemateri</label><input type="text" name="pemateri" className="form-control form-control-custom" required defaultValue={editData?.pemateri || ''} /></div></div>
                             <div className="col-12"><div className="form-group-custom"><label>Lokasi</label><input type="text" name="lokasi" className="form-control form-control-custom" required defaultValue={editData?.lokasi || ''} /></div></div>
                             <div className="col-12"><div className="form-group-custom"><label>Deskripsi</label><textarea name="deskripsi" className="form-control form-control-custom" rows={2} defaultValue={editData?.deskripsi || ''}></textarea></div></div>
                             <div className="col-12"><div className="form-group-custom"><label>File Materi (PDF/DOC)</label><input type="file" name="file_materi" className="form-control form-control-custom" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx" /><small className="text-muted">Kosongkan jika tidak ingin mengganti file</small></div></div>
                           </div>
                       </div>
                       <div className="modal-footer border-0 px-4 pb-4 pt-2">
                           <button type="button" className="btn-outline-custom rounded-pill" data-bs-dismiss="modal">Batal</button>
                           <button type="submit" className="btn-primary-custom rounded-pill"><i className="bi bi-check-lg"></i> Simpan</button>
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
