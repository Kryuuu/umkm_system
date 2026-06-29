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

    if (omzetRef.current && monitoringData.length > 0) {
      const personalMon = [...monitoringData].reverse();
      omzetChart = new Chart(omzetRef.current, {
        type: 'line',
        data: {
          labels: personalMon.map(m => m.bulan + ' ' + m.tahun),
          datasets: [{
            label: 'Omzet Bulanan',
            data: personalMon.map(m => parseFloat(m.omzet)),
            borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true, tension: 0.4, borderWidth: 3, pointRadius: 5, pointBackgroundColor: '#fff', pointHoverRadius: 7
          }]
        },
        options: { 
          responsive: true, maintainAspectRatio: false, 
          plugins: { legend: { display: false } },
          scales: { 
            y: { beginAtZero: true, grid: { borderDash: [5, 5] } as any, ticks: { callback: formatChartOmzet } },
            x: { grid: { display: false } }
          } 
        }
      });
    }

    return () => {
      if (omzetChart) omzetChart.destroy();
    };
  }, [monitoringData]);

  return (
    <div className="panel border-0 shadow-sm rounded-4 mb-4">
      <div className="panel-header border-bottom-0 pt-4 px-4 pb-2">
        <h5 className="fw-bold mb-0"><i className="bi bi-graph-up-arrow text-primary me-2"></i> Grafik Omzet Usaha</h5>
      </div>
      <div className="panel-body p-4"><div className="chart-container" style={{height:'320px'}}><canvas ref={omzetRef}></canvas></div></div>
    </div>
  );
}
