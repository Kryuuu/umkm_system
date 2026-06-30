"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import Link from "next/link";

export default function AdminCharts({ 
  chartData, 
  kategoriData,
  growthData,
  leaderboard
}: { 
  chartData: any[];
  kategoriData: any[];
  growthData: any[];
  leaderboard: any[];
}) {
  const omzetRef = useRef<HTMLCanvasElement>(null);
  const kategoriRef = useRef<HTMLCanvasElement>(null);
  const tenagaKerjaRef = useRef<HTMLCanvasElement>(null);
  const pelangganRef = useRef<HTMLCanvasElement>(null);

  const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

  const formatChartOmzet = (v: any) => {
    if (v >= 1000000) {
      return 'Rp ' + parseFloat((v / 1000000).toFixed(2)).toString().replace('.', ',') + ' JT';
    } else if (v >= 1000) {
      return 'Rp ' + parseFloat((v / 1000).toFixed(1)).toString().replace('.', ',') + ' K';
    }
    return 'Rp ' + v;
  };

  useEffect(() => {
    let omzetChart: Chart | null = null;
    let kategoriChart: Chart | null = null;
    let tkChart: Chart | null = null;
    let pelangganChart: Chart | null = null;

    const createCharts = (currentTheme: string) => {
      // Destroy existing charts if any
      if (omzetChart) omzetChart.destroy();
      if (kategoriChart) kategoriChart.destroy();
      if (tkChart) tkChart.destroy();
      if (pelangganChart) pelangganChart.destroy();

      const tickColor = currentTheme === 'dark' ? '#cbd5e1' : '#64748b';
      const gridColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
      const legendTextColor = currentTheme === 'dark' ? '#f8fafc' : '#1e293b';

      if (omzetRef.current && chartData.length > 0) {
        const umkmGroups: any = {}; 
        const months: string[] = [];
        
        chartData.forEach(item => {
          if (!umkmGroups[item.nama_umkm]) umkmGroups[item.nama_umkm] = {};
          umkmGroups[item.nama_umkm][item.bulan] = parseFloat(item.omzet);
          if (!months.includes(item.bulan)) months.push(item.bulan);
        });
        
        const datasets = Object.keys(umkmGroups).map((name, idx) => ({
          label: name, 
          data: months.map(m => umkmGroups[name][m] || 0),
          borderColor: colors[idx % colors.length], 
          backgroundColor: colors[idx % colors.length] + '15',
          fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4, pointBackgroundColor: '#fff'
        }));

        omzetChart = new Chart(omzetRef.current, {
          type: 'line', 
          data: { labels: months, datasets: datasets },
          options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { 
              legend: { 
                position: 'bottom', 
                labels: { boxWidth: 12, usePointStyle: true, color: legendTextColor } 
              } 
            },
            scales: { 
              y: { 
                beginAtZero: true, 
                grid: { color: gridColor }, 
                border: { dash: [5, 5] }, 
                ticks: { callback: formatChartOmzet, color: tickColor } 
              },
              x: { 
                grid: { display: false },
                ticks: { color: tickColor }
              }
            } 
          }
        });
      }

      if (kategoriRef.current && kategoriData.length > 0) {
        kategoriChart = new Chart(kategoriRef.current, {
          type: 'doughnut', 
          data: { 
            labels: kategoriData.map(k => k.kategori_produk), 
            datasets: [{ data: kategoriData.map(k => k.total), backgroundColor: colors.slice(0, kategoriData.length), borderWidth: 0 }] 
          },
          options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { 
              legend: { 
                position: 'bottom', 
                labels: { boxWidth: 12, usePointStyle: true, color: legendTextColor } 
              } 
            },
            cutout: '70%'
          }
        });
      }

      if (tenagaKerjaRef.current && growthData.length > 0) {
        const growthMonths = growthData.map(g => g.bulan);
        tkChart = new Chart(tenagaKerjaRef.current, {
          type: 'bar',
          data: {
            labels: growthMonths,
            datasets: [{
              label: 'Tenaga Kerja',
              data: growthData.map(g => parseInt(g.total_tk)),
              backgroundColor: 'rgba(124, 58, 237, 0.8)',
              borderRadius: 6
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { 
              y: { 
                beginAtZero: true,
                grid: { color: gridColor },
                ticks: { color: tickColor }
              }, 
              x: { 
                grid: { display: false },
                ticks: { color: tickColor }
              } 
            } 
          }
        });
      }

      if (pelangganRef.current && growthData.length > 0) {
        const growthMonths = growthData.map(g => g.bulan);
        pelangganChart = new Chart(pelangganRef.current, {
          type: 'bar',
          data: {
            labels: growthMonths,
            datasets: [{
              label: 'Pelanggan',
              data: growthData.map(g => parseInt(g.total_pelanggan)),
              backgroundColor: 'rgba(217, 119, 6, 0.8)',
              borderRadius: 6
            }]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } }, 
            scales: { 
              y: { 
                beginAtZero: true,
                grid: { color: gridColor },
                ticks: { color: tickColor }
              }, 
              x: { 
                grid: { display: false },
                ticks: { color: tickColor }
              } 
            } 
          }
        });
      }
    };

    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    createCharts(initialTheme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const updatedTheme = document.documentElement.getAttribute('data-theme') || 'light';
          createCharts(updatedTheme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      if (omzetChart) omzetChart.destroy();
      if (kategoriChart) kategoriChart.destroy();
      if (tkChart) tkChart.destroy();
      if (pelangganChart) pelangganChart.destroy();
      observer.disconnect();
    };
  }, [chartData, kategoriData, growthData]);

  return (
    <>
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="panel border-0 shadow-sm rounded-4 h-100">
            <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2">
              <h5 className="fw-bold mb-0"><i className="bi bi-graph-up text-primary me-2"></i> Tren Pertumbuhan Omzet</h5>
            </div>
            <div className="panel-body p-3 p-md-4"><div className="chart-container" style={{height:'350px'}}><canvas ref={omzetRef}></canvas></div></div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="panel border-0 shadow-sm rounded-4 h-100">
            <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2">
              <h5 className="fw-bold mb-0"><i className="bi bi-pie-chart-fill text-success me-2"></i> Distribusi Kategori</h5>
            </div>
            <div className="panel-body p-3 p-md-4"><div className="chart-container" style={{height:'350px'}}><canvas ref={kategoriRef}></canvas></div></div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="panel border-0 shadow-sm rounded-4 h-100">
            <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2">
              <h5 className="fw-bold mb-0"><i className="bi bi-bar-chart-line-fill text-warning me-2"></i> Pertumbuhan Skala Usaha (Pekerja & Pelanggan)</h5>
            </div>
            <div className="panel-body p-3 p-md-4">
              <div className="row">
                <div className="col-6"><div className="chart-container" style={{height:'250px'}}><canvas ref={tenagaKerjaRef}></canvas></div></div>
                <div className="col-6"><div className="chart-container" style={{height:'250px'}}><canvas ref={pelangganRef}></canvas></div></div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel border-0 shadow-sm rounded-4 h-100">
            <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2 d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0"><i className="bi bi-trophy-fill text-warning me-2"></i> Leaderboard Nasional</h5>
              <Link href="/dashboard/leaderboard" className="btn btn-sm btn-outline-primary rounded-pill px-3">Semua</Link>
            </div>
            <div className="panel-body p-3 p-md-4">
              <div className="d-flex flex-column gap-2">
                {leaderboard.slice(0, 5).map((u, i) => {
                  const rc = (i < 3) ? ['rank-1','rank-2','rank-3'][i] : 'rank-other';
                  return (
                    <div key={u.id} className="leaderboard-item">
                      <span className={`leaderboard-rank ${rc}`}>{i + 1}</span>
                      <div className="leaderboard-info">
                        <h6 className="mb-0">{u.nama_umkm}</h6>
                        <span className="text-muted fs-xs">{u.nama_pemilik}</span>
                      </div>
                      <div className="leaderboard-score">
                        <div className="score-value">{Math.round(u.skor_usaha || 0)}</div>
                        <div className="score-label">Skor</div>
                      </div>
                    </div>
                  );
                })}
                {leaderboard.length === 0 && (
                  <div className="text-center text-muted p-3 border rounded-3 fs-sm bg-light">Belum ada data leaderboard</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
