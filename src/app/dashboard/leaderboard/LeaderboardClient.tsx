"use client";

import Link from "next/link";
import { analyzeUmkmAction, analyzeAllAction } from "./actions";

export default function LeaderboardClient({ leaderboard, user }: { leaderboard: any[], user: any }) {

  const formatNumber = (num: number) => {
      return Number(num).toLocaleString('id-ID');
  };

  const handleAnalyzeAll = async (e: any) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    const Swal = (window as any).Swal;

    Swal.fire({
      title: "Menganalisis Semua UMKM...",
      text: "Proses ini mungkin memakan waktu beberapa detik.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const res = await analyzeAllAction();
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Analisis seluruh UMKM berhasil dilakukan.'
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: res.message || 'Gagal menganalisis seluruh UMKM.'
      });
    }
  };

  const handleAnalyzeSingle = async (e: any, umkmId: number) => {
    e.preventDefault();
    if (typeof window === "undefined") return;
    const Swal = (window as any).Swal;

    Swal.fire({
      title: "Menganalisis UMKM...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const res = await analyzeUmkmAction(umkmId);
    if (res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Analisis UMKM berhasil dilakukan.'
      }).then(() => {
        window.location.reload();
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: res.message || 'Gagal menganalisis UMKM.'
      });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Leaderboard UMKM</h5>
              <p className="text-muted fs-sm mb-0">Ranking UMKM berdasarkan skor usaha</p>
          </div>
          {user.role !== 'Mitra' && (
          <form onSubmit={handleAnalyzeAll} style={{display:'inline'}}>
              <button type="submit" className="btn-success-custom"><i className="bi bi-cpu"></i> Analisis Semua UMKM</button>
          </form>
          )}
      </div>

      <div className="row g-4">
          {/* Top 3 Cards */}
          {leaderboard.slice(0, 3).map((u, idx) => {
              const medals = ['🥇','🥈','🥉']; 
              const bgColors = ['linear-gradient(135deg,#fbbf24,#f59e0b)','linear-gradient(135deg,#94a3b8,#64748b)','linear-gradient(135deg,#f97316,#ea580c)'];
              const statusClass = 'badge-' + (u.status_usaha || '').toLowerCase().replace(/ /g, '-');
              
              return (
              <div key={u.id} className="col-md-4">
                  <div className="panel" style={{borderTop:'3px solid transparent', backgroundImage:bgColors[idx], backgroundSize:'100% 3px', backgroundRepeat:'no-repeat'}}>
                      <div className="panel-body text-center">
                          <div style={{fontSize:'2.5rem', marginBottom:'8px'}}>{medals[idx]}</div>
                          <h5 className="fw-bold mb-1">{u.nama_umkm}</h5>
                          <p className="text-muted fs-sm mb-3">{u.nama_pemilik}</p>
                          <div className="d-flex justify-content-center gap-3 mb-3">
                              <div className="text-center"><div className="fw-800 text-primary" style={{fontSize:'1.5rem'}}>{formatNumber(u.skor_usaha || 0)}</div><div className="fs-xs text-muted">SKOR</div></div>
                              <div className="text-center"><div className="fw-800 text-success" style={{fontSize:'1.5rem'}}>Rp {formatNumber((u.total_omzet || 0)/1000000)}jt</div><div className="fs-xs text-muted">OMZET</div></div>
                              <div className="text-center"><div className="fw-800" style={{fontSize:'1.5rem'}}>{u.total_produk || 0}</div><div className="fs-xs text-muted">PRODUK</div></div>
                          </div>
                          <span className={`badge-status ${statusClass}`}>{u.status_usaha}</span>
                          {user.role !== 'Mitra' && (
                          <form onSubmit={(e) => handleAnalyzeSingle(e, u.id)} className="mt-3">
                              <input type="hidden" name="umkm_id" value={u.id} />
                              <button type="submit" className="btn-outline-custom" style={{padding:'6px 12px', fontSize:'0.75rem'}}><i className="bi bi-cpu"></i> Re-Analisis</button>
                          </form>
                          )}
                      </div>
                  </div>
              </div>
              );
          })}
      </div>

      {/* Full Ranking Table */}
      <div className="panel mt-4">
          <div className="panel-header"><h5><i className="bi bi-list-ol"></i> Ranking Lengkap</h5></div>
          <div className="panel-body p-0">
              <div className="table-responsive p-3">
                  <table className="table-custom data-table" style={{width:'100%'}}>
                      <thead><tr><th>#</th><th>UMKM</th><th>Pemilik</th><th>Omzet Total</th><th>Produk</th><th>Skor</th><th>Status</th><th>Rekomendasi</th></tr></thead>
                      <tbody>
                      {leaderboard.map((u, i) => {
                          const sc = 'badge-' + (u.status_usaha || '').toLowerCase().replace(/ /g, '-');
                          const rc = (i < 3) ? ['rank-1','rank-2','rank-3'][i] : 'rank-other';
                          return (
                          <tr key={u.id}>
                              <td><span className={`leaderboard-rank ${rc}`} style={{width:'32px', height:'32px', fontSize:'0.75rem'}}>{i+1}</span></td>
                              <td><strong>{u.nama_umkm}</strong></td>
                              <td>{u.nama_pemilik}</td>
                              <td className="fw-bold text-success">Rp {formatNumber(u.total_omzet || 0)}</td>
                              <td>{u.total_produk || 0}</td>
                              <td>
                                  {user.role === 'Mitra' && u.id !== (user.umkm_id || user.id) ? (
                                  <a href="#" onClick={(e) => { e.preventDefault(); window.Swal.fire({icon: 'error', title: 'Akses Dibatasi!', text: 'Anda tidak memiliki hak untuk melihat detail analisis dari UMKM lain.', confirmButtonText: 'Mengerti'}); }} className="text-decoration-none" title="Terkunci">
                                      <strong className="text-secondary bg-secondary bg-opacity-10 px-2 py-1 rounded">{formatNumber(u.skor_usaha || 0)} <i className="bi bi-lock-fill text-muted" style={{fontSize:'0.75rem'}}></i></strong>
                                  </a>
                                  ) : (
                                  <Link href={`/dashboard/umkm/analisis/${u.id}`} className="text-decoration-none" title="Lihat Analisis Skor">
                                      <strong className="text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">{formatNumber(u.skor_usaha || 0)} <i className="bi bi-search" style={{fontSize:'0.75rem'}}></i></strong>
                                  </Link>
                                  )}
                              </td>
                              <td><span className={`badge-status ${sc}`}>{u.status_usaha}</span></td>
                              <td className="fs-sm text-muted">{u.rekomendasi || '-'}</td>
                          </tr>
                          );
                      })}
                      </tbody>
                  </table>
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
