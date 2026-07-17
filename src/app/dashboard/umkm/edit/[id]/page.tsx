import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import UMKMProfileClient from "../../UMKMProfileClient";
import { fetchScoringRules } from "@/lib/scoring";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function EditDataUMKMPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    user = payload;
  } catch (err) {
    redirect("/");
  }

  // Normalize role
  let normalizedRole = user.role;
  if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
    normalizedRole = 'Admin';
  } else if (normalizedRole === 'fasilitator') {
    normalizedRole = 'Staff';
  } else if (normalizedRole === 'umkm') {
    normalizedRole = 'Mitra';
  }
  
  if (normalizedRole === 'Mitra') {
      redirect("/dashboard/umkm"); // Mitra should not access this route
  }

  const { id: umkmIdStr } = await params;
  const id = parseInt(umkmIdStr);

  const [umkmRes, prodRes, monRes, pelatihanRes, kehadiranRes] = await Promise.all([
    supabaseAdmin.from('umkm').select('*').eq('id', id).single(),
    supabaseAdmin.from('produk').select('*', { count: 'exact', head: true }).eq('umkm_id', id),
    supabaseAdmin.from('monitoring').select('*').eq('umkm_id', id).order('tahun', { ascending: false }).order('bulan', { ascending: false }).limit(1),
    supabaseAdmin.from('pelatihan').select('*').order('tanggal', { ascending: true }),
    supabaseAdmin.from('kehadiran_pelatihan').select('*').eq('umkm_id', id)
  ]);

  const umkm = umkmRes.data;
  const produkCount = prodRes.count || 0;
  const latestMonitoring = monRes.data && monRes.data.length > 0 ? monRes.data[0] : null;

  if (!umkm) {
    return (
      <div className="alert alert-danger">Data UMKM tidak ditemukan di database.</div>
    );
  }

  // Fetch Scoring Rules to compute breakdown accurately
  const rules = await fetchScoringRules();
  function getRuleInfo(value: number, catRules: any[] | undefined) {
    if (!catRules) return { score: 0, desc: "Belum ada aturan", max: 0 };
    let score = 0;
    let desc = "Belum memenuhi kriteria";
    let max = catRules[0]?.max_poin || 100;
    const sortedRules = [...catRules].sort((a, b) => Number(b.kondisi_min) - Number(a.kondisi_min));
    const highestRule = sortedRules[0];
    if (highestRule && highestRule.kondisi_max === null && value > Number(highestRule.kondisi_min) && Number(highestRule.kondisi_min) > 0) {
      const scale = value / Number(highestRule.kondisi_min);
      score = Math.floor(scale * Number(highestRule.poin));
      desc = highestRule.label + " (Proporsional)";
      return { score, desc, max };
    }
    for (const rule of catRules) {
      const min = Number(rule.kondisi_min) || 0;
      const rMax = rule.kondisi_max != null ? Number(rule.kondisi_max) : null;
      if (value >= min && (rMax === null || value < rMax)) {
        score = Number(rule.poin) || 0;
        desc = rule.label;
        break;
      }
    }
    return { score, desc, max };
  }

  const currentDate = new Date();
  const indonesianMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const currentMonthName = indonesianMonths[currentDate.getMonth()];
  const isCurrentMonth = latestMonitoring && latestMonitoring.bulan === currentMonthName && latestMonitoring.tahun === currentDate.getFullYear();
  const omzetValue = isCurrentMonth ? (latestMonitoring?.omzet || 0) : 0;
  const omzetInfo = getRuleInfo(omzetValue, rules.omzet);
  
  const dynamicBreakdown = {
    omzet: { score: omzetInfo.score, max: omzetInfo.max, value: omzetValue, desc: omzetInfo.desc }
  };

  return (
    <>
      <div className="mb-3">
         <Link href="/dashboard/umkm" className="btn btn-outline-secondary btn-sm rounded-pill shadow-sm">
             <i className="bi bi-arrow-left me-1"></i> Kembali ke Daftar UMKM
         </Link>
      </div>
      <UMKMProfileClient 
        umkm={umkm} 
        produkCount={produkCount} 
        latestMonitoring={latestMonitoring}
        pelatihanList={pelatihanRes.data || []}
        kehadiranList={kehadiranRes.data || []}
        dynamicBreakdown={dynamicBreakdown}
        isAdmin={true} 
        initialTab="edit"
      />
    </>
  );
}
