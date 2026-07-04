"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Chart from "chart.js/auto";

export type ReportType =
  | "fasilitator"
  | "umkm"
  | "produk"
  | "perkembangan"
  | "pelatihan"
  | "pendampingan"
  | "kehadiran"
  | "penjualan"
  | "statistik"
  | "evaluasi";

type Row = Record<string, unknown>;

export type ReportPayload = {
  rows: Row[];
  pelatihan?: Row[];
  umkm?: Row[];
  categories?: Row[];
  summary?: Row;
};

type Column = {
  label: string;
  className?: string;
  render: (row: Row, index: number) => ReactNode;
};

const REPORT_META: Record<ReportType, { title: string; description: string }> = {
  fasilitator: { title: "Laporan Kinerja Staff UMKM", description: "Rekap beban binaan dan rata-rata skor UMKM" },
  umkm: { title: "Laporan Data UMKM Binaan", description: "Profil, legalitas, status, dan skor UMKM" },
  produk: { title: "Laporan Data Produk UMKM", description: "Rekap produk yang terdaftar pada sistem" },
  perkembangan: { title: "Laporan Perkembangan Usaha UMKM", description: "Rekap monitoring usaha per periode" },
  pelatihan: { title: "Laporan Kehadiran Pelatihan", description: "Daftar kehadiran peserta per kegiatan" },
  pendampingan: { title: "Laporan Data Pendampingan UMKM", description: "Riwayat dan hasil kegiatan pendampingan" },
  kehadiran: { title: "Laporan Kehadiran Pelatihan UMKM", description: "Ringkasan tingkat kehadiran seluruh pelatihan" },
  penjualan: { title: "Laporan Penjualan UMKM", description: "Rincian transaksi penjualan seluruh UMKM" },
  statistik: { title: "Laporan Statistik dan Performa UMKM", description: "Ringkasan program dan UMKM berkinerja terbaik" },
  evaluasi: { title: "Laporan Evaluasi Program Pembinaan UMKM", description: "Evaluasi omzet, produk, skor, dan rekomendasi" },
};

const rupiah = (value: unknown) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
const number = (value: unknown, digits = 0) => Number(value || 0).toLocaleString("id-ID", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});
const text = (value: unknown) => String(value ?? "-") || "-";
const shortId = (value: unknown) => String(value ?? "-").padStart(4, "0");
const date = (value: unknown) => {
  if (!value) return "-";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return text(value);
  return parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

function Badge({ children, tone = "primary" }: { children: ReactNode; tone?: string }) {
  return <span className={`badge-status report-badge report-badge-${tone}`}>{children}</span>;
}

function scoreTone(score: number) {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "danger";
}

function prediction(score: number) {
  if (score >= 80) return "Sangat Baik";
  if (score >= 60) return "Baik";
  return "Perlu Bimbingan";
}

function statusTone(value: unknown) {
  const status = String(value || "").toLowerCase();
  if (["hadir", "selesai", "siap pameran", "naik kelas"].some((item) => status.includes(item))) return "success";
  if (["izin", "proses", "berkembang"].some((item) => status.includes(item))) return "warning";
  if (["tidak", "ditolak"].some((item) => status.includes(item))) return "danger";
  return "primary";
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center text-muted py-5">
        <i className="bi bi-inbox d-block fs-3 mb-2 opacity-50" />
        Belum ada data untuk laporan ini.
      </td>
    </tr>
  );
}

function ReportTable({ rows, columns, printLimit }: { rows: Row[]; columns: Column[]; printLimit: number }) {
  return (
    <div className="panel report-panel">
      <div className="panel-body p-0">
        <div className="table-responsive report-table-wrap">
          <table className="table-custom report-table">
            <thead>
              <tr>{columns.map((column) => <th key={column.label} className={column.className}>{column.label}</th>)}</tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <EmptyRow colSpan={columns.length} /> : rows.map((row, index) => (
                <tr key={row.id == null ? `${index}-${JSON.stringify(row).slice(0, 20)}` : String(row.id)} className={index >= printLimit ? "print-hidden" : ""}>
                  {columns.map((column) => <td key={column.label} className={column.className}>{column.render(row, index)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function standardColumns(type: ReportType): Column[] {
  const no: Column = { label: "No", className: "text-center report-col-no", render: (_row, index) => index + 1 };

  switch (type) {
    case "fasilitator":
      return [
        no,
        { label: "Nama Staff", render: (row) => <strong>{text(row.nickname)}</strong> },
        { label: "Domisili", render: (row) => text(row.domisili) },
        { label: "Role", render: (row) => <Badge>{text(row.role)}</Badge> },
        { label: "Total UMKM", className: "text-center", render: (row) => number(row.total_umkm) },
        { label: "Rata-rata Skor", className: "text-center", render: (row) => <strong>{number(row.avg_skor, 1)}</strong> },
        { label: "Predikat", render: (row) => <Badge tone={scoreTone(Number(row.avg_skor))}>{prediction(Number(row.avg_skor))}</Badge> },
      ];
    case "umkm":
      return [
        { label: "ID", render: (row) => shortId(row.id) },
        { label: "Nama UMKM", render: (row) => <strong>{text(row.nama_umkm)}</strong> },
        { label: "Pemilik", render: (row) => text(row.nama_pemilik) },
        { label: "Telepon", render: (row) => text(row.no_telpon) },
        { label: "Email", render: (row) => text(row.email) },
        { label: "NIK", render: (row) => text(row.nik) },
        { label: "NIB", render: (row) => text(row.nib) },
        { label: "Status", render: (row) => <Badge tone={statusTone(row.status_usaha)}>{text(row.status_usaha)}</Badge> },
        { label: "Skor", className: "text-center", render: (row) => <strong>{number(row.skor_usaha)}</strong> },
      ];
    case "produk":
      return [
        no,
        { label: "Nama UMKM", render: (row) => text(row.nama_umkm) },
        { label: "Nama Produk", render: (row) => <strong>{text(row.nama_produk)}</strong> },
        { label: "Kategori", render: (row) => <Badge>{text(row.kategori_produk)}</Badge> },
        { label: "Harga", className: "text-end", render: (row) => rupiah(row.harga_produk) },
        { label: "Deskripsi", render: (row) => text(row.deskripsi_produk) },
      ];
    case "perkembangan":
      return [
        no,
        { label: "Nama UMKM", render: (row) => <strong>{text(row.nama_umkm)}</strong> },
        { label: "Bulan", render: (row) => text(row.bulan) },
        { label: "Tahun", className: "text-center", render: (row) => text(row.tahun) },
        { label: "Omzet", className: "text-end", render: (row) => <strong>{rupiah(row.omzet)}</strong> },
        { label: "Produk", className: "text-center", render: (row) => number(row.jumlah_produk) },
        { label: "Tenaga Kerja", className: "text-center", render: (row) => number(row.jumlah_tenaga_kerja) },
        { label: "Pelanggan", className: "text-center", render: (row) => number(row.jumlah_pelanggan) },
        { label: "Media Pemasaran", render: (row) => text(row.media_pemasaran) },
      ];
    case "pendampingan":
      return [
        no,
        { label: "Nama UMKM", render: (row) => <strong>{text(row.nama_umkm)}</strong> },
        { label: "Tanggal", render: (row) => date(row.tanggal) },
        { label: "Jenis Pendampingan", render: (row) => <Badge>{text(row.jenis_pendampingan)}</Badge> },
        { label: "Hasil", render: (row) => <Badge tone={statusTone(row.hasil)}>{text(row.hasil || "Proses")}</Badge> },
        { label: "Catatan", render: (row) => text(row.catatan) },
      ];
    case "penjualan":
      return [
        no,
        { label: "Tanggal", render: (row) => date(row.tanggal) },
        { label: "Nama UMKM", render: (row) => <strong>{text(row.nama_umkm)}</strong> },
        { label: "Produk", render: (row) => text(row.nama_produk) },
        { label: "Jumlah", className: "text-center", render: (row) => number(row.jumlah) },
        { label: "Total Penjualan", className: "text-end", render: (row) => <strong>{rupiah(row.total_harga)}</strong> },
      ];
    case "evaluasi":
      return [
        no,
        { label: "Nama UMKM", render: (row) => <strong>{text(row.nama_umkm)}</strong> },
        { label: "Pemilik", render: (row) => text(row.nama_pemilik) },
        { label: "Omzet Total", className: "text-end", render: (row) => <strong>{rupiah(row.total_omzet)}</strong> },
        { label: "Produk", className: "text-center", render: (row) => number(row.total_produk) },
        { label: "Skor", className: "text-center", render: (row) => <strong>{number(row.skor_usaha)}</strong> },
        { label: "Status", render: (row) => <Badge tone={statusTone(row.status_usaha)}>{text(row.status_usaha)}</Badge> },
        { label: "Rekomendasi", render: (row) => text(row.rekomendasi) },
      ];
    default:
      return [];
  }
}

function TrainingReport({ payload, printLimit, selectedId, onSelect }: {
  payload: ReportPayload;
  printLimit: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const selected = payload.pelatihan?.find((item) => item.id === selectedId);
  const attendance = useMemo(() => {
    const umkmMap = new Map((payload.umkm || []).map((item) => [item.id, item]));
    return payload.rows
      .filter((item) => item.pelatihan_id === selectedId && item.status_hadir)
      .map((item) => ({ ...item, ...(umkmMap.get(item.umkm_id) || {}) }));
  }, [payload, selectedId]);
  const columns: Column[] = [
    { label: "No", className: "text-center report-col-no", render: (_row, index) => index + 1 },
    { label: "Nama UMKM", render: (row) => <strong>{text(row.nama_umkm)}</strong> },
    { label: "Pemilik", render: (row) => text(row.nama_pemilik) },
    { label: "Status Kehadiran", render: (row) => <Badge tone={statusTone(row.status_hadir)}>{text(row.status_hadir)}</Badge> },
  ];

  return (
    <>
      <div className="no-print report-filter mb-4">
        <label htmlFor="pelatihanSelect" className="form-label fw-semibold mb-2">Pilih pelatihan</label>
        <select id="pelatihanSelect" className="form-control-custom" value={selectedId ?? ""} onChange={(event) => onSelect(Number(event.target.value))}>
          {(payload.pelatihan || []).length === 0 && <option value="">Belum ada pelatihan</option>}
          {(payload.pelatihan || []).map((item) => <option key={String(item.id)} value={Number(item.id)}>{text(item.nama_pelatihan)}</option>)}
        </select>
      </div>
      {selected && (
        <div className="report-training-info text-center mb-4">
          <strong>{text(selected.nama_pelatihan)}</strong>
          <span>{date(selected.tanggal)} | Pemateri: {text(selected.pemateri)} | {text(selected.lokasi)}</span>
        </div>
      )}
      <ReportTable rows={attendance} columns={columns} printLimit={printLimit} />
    </>
  );
}

function AttendanceSummary({ payload, printLimit }: { payload: ReportPayload; printLimit: number }) {
  const rows = useMemo(() => (payload.pelatihan || []).map((training) => {
    const attendance = payload.rows.filter((item) => item.pelatihan_id === training.id);
    const hadir = attendance.filter((item) => item.status_hadir === "hadir").length;
    const tidakHadir = attendance.filter((item) => item.status_hadir === "tidak_hadir").length;
    const izin = attendance.filter((item) => item.status_hadir === "izin").length;
    const total = attendance.length;
    return { ...training, hadir, tidak_hadir: tidakHadir, izin, total, persentase: total ? (hadir / total) * 100 : 0 };
  }), [payload]);
  const columns: Column[] = [
    { label: "No", className: "text-center report-col-no", render: (_row, index) => index + 1 },
    { label: "Nama Pelatihan", render: (row) => <strong>{text(row.nama_pelatihan)}</strong> },
    { label: "Tanggal", render: (row) => date(row.tanggal) },
    { label: "Hadir", className: "text-center", render: (row) => <Badge tone="success">{number(row.hadir)}</Badge> },
    { label: "Tidak Hadir", className: "text-center", render: (row) => <Badge tone="danger">{number(row.tidak_hadir)}</Badge> },
    { label: "Izin", className: "text-center", render: (row) => <Badge tone="warning">{number(row.izin)}</Badge> },
    { label: "Total Peserta", className: "text-center", render: (row) => number(row.total) },
    { label: "% Kehadiran", className: "text-center", render: (row) => <strong>{number(row.persentase, 1)}%</strong> },
  ];
  return <ReportTable rows={rows} columns={columns} printLimit={printLimit} />;
}

function StatisticsReport({ payload }: { payload: ReportPayload }) {
  const summary = payload.summary || {};
  const statusDistribution = (summary.statusDistribution as any[]) || [];
  const omzetTrend = (summary.omzetTrend as any[]) || [];

  const kategoriRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLCanvasElement>(null);
  const omzetTrendRef = useRef<HTMLCanvasElement>(null);
  const skorRef = useRef<HTMLCanvasElement>(null);

  const chartColors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

  const formatOmzet = (v: number) => {
    if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.', ',') + ' JT';
    if (v >= 1000) return (v / 1000).toFixed(0) + ' RB';
    return String(v);
  };

  useEffect(() => {
    let kategoriChart: Chart | null = null;
    let statusChart: Chart | null = null;
    let omzetChart: Chart | null = null;
    let skorChart: Chart | null = null;

    const createCharts = (theme: string) => {
      if (kategoriChart) kategoriChart.destroy();
      if (statusChart) statusChart.destroy();
      if (omzetChart) omzetChart.destroy();
      if (skorChart) skorChart.destroy();

      const tickColor = theme === 'dark' ? '#cbd5e1' : '#64748b';
      const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
      const legendColor = theme === 'dark' ? '#f8fafc' : '#1e293b';

      // Doughnut: Kategori Produk
      if (kategoriRef.current && (payload.categories || []).length > 0) {
        kategoriChart = new Chart(kategoriRef.current, {
          type: 'doughnut',
          data: {
            labels: (payload.categories || []).map(c => String(c.kategori_produk)),
            datasets: [{
              data: (payload.categories || []).map(c => Number(c.total)),
              backgroundColor: chartColors.slice(0, (payload.categories || []).length),
              borderWidth: 2,
              borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 10, usePointStyle: true, color: legendColor, padding: 12, font: { size: 12 } },
              },
            },
          },
        });
      }

      // Pie: Status Usaha
      if (statusRef.current && statusDistribution.length > 0) {
        const statusColors: Record<string, string> = {
          'Pemula': '#ef4444',
          'Berkembang': '#f59e0b',
          'Naik Kelas': '#10b981',
          'Siap Pameran': '#4f46e5',
          'Go Modern': '#ec4899',
          'Go Digital': '#06b6d4',
          'Go Global': '#0ea5e9',
        };
        statusChart = new Chart(statusRef.current, {
          type: 'pie',
          data: {
            labels: statusDistribution.map(s => s.status),
            datasets: [{
              data: statusDistribution.map(s => s.total),
              backgroundColor: statusDistribution.map((s, i) => statusColors[s.status] || chartColors[i % chartColors.length]),
              borderWidth: 2,
              borderColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 10, usePointStyle: true, color: legendColor, padding: 12, font: { size: 12 } },
              },
            },
          },
        });
      }

      // Bar: Tren Omzet Bulanan
      if (omzetTrendRef.current && omzetTrend.length > 0) {
        omzetChart = new Chart(omzetTrendRef.current, {
          type: 'bar',
          data: {
            labels: omzetTrend.map(t => t.bulan),
            datasets: [{
              label: 'Omzet',
              data: omzetTrend.map(t => t.omzet),
              backgroundColor: 'rgba(79, 70, 229, 0.8)',
              hoverBackgroundColor: 'rgba(79, 70, 229, 1)',
              borderRadius: 8,
              borderSkipped: false,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => 'Rp ' + Number(ctx.raw).toLocaleString('id-ID'),
                },
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: gridColor },
                border: { dash: [4, 4] },
                ticks: { callback: (v) => formatOmzet(Number(v)), color: tickColor, font: { size: 11 } },
              },
              x: {
                grid: { display: false },
                ticks: { color: tickColor, font: { size: 11 } },
              },
            },
          },
        });
      }

      // Horizontal Bar: Skor Top 10 UMKM
      if (skorRef.current && payload.rows.length > 0) {
        const top10 = payload.rows.slice(0, 10);
        skorChart = new Chart(skorRef.current, {
          type: 'bar',
          data: {
            labels: top10.map(r => String(r.nama_umkm)),
            datasets: [{
              label: 'Skor',
              data: top10.map(r => Number(r.skor_usaha || 0)),
              backgroundColor: top10.map((r) => {
                const skor = Number(r.skor_usaha || 0);
                if (skor >= 80) return 'rgba(16, 185, 129, 0.85)';
                if (skor >= 60) return 'rgba(245, 158, 11, 0.85)';
                return 'rgba(239, 68, 68, 0.85)';
              }),
              borderRadius: 6,
              borderSkipped: false,
              barPercentage: 0.7,
            }],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `Skor: ${ctx.raw}`,
                },
              },
            },
            scales: {
              x: {
                beginAtZero: true,
                max: 100,
                grid: { color: gridColor },
                border: { dash: [4, 4] },
                ticks: { color: tickColor, font: { size: 11 } },
              },
              y: {
                grid: { display: false },
                ticks: { color: tickColor, font: { size: 11 } },
              },
            },
          },
        });
      }
    };

    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    createCharts(initialTheme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme') {
          createCharts(document.documentElement.getAttribute('data-theme') || 'light');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      if (kategoriChart) kategoriChart.destroy();
      if (statusChart) statusChart.destroy();
      if (omzetChart) omzetChart.destroy();
      if (skorChart) skorChart.destroy();
      observer.disconnect();
    };
  }, [payload]);

  return (
    <div className="report-stat-grid">
      {/* Charts: Kategori Doughnut + Status Pie */}
      <div className="row g-3 mb-4">
        <div className="col-lg-6">
          <div className="panel report-panel h-100">
            <div className="panel-header border-bottom px-3 pt-3 pb-2"><h5 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}><i className="bi bi-pie-chart-fill text-success me-2" />Distribusi Kategori Produk</h5></div>
            <div className="panel-body p-3 p-md-4">
              <div style={{ height: '280px', position: 'relative' }}>
                {(payload.categories || []).length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted fs-sm">
                    <div className="text-center"><i className="bi bi-pie-chart d-block fs-2 mb-2 opacity-50" />Belum ada data kategori</div>
                  </div>
                ) : (
                  <canvas ref={kategoriRef}></canvas>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="panel report-panel h-100">
            <div className="panel-header border-bottom px-3 pt-3 pb-2"><h5 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}><i className="bi bi-diagram-3-fill text-primary me-2" />Distribusi Status Usaha</h5></div>
            <div className="panel-body p-3 p-md-4">
              <div style={{ height: '280px', position: 'relative' }}>
                {statusDistribution.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted fs-sm">
                    <div className="text-center"><i className="bi bi-diagram-3 d-block fs-2 mb-2 opacity-50" />Belum ada data status</div>
                  </div>
                ) : (
                  <canvas ref={statusRef}></canvas>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tren Omzet Bulanan */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="panel report-panel">
            <div className="panel-header border-bottom px-3 pt-3 pb-2"><h5 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}><i className="bi bi-graph-up text-warning me-2" />Tren Omzet Bulanan</h5></div>
            <div className="panel-body p-3 p-md-4">
              <div style={{ height: '300px', position: 'relative' }}>
                {omzetTrend.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted fs-sm">
                    <div className="text-center"><i className="bi bi-bar-chart d-block fs-2 mb-2 opacity-50" />Belum ada data monitoring</div>
                  </div>
                ) : (
                  <canvas ref={omzetTrendRef}></canvas>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Perbandingan Skor Top 10 */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="panel report-panel">
            <div className="panel-header border-bottom px-3 pt-3 pb-2"><h5 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}><i className="bi bi-trophy-fill text-warning me-2" />Perbandingan Skor 10 UMKM Terbaik</h5></div>
            <div className="panel-body p-3 p-md-4">
              <div style={{ height: Math.max(payload.rows.length * 44, 200) + 'px', position: 'relative' }}>
                {payload.rows.length === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted fs-sm">
                    <div className="text-center"><i className="bi bi-trophy d-block fs-2 mb-2 opacity-50" />Belum ada data UMKM</div>
                  </div>
                ) : (
                  <canvas ref={skorRef}></canvas>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table: Kategori + 10 UMKM Skor Tertinggi (print-friendly) */}
      <div className="row g-3 mb-4">
        <div className="col-lg-5">
          <div className="panel report-panel h-100">
            <div className="panel-header border-bottom px-3 pt-3 pb-2"><h5 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}><i className="bi bi-tags-fill text-info me-2" />Kategori Produk</h5></div>
            <div className="panel-body p-0">
              <table className="table-custom report-table">
                <thead><tr><th>Jenis Kategori</th><th className="text-end">Jumlah</th></tr></thead>
                <tbody>{(payload.categories || []).length ? payload.categories?.map((item) => (
                  <tr key={text(item.kategori_produk)}><td>{text(item.kategori_produk)}</td><td className="text-end fw-bold">{number(item.total)}</td></tr>
                )) : <EmptyRow colSpan={2} />}</tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-7">
          <div className="panel report-panel h-100">
            <div className="panel-header border-bottom px-3 pt-3 pb-2"><h5 className="fw-bold mb-0" style={{ fontSize: '0.95rem' }}><i className="bi bi-trophy me-2" />10 UMKM Skor Tertinggi</h5></div>
            <div className="panel-body p-0">
              <ReportTable rows={payload.rows} printLimit={10} columns={[
                { label: "No", className: "text-center report-col-no", render: (_row, index) => index + 1 },
                { label: "Nama UMKM", render: (row) => <strong>{text(row.nama_umkm)}</strong> },
                { label: "Status", render: (row) => <Badge tone={statusTone(row.status_usaha)}>{text(row.status_usaha)}</Badge> },
                { label: "Skor", className: "text-end", render: (row) => <strong>{number(row.skor_usaha)}</strong> },
              ]} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportClient({ type, payload, generatedAt, errorMessage }: {
  type: ReportType;
  payload: ReportPayload;
  generatedAt: string;
  errorMessage: string;
}) {
  const [limit, setLimit] = useState("all");
  const firstTrainingId = payload.pelatihan?.[0]?.id == null ? null : Number(payload.pelatihan[0].id);
  const [selectedTrainingId, setSelectedTrainingId] = useState<number | null>(firstTrainingId);
  const printLimit = limit === "all" ? Number.POSITIVE_INFINITY : Number(limit);
  const meta = REPORT_META[type];

  return (
    <section className={`report-page report-page-${type}`}>
      <div className="no-print d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4 report-toolbar">
        <div>
          <h4 className="fw-bold mb-1 text-dark"><i className="bi bi-file-earmark-bar-graph-fill text-primary me-2" />{meta.title}</h4>
          <p className="text-muted mb-0 fs-sm">{meta.description}</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {type !== "statistik" && (
            <select aria-label="Jumlah data yang dicetak" className="form-control-custom report-limit" value={limit} onChange={(event) => setLimit(event.target.value)}>
              <option value="10">10 Data</option>
              <option value="50">50 Data</option>
              <option value="100">100 Data</option>
              <option value="1000">1000 Data</option>
              <option value="all">Semua Data</option>
            </select>
          )}
          <button type="button" className="btn-outline-custom text-nowrap" onClick={() => window.print()} disabled={type === "pelatihan" && !selectedTrainingId}>
            <i className="bi bi-printer me-2" />Cetak / Simpan PDF
          </button>
        </div>
      </div>

      <header className="report-header-view">
        <div className="report-letterhead">
          <div className="report-heading">
            <div className="report-logo">
              <Image src="/rumah-bumn.png" alt="Logo Rumah BUMN" width={400} height={400} priority />
            </div>
            <h3>{meta.title}</h3>
          </div>
          <p className="report-generated-at">Rumah BUMN · Dicetak pada {generatedAt}</p>
        </div>
      </header>

      {errorMessage && (
        <div className="alert alert-danger no-print" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />Gagal memuat data: {errorMessage}
        </div>
      )}

      {type === "pelatihan" ? (
        <TrainingReport payload={payload} printLimit={printLimit} selectedId={selectedTrainingId} onSelect={setSelectedTrainingId} />
      ) : type === "kehadiran" ? (
        <AttendanceSummary payload={payload} printLimit={printLimit} />
      ) : type === "statistik" ? (
        <StatisticsReport payload={payload} />
      ) : (
        <ReportTable rows={payload.rows} columns={standardColumns(type)} printLimit={printLimit} />
      )}

      <div className="report-print-footer">
        <span>UMKM Monitor - Rumah BUMN</span>
      </div>
    </section>
  );
}
