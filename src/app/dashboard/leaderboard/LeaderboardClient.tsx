"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LeaderboardClient({ 
  leaderboard, 
  user, 
  periods, 
  selectedPeriod 
}: { 
  leaderboard: any[];
  user: any;
  periods?: { bulan: string; tahun: number; label: string; val: string }[];
  selectedPeriod?: string;
}) {
  const router = useRouter();

  const formatNumber = (num: number) => {
      return Number(num).toLocaleString('id-ID');
  };


  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
              <h5 className="fw-bold mb-1">Leaderboard UMKM</h5>
              <p className="text-muted fs-sm mb-0">Ranking UMKM berdasarkan skor usaha</p>
          </div>
          {periods && periods.length > 0 && (
            <div className="d-flex align-items-center gap-2">
              <label className="text-muted fs-sm fw-semibold mb-0 text-nowrap">
                <i className="bi bi-calendar-month me-1"></i> Periode:
              </label>
              <select 
                className="form-select form-select-sm rounded-pill shadow-sm bg-white" 
                style={{ minWidth: "150px", border: "1px solid rgba(0,0,0,0.1)" }}
                value={selectedPeriod}
                onChange={(e) => {
                  const val = e.target.value;
                  const [b, t] = val.split(' ');
                  router.push(`/dashboard/leaderboard?bulan=${b}&tahun=${t}`);
                }}
              >
                {periods.map(p => (
                  <option key={p.val} value={p.val}>{p.label}</option>
                ))}
              </select>
            </div>
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
                      <thead><tr><th>#</th><th>UMKM</th><th>Pemilik</th><th>{selectedPeriod && selectedPeriod.startsWith('Semua') ? 'Omzet (Keseluruhan)' : `Omzet (${selectedPeriod})`}</th><th>Produk</th><th>Skor</th><th>Status</th><th>Rekomendasi</th></tr></thead>
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
