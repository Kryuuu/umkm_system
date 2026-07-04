import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";
import ReportClient, { type ReportPayload, type ReportType } from "./ReportClient";

const REPORT_TYPES: ReportType[] = [
  "fasilitator",
  "umkm",
  "produk",
  "perkembangan",
  "pelatihan",
  "pendampingan",
  "kehadiran",
  "penjualan",
  "statistik",
  "evaluasi",
];

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345",
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Row = Record<string, unknown>;

function relatedName(value: unknown, field: string, fallback = "-") {
  const relation = Array.isArray(value) ? value[0] : value;
  if (relation && typeof relation === "object" && field in relation) {
    return String((relation as Row)[field] || fallback);
  }
  return fallback;
}

function buildLeaderboard(umkm: Row[], monitoring: Row[], produk: Row[]) {
  const omzet = new Map<number, number>();
  const produkCount = new Map<number, number>();

  monitoring.forEach((row) => {
    const umkmId = Number(row.umkm_id);
    omzet.set(umkmId, (omzet.get(umkmId) || 0) + Number(row.omzet || 0));
  });
  produk.forEach((row) => {
    const umkmId = Number(row.umkm_id);
    produkCount.set(umkmId, (produkCount.get(umkmId) || 0) + 1);
  });

  return umkm
    .map((row): Row => ({
      ...row,
      total_omzet: omzet.get(Number(row.id)) || 0,
      total_produk: produkCount.get(Number(row.id)) || 0,
    }))
    .sort((a, b) => Number(b.skor_usaha || 0) - Number(a.skor_usaha || 0));
}

async function getReportData(type: ReportType): Promise<ReportPayload> {
  if (type === "fasilitator") {
    const [fasilitatorResult, umkmResult] = await Promise.all([
      supabaseAdmin
        .from("fasilitator")
        .select("id, nickname, domisili, role")
        .order("nickname"),
      supabaseAdmin.from("umkm").select("id, fasilitator_id, skor_usaha"),
    ]);
    if (fasilitatorResult.error) throw fasilitatorResult.error;
    if (umkmResult.error) throw umkmResult.error;

    const umkm = umkmResult.data || [];
    const rows = (fasilitatorResult.data || []).map((staff) => {
      const binaan = umkm.filter((item) => item.fasilitator_id === staff.id);
      const totalSkor = binaan.reduce((sum, item) => sum + Number(item.skor_usaha || 0), 0);
      return {
        ...staff,
        total_umkm: binaan.length,
        avg_skor: binaan.length ? totalSkor / binaan.length : 0,
      };
    }).sort((a, b) => b.total_umkm - a.total_umkm);
    return { rows };
  }

  if (type === "umkm") {
    const { data, error } = await supabaseAdmin
      .from("umkm")
      .select("id, nama_umkm, nama_pemilik, no_telpon, email, nik, nib, status_usaha, skor_usaha, fasilitator:fasilitator_id(nickname)")
      .order("nama_umkm");
    if (error) throw error;
    return {
      rows: (data || []).map((row) => ({
        ...row,
        fasilitator_nama: relatedName(row.fasilitator, "nickname"),
      })),
    };
  }

  if (type === "produk") {
    const { data, error } = await supabaseAdmin
      .from("produk")
      .select("id, umkm_id, nama_produk, kategori_produk, harga_produk, deskripsi_produk, umkm:umkm_id(nama_umkm)")
      .order("id", { ascending: false });
    if (error) throw error;
    return { rows: (data || []).map((row) => ({ ...row, nama_umkm: relatedName(row.umkm, "nama_umkm") })) };
  }

  if (type === "perkembangan") {
    const { data, error } = await supabaseAdmin
      .from("monitoring")
      .select("id, umkm_id, bulan, tahun, omzet, jumlah_produk, jumlah_tenaga_kerja, jumlah_pelanggan, media_pemasaran, umkm:umkm_id(nama_umkm)")
      .order("tahun", { ascending: false });
    if (error) throw error;
    return { rows: (data || []).map((row) => ({ ...row, nama_umkm: relatedName(row.umkm, "nama_umkm") })) };
  }

  if (type === "pendampingan") {
    const { data, error } = await supabaseAdmin
      .from("pendampingan")
      .select("id, umkm_id, tanggal, jenis_pendampingan, hasil, catatan, umkm:umkm_id(nama_umkm)")
      .order("tanggal", { ascending: false });
    if (error) throw error;
    return { rows: (data || []).map((row) => ({ ...row, nama_umkm: relatedName(row.umkm, "nama_umkm") })) };
  }

  if (type === "pelatihan" || type === "kehadiran") {
    const [pelatihanResult, umkmResult, kehadiranResult] = await Promise.all([
      supabaseAdmin.from("pelatihan").select("id, nama_pelatihan, tanggal, pemateri, lokasi").order("tanggal", { ascending: false }),
      supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik").order("nama_umkm"),
      supabaseAdmin.from("kehadiran_pelatihan").select("id, pelatihan_id, umkm_id, status_hadir, created_at"),
    ]);
    if (pelatihanResult.error) throw pelatihanResult.error;
    if (umkmResult.error) throw umkmResult.error;
    if (kehadiranResult.error) throw kehadiranResult.error;
    return {
      rows: kehadiranResult.data || [],
      pelatihan: pelatihanResult.data || [],
      umkm: umkmResult.data || [],
    };
  }

  if (type === "penjualan") {
    const { data, error } = await supabaseAdmin
      .from("penjualan")
      .select("id, umkm_id, produk_id, jumlah, total_harga, tanggal, umkm:umkm_id(nama_umkm), produk:produk_id(nama_produk)")
      .order("tanggal", { ascending: false });
    if (error) throw error;
    return {
      rows: (data || []).map((row) => ({
        ...row,
        nama_umkm: relatedName(row.umkm, "nama_umkm"),
        nama_produk: relatedName(row.produk, "nama_produk"),
      })),
    };
  }

  const [umkmResult, produkResult, monitoringResult, pelatihanResult, pendampinganResult] = await Promise.all([
    supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik, skor_usaha, status_usaha, rekomendasi").order("skor_usaha", { ascending: false }),
    supabaseAdmin.from("produk").select("id, umkm_id, kategori_produk"),
    supabaseAdmin.from("monitoring").select("id, umkm_id, omzet, bulan, tahun, jumlah_tenaga_kerja, jumlah_pelanggan"),
    supabaseAdmin.from("pelatihan").select("id"),
    supabaseAdmin.from("pendampingan").select("id"),
  ]);
  const firstError = [umkmResult, produkResult, monitoringResult, pelatihanResult, pendampinganResult].find((result) => result.error)?.error;
  if (firstError) throw firstError;

  const umkm = umkmResult.data || [];
  const produk = produkResult.data || [];
  const monitoring = monitoringResult.data || [];
  const leaderboard = buildLeaderboard(umkm, monitoring, produk);

  if (type === "evaluasi") return { rows: leaderboard };

  const kategoriMap = new Map<string, number>();
  produk.forEach((row) => {
    const kategori = row.kategori_produk || "Lainnya";
    kategoriMap.set(kategori, (kategoriMap.get(kategori) || 0) + 1);
  });

  // Status distribution for pie chart
  const statusMap = new Map<string, number>();
  umkm.forEach((row) => {
    const status = String(row.status_usaha || "Belum Diketahui");
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });
  const statusDistribution = Array.from(statusMap, ([status, total]) => ({ status, total }))
    .sort((a, b) => b.total - a.total);

  // Monthly omzet trend for bar chart
  const monthToNum: Record<string, number> = {
    'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
    'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
  };
  const periodOmzetMap = new Map<string, { orderKey: number; omzet: number; tk: number; pelanggan: number }>();
  monitoring.forEach((row) => {
    const key = `${row.bulan} ${row.tahun}`;
    const mNum = monthToNum[(String(row.bulan) || '').toLowerCase()] || 0;
    const orderKey = (Number(row.tahun) * 12) + mNum;
    const existing = periodOmzetMap.get(key);
    if (!existing) {
      periodOmzetMap.set(key, { orderKey, omzet: Number(row.omzet || 0), tk: Number(row.jumlah_tenaga_kerja || 0), pelanggan: Number(row.jumlah_pelanggan || 0) });
    } else {
      existing.omzet += Number(row.omzet || 0);
      existing.tk += Number(row.jumlah_tenaga_kerja || 0);
      existing.pelanggan += Number(row.jumlah_pelanggan || 0);
    }
  });
  const omzetTrend = Array.from(periodOmzetMap, ([bulan, data]) => ({
    bulan, orderKey: data.orderKey, omzet: data.omzet, tk: data.tk, pelanggan: data.pelanggan,
  })).sort((a, b) => a.orderKey - b.orderKey);

  return {
    rows: leaderboard.slice(0, 10),
    categories: Array.from(kategoriMap, ([kategori_produk, total]) => ({ kategori_produk, total }))
      .sort((a, b) => b.total - a.total),
    summary: {
      totalUmkm: umkm.length,
      totalProduk: produk.length,
      totalPelatihan: (pelatihanResult.data || []).length,
      totalPendampingan: (pendampinganResult.data || []).length,
      totalOmzet: monitoring.reduce((sum, row) => sum + Number(row.omzet || 0), 0),
      statusDistribution,
      omzetTrend,
    },
  };
}

export default async function ReportPage({ params }: PageProps<"/dashboard/laporan/[type]">) {
  const { type: rawType } = await params;
  if (!REPORT_TYPES.includes(rawType as ReportType)) redirect("/dashboard/laporan/fasilitator");

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");

  let role: unknown;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    role = payload.role === "admin" || payload.role === "Admin Staff" ? "Admin" : payload.role;
  } catch {
    redirect("/");
  }
  if (role !== "Admin") redirect("/dashboard");

  const type = rawType as ReportType;
  let payload: ReportPayload;
  let errorMessage = "";
  try {
    payload = await getReportData(type);
  } catch (error) {
    console.error(`Gagal memuat laporan ${type}:`, error);
    payload = { rows: [] };
    errorMessage = error instanceof Error ? error.message : "Data laporan gagal dimuat.";
  }

  const generatedAt = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Makassar",
  }).format(new Date());

  return <ReportClient type={type} payload={payload} generatedAt={generatedAt} errorMessage={errorMessage} />;
}
