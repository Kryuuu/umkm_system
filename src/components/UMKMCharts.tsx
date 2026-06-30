"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function UMKMCharts({ monitoringData }: { monitoringData: any[] }) {
  const omzetRef = useRef<HTMLCanvasElement>(null);

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

    const createChart = (currentTheme: string) => {
      if (omzetChart) {
        omzetChart.destroy();
      }

      if (omzetRef.current && monitoringData.length > 0) {
        const personalMon = [...monitoringData].reverse();
        const tickColor = currentTheme === 'dark' ? '#cbd5e1' : '#64748b';
        const gridColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

        omzetChart = new Chart(omzetRef.current, {
          type: 'line',
          data: {
            labels: personalMon.map(m => m.bulan + ' ' + m.tahun),
            datasets: [{
              label: 'Omzet Bulanan',
              data: personalMon.map(m => parseFloat(m.omzet)),
              borderColor: '#6366f1', 
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              fill: true, tension: 0.4, borderWidth: 3, pointRadius: 5, pointBackgroundColor: '#fff', pointHoverRadius: 7
            }]
          },
          options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: { 
              y: { 
                beginAtZero: true, 
                grid: { borderDash: [5, 5], color: gridColor } as any, 
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
    };

    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    createChart(initialTheme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          const updatedTheme = document.documentElement.getAttribute('data-theme') || 'light';
          createChart(updatedTheme);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      if (omzetChart) omzetChart.destroy();
      observer.disconnect();
    };
  }, [monitoringData]);

  if (monitoringData.length === 0) {
    return (
      <div className="panel border-0 shadow-sm rounded-4 mb-4">
        <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2">
          <h5 className="fw-bold mb-0"><i className="bi bi-graph-up-arrow text-primary me-2"></i> Grafik Omzet Usaha</h5>
        </div>
        <div className="panel-body p-3 p-md-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ height: '320px' }}>
          <div className="rounded-circle d-flex align-items-center justify-content-center mb-3" style={{ width: '80px', height: '80px', color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
            <i className="bi bi-bar-chart-line" style={{ fontSize: '2.2rem' }}></i>
          </div>
          <h6 className="fw-bold text-dark mb-1">Belum Ada Data Grafik Omzet</h6>
          <p className="text-muted small mb-0" style={{ maxWidth: '380px', lineHeight: '1.5' }}>
            Data perkembangan usaha Anda masih kosong. Silakan tambahkan data omzet bulanan Anda pada menu <strong>Perkembangan Usaha</strong> untuk menampilkan grafik performa usaha.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel border-0 shadow-sm rounded-4 mb-4">
      <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2">
        <h5 className="fw-bold mb-0"><i className="bi bi-graph-up-arrow text-primary me-2"></i> Grafik Omzet Usaha</h5>
      </div>
      <div className="panel-body p-3 p-md-4"><div className="chart-container" style={{height:'320px'}}><canvas ref={omzetRef}></canvas></div></div>
    </div>
  );
}
