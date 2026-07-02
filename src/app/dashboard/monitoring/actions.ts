"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { calculateScore } from "@/lib/scoring";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jwtVerify(token, secretKey);
  
  // Normalize role to prevent stale session cookies
  let normalizedRole = payload.role;
  if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
    normalizedRole = 'Admin';
  } else if (normalizedRole === 'fasilitator') {
    normalizedRole = 'Staff';
  } else if (normalizedRole === 'umkm') {
    normalizedRole = 'Mitra';
  }
  payload.role = normalizedRole;

  return payload as any;
}

export async function createMonitoringAction(formData: FormData) {
  try {
    const user = await checkAuth();

    const rawUmkmId = formData.get("umkm_id");
    const umkmId = user.role === "Mitra" ? (user.umkm_id || user.id) : parseInt(rawUmkmId as string);

    const periode = formData.get("periode") as string; // format: "m|YYYY", e.g. "5|2026"
    if (!periode) return { success: false, message: "Periode wajib diisi" };

    const [monthNumStr, yearStr] = periode.split("|");
    const monthNum = parseInt(monthNumStr);
    const year = parseInt(yearStr);

    const indonesianMonths = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const bulanName = indonesianMonths[monthNum - 1];

    const omzet = parseFloat(formData.get("omzet") as string) || 0;
    const jumlahProduk = parseInt(formData.get("jumlah_produk") as string) || 0;
    const jumlahTenagaKerja = parseInt(formData.get("jumlah_tenaga_kerja") as string) || 0;
    const jumlahPelanggan = parseInt(formData.get("jumlah_pelanggan") as string) || 0;
    const mediaPemasaran = formData.get("media_pemasaran") as string;
    const catatan = formData.get("catatan") as string;

    // Check if monitoring entry already exists for this UMKM and period
    const { data: existing } = await supabaseAdmin
      .from("monitoring")
      .select("id")
      .eq("umkm_id", umkmId)
      .eq("bulan", bulanName)
      .eq("tahun", year)
      .maybeSingle();

    if (existing) {
      return { success: false, message: `Data monitoring untuk ${bulanName} ${year} sudah ada.` };
    }

    const { error } = await supabaseAdmin.from("monitoring").insert({
      umkm_id: umkmId,
      bulan: bulanName,
      tahun: year,
      omzet,
      jumlah_produk: jumlahProduk,
      jumlah_tenaga_kerja: jumlahTenagaKerja,
      jumlah_pelanggan: jumlahPelanggan,
      media_pemasaran: mediaPemasaran,
      catatan,
    });

    if (error) return { success: false, message: error.message };

    // Re-calculate business score
    await calculateScore(umkmId);

    revalidatePath("/dashboard/monitoring");
    revalidatePath("/dashboard/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateMonitoringAction(formData: FormData) {
  try {
    await checkAuth();

    const id = parseInt(formData.get("id") as string);
    const omzet = parseFloat(formData.get("omzet") as string) || 0;
    const jumlahProduk = parseInt(formData.get("jumlah_produk") as string) || 0;
    const jumlahTenagaKerja = parseInt(formData.get("jumlah_tenaga_kerja") as string) || 0;
    const jumlahPelanggan = parseInt(formData.get("jumlah_pelanggan") as string) || 0;
    const mediaPemasaran = formData.get("media_pemasaran") as string;
    const catatan = formData.get("catatan") as string;

    // Get the monitoring record first to find the umkm_id
    const { data: monitoring, error: getErr } = await supabaseAdmin
      .from("monitoring")
      .select("umkm_id")
      .eq("id", id)
      .single();

    if (getErr || !monitoring) {
      return { success: false, message: "Data monitoring tidak ditemukan." };
    }

    const { error } = await supabaseAdmin
      .from("monitoring")
      .update({
        omzet,
        jumlah_produk: jumlahProduk,
        jumlah_tenaga_kerja: jumlahTenagaKerja,
        jumlah_pelanggan: jumlahPelanggan,
        media_pemasaran: mediaPemasaran,
        catatan,
      })
      .eq("id", id);

    if (error) return { success: false, message: error.message };

    // Re-calculate business score
    await calculateScore(monitoring.umkm_id);

    revalidatePath("/dashboard/monitoring");
    revalidatePath("/dashboard/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteMonitoringAction(id: number) {
  try {
    await checkAuth();

    const { data: monitoring, error: getErr } = await supabaseAdmin
      .from("monitoring")
      .select("umkm_id")
      .eq("id", id)
      .single();

    if (getErr || !monitoring) {
      return { success: false, message: "Data monitoring tidak ditemukan." };
    }

    const { error } = await supabaseAdmin
      .from("monitoring")
      .delete()
      .eq("id", id);

    if (error) return { success: false, message: error.message };

    // Re-calculate business score
    await calculateScore(monitoring.umkm_id);

    revalidatePath("/dashboard/monitoring");
    revalidatePath("/dashboard/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getAvailablePeriodsAction(umkmId: number) {
  try {
    await checkAuth();

    const { data: sales, error } = await supabaseAdmin
      .from("penjualan")
      .select("tanggal")
      .eq("umkm_id", umkmId);

    if (error || !sales) return { success: true, periods: [] };

    // Extract unique month/year from dates
    const uniquePeriods = new Map<string, { month: number; year: number }>();
    sales.forEach((s) => {
      if (!s.tanggal) return;
      const d = new Date(s.tanggal);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const key = `${m}|${y}`;
      uniquePeriods.set(key, { month: m, year: y });
    });

    const indonesianMonths = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    const periods = Array.from(uniquePeriods.values())
      .map((p) => ({
        val: `${p.month}|${p.year}`,
        label: `${indonesianMonths[p.month - 1]} ${p.year}`,
        month: p.month,
        year: p.year,
      }))
      .sort((a, b) => b.year - a.year || b.month - a.month);

    return { success: true, periods };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getAutoFillDataAction(umkmId: number, month: number, year: number) {
  try {
    await checkAuth();

    // Start & end dates for PostgreSQL query
    const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    // Fetch sales sum
    const { data: sales } = await supabaseAdmin
      .from("penjualan")
      .select("total_harga, jumlah_pelanggan, jumlah_tenaga_kerja")
      .eq("umkm_id", umkmId)
      .gte("tanggal", startOfMonth)
      .lte("tanggal", endOfMonth);

    let totalOmzet = 0;
    let totalPelanggan = 0;
    let maxTenagaKerja = 0;

    if (sales) {
      sales.forEach((s) => {
        totalOmzet += Number(s.total_harga || 0);
        totalPelanggan += Number(s.jumlah_pelanggan || 0);
        if (Number(s.jumlah_tenaga_kerja || 0) > maxTenagaKerja) {
          maxTenagaKerja = Number(s.jumlah_tenaga_kerja || 0);
        }
      });
    }

    // Fetch count of products
    const { count: produkCount } = await supabaseAdmin
      .from("produk")
      .select("id", { count: "exact", head: true })
      .eq("umkm_id", umkmId);

    return {
      success: true,
      data: {
        omzet: totalOmzet,
        jumlah_produk: produkCount || 0,
        jumlah_pelanggan: totalPelanggan,
        jumlah_tenaga_kerja: maxTenagaKerja,
      },
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
