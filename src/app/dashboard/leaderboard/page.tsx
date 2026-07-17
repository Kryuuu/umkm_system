import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import LeaderboardClient from "./LeaderboardClient";
import { fetchScoringRules, matchRule } from "@/lib/scoring";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function LeaderboardPage({ searchParams }: { searchParams: any }) {
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

  // Determine selected month and year
  const currentDate = new Date();
  const indonesianMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  // Next 15 requires awaiting searchParams, earlier versions it's sync. Safe pattern:
  const params = await searchParams;
  const isAllTime = params?.bulan === "Semua";
  const selectedBulan = params?.bulan || indonesianMonths[currentDate.getMonth()];
  const selectedTahun = isAllTime ? 0 : parseInt(params?.tahun || String(currentDate.getFullYear()));

  // Fetch all UMKMs
  const { data: umkmList } = await supabaseAdmin
      .from('umkm')
      .select('*');

  // Fetch all monitoring data (used for both period list and omzet calculation)
  const { data: allMonitoring } = await supabaseAdmin
      .from('monitoring')
      .select('*');

  const availablePeriods = new Set<string>();
  if (allMonitoring) {
      allMonitoring.forEach(m => {
          availablePeriods.add(`${m.bulan} ${m.tahun}`);
      });
  }
  // Add current month if not exists
  availablePeriods.add(`${indonesianMonths[currentDate.getMonth()]} ${currentDate.getFullYear()}`);
  
  // Sort periods
  const periodList = Array.from(availablePeriods).map(p => {
      const [b, t] = p.split(' ');
      return { bulan: b, tahun: parseInt(t), label: p, val: p };
  }).sort((a, b) => {
      if (a.tahun !== b.tahun) return b.tahun - a.tahun;
      return indonesianMonths.indexOf(b.bulan) - indonesianMonths.indexOf(a.bulan);
  });
  
  // Prepend "Keseluruhan" option
  periodList.unshift({ bulan: "Semua", tahun: 0, label: "Keseluruhan (All Time)", val: "Semua 0" });

  // Calculate Omzet Map based on selected filter
  const omzetMap: Record<number, number> = {};
  if (allMonitoring) {
      for (const m of allMonitoring) {
          if (isAllTime || (m.bulan === selectedBulan && m.tahun === selectedTahun)) {
              if (!omzetMap[m.umkm_id]) omzetMap[m.umkm_id] = 0;
              omzetMap[m.umkm_id] += Number(m.omzet || 0);
          }
      }
  }

  // Fetch produk data to get the total produk for each UMKM
  const { data: produkData } = await supabaseAdmin
      .from('produk')
      .select('umkm_id');

  const produkMap: Record<number, number> = {};
  if (produkData) {
      for (const p of produkData) {
          if (!produkMap[p.umkm_id]) produkMap[p.umkm_id] = 0;
          produkMap[p.umkm_id] += 1;
      }
  }

  // Fetch rules for on-the-fly calculation
  const rules = await fetchScoringRules();

  // Map and calculate scores
  const mappedLeaderboard = (umkmList || []).map(u => {
      const omzetValue = omzetMap[u.id] || 0;
      
      let dynamicScore = 0;
      if (rules.omzet) {
          dynamicScore = matchRule(omzetValue, rules.omzet);
      }

      let dynamicStatus = "Go Modern";
      if (dynamicScore >= 85) dynamicStatus = "Go Global";
      else if (dynamicScore >= 70) dynamicStatus = "Go Online";
      else if (dynamicScore >= 50) dynamicStatus = "Go Digital";

      return {
          ...u,
          skor_usaha: dynamicScore, // Override DB score with dynamic score for the selected month
          status_usaha: dynamicStatus, // Override status
          total_omzet: omzetValue,
          total_produk: produkMap[u.id] || 0
      };
  });

  // Sort by score descending, then omzet descending
  mappedLeaderboard.sort((a, b) => {
      if (b.skor_usaha !== a.skor_usaha) return b.skor_usaha - a.skor_usaha;
      return b.total_omzet - a.total_omzet;
  });

  return <LeaderboardClient 
            leaderboard={mappedLeaderboard} 
            user={user} 
            periods={periodList} 
            selectedPeriod={`${selectedBulan} ${selectedTahun}`} 
         />;
}
