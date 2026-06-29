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
  return payload as any;
}

export async function createPenjualanAction(formData: FormData) {
  try {
    const user = await checkAuth();

    const tanggal = formData.get("tanggal") as string;
    const rawUmkmId = formData.get("umkm_id");
    const umkmId = user.role === "umkm" ? (user.umkm_id || user.id) : parseInt(rawUmkmId as string);
    const produkId = parseInt(formData.get("produk_id") as string);
    const jumlah = parseInt(formData.get("jumlah") as string);
    const jumlahPelanggan = parseInt(formData.get("jumlah_pelanggan") as string) || 1;
    const jumlahTenagaKerja = parseInt(formData.get("jumlah_tenaga_kerja") as string) || 0;
    const catatan = formData.get("catatan") as string;

    if (!umkmId || !produkId || !tanggal || isNaN(jumlah)) {
      return { success: false, message: "Field wajib diisi dengan benar" };
    }

    // Fetch product details for price
    const { data: produk, error: prodErr } = await supabaseAdmin
      .from("produk")
      .select("harga_produk")
      .eq("id", produkId)
      .single();

    if (prodErr || !produk) {
      return { success: false, message: "Produk tidak ditemukan" };
    }

    const price = Number(produk.harga_produk || 0);
    const totalHarga = price * jumlah;

    // Insert sale
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("penjualan")
      .insert({
        umkm_id: umkmId,
        produk_id: produkId,
        tanggal,
        jumlah,
        jumlah_pelanggan: jumlahPelanggan,
        jumlah_tenaga_kerja: jumlahTenagaKerja,
        total_harga: totalHarga,
        catatan,
      })
      .select()
      .single();

    if (insertErr) {
      return { success: false, message: insertErr.message };
    }

    // Sync monitoring
    await syncMonitoring(umkmId, tanggal);

    revalidatePath("/dashboard/penjualan");
    revalidatePath("/dashboard/monitoring");
    revalidatePath("/dashboard/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deletePenjualanAction(id: number) {
  try {
    await checkAuth();

    // Fetch sale detail first
    const { data: sale, error: getErr } = await supabaseAdmin
      .from("penjualan")
      .select("*")
      .eq("id", id)
      .single();

    if (getErr || !sale) {
      return { success: false, message: "Data penjualan tidak ditemukan" };
    }

    const { error: deleteErr } = await supabaseAdmin
      .from("penjualan")
      .delete()
      .eq("id", id);

    if (deleteErr) {
      return { success: false, message: deleteErr.message };
    }

    // Sync monitoring
    await syncMonitoring(sale.umkm_id, sale.tanggal);

    revalidatePath("/dashboard/penjualan");
    revalidatePath("/dashboard/monitoring");
    revalidatePath("/dashboard/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

async function syncMonitoring(umkmId: number, tanggalStr: string) {
  const date = new Date(tanggalStr);
  const monthNum = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  const indonesianMonths = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const bulanName = indonesianMonths[monthNum - 1];

  // Start & end dates
  const startOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-01`;
  const lastDay = new Date(year, monthNum, 0).getDate();
  const endOfMonth = `${year}-${String(monthNum).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

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

  // Check existing monitoring record
  const { data: existingMonitoring } = await supabaseAdmin
    .from("monitoring")
    .select("id")
    .eq("umkm_id", umkmId)
    .eq("bulan", bulanName)
    .eq("tahun", year)
    .maybeSingle();

  if (existingMonitoring) {
    await supabaseAdmin
      .from("monitoring")
      .update({
        omzet: totalOmzet,
        jumlah_produk: produkCount || 0,
        jumlah_pelanggan: totalPelanggan,
        jumlah_tenaga_kerja: maxTenagaKerja,
      })
      .eq("id", existingMonitoring.id);
  } else {
    await supabaseAdmin.from("monitoring").insert({
      umkm_id: umkmId,
      bulan: bulanName,
      tahun: year,
      omzet: totalOmzet,
      jumlah_produk: produkCount || 0,
      jumlah_pelanggan: totalPelanggan,
      jumlah_tenaga_kerja: maxTenagaKerja,
    });
  }

  // Re-calculate business score
  await calculateScore(umkmId);
}
