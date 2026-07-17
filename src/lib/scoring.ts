import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FALLBACK_RULES = {
  omzet: [
    { kondisi_min: 25000000, kondisi_max: null, poin: 100, label: 'Omzet >= Rp 25.000.000', max_poin: 100, is_active: true },
    { kondisi_min: 15000000, kondisi_max: 25000000, poin: 85, label: 'Omzet >= Rp 15.000.000', max_poin: 100, is_active: true },
    { kondisi_min: 10000000, kondisi_max: 15000000, poin: 70, label: 'Omzet >= Rp 10.000.000', max_poin: 100, is_active: true },
    { kondisi_min: 5000000, kondisi_max: 10000000, poin: 50, label: 'Omzet >= Rp 5.000.000', max_poin: 100, is_active: true },
    { kondisi_min: 2000000, kondisi_max: 5000000, poin: 30, label: 'Omzet >= Rp 2.000.000', max_poin: 100, is_active: true },
    { kondisi_min: 0, kondisi_max: 2000000, poin: 15, label: 'Omzet < Rp 2.000.000', max_poin: 100, is_active: true },
  ],
};

type RuleRow = {
  kategori: string;
  kondisi_min: number;
  kondisi_max: number | null;
  poin: number;
  label: string;
  max_poin: number | null;
  is_active: boolean;
};

export async function fetchScoringRules(): Promise<Record<string, RuleRow[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("scoring_rules")
      .select("kategori, kondisi_min, kondisi_max, poin, label, max_poin, is_active")
      .eq("is_active", true)
      .order("kategori")
      .order("urutan");

    if (error || !data || data.length === 0) {
      // Table doesn't exist or no data → use fallback
      return FALLBACK_RULES as any;
    }

    // Group by kategori
    const grouped: Record<string, RuleRow[]> = {};
    for (const rule of data) {
      if (!grouped[rule.kategori]) grouped[rule.kategori] = [];
      grouped[rule.kategori].push(rule);
    }
    return grouped;
  } catch {
    return FALLBACK_RULES as any;
  }
}

export function matchRule(value: number, rules: RuleRow[]): number {
  if (!rules || rules.length === 0) return 0;

  // Temukan rule tertinggi berdasarkan kondisi_min
  const sortedRules = [...rules].sort((a, b) => Number(b.kondisi_min) - Number(a.kondisi_min));
  const highestRule = sortedRules[0];

  // Jika nilai melebihi rule tertinggi yang tidak memiliki batas atas, kalikan poinnya secara proporsional
  if (highestRule && highestRule.kondisi_max === null && value > Number(highestRule.kondisi_min) && Number(highestRule.kondisi_min) > 0) {
    const scale = value / Number(highestRule.kondisi_min);
    return Math.floor(scale * Number(highestRule.poin));
  }

  // Pencarian rule normal
  for (const rule of rules) {
    const min = Number(rule.kondisi_min) || 0;
    const max = rule.kondisi_max != null ? Number(rule.kondisi_max) : null;
    if (value >= min && (max === null || value < max)) {
      return Number(rule.poin) || 0;
    }
  }
  return 0;
}

export async function calculateScore(umkmId: number) {
  try {
    // 1. Fetch UMKM info
    const { data: umkm, error: umkmErr } = await supabaseAdmin
      .from("umkm")
      .select("*")
      .eq("id", umkmId)
      .single();

    if (umkmErr || !umkm) return { success: false, message: "UMKM tidak ditemukan" };

    // 2. Fetch monitoring for the current month/year
    const currentDate = new Date();
    const indonesianMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonthName = indonesianMonths[currentDate.getMonth()];
    const currentYear = currentDate.getFullYear();

    const { data: monitoring } = await supabaseAdmin
      .from("monitoring")
      .select("*")
      .eq("umkm_id", umkmId)
      .eq("bulan", currentMonthName)
      .eq("tahun", currentYear)
      .limit(1);

    const currentMonitoring = monitoring && monitoring.length > 0 ? monitoring[0] : null;

    // 3. Fetch dynamic scoring rules from DB
    const rules = await fetchScoringRules();

    let score = 0;

    // Calculate Score dynamically based on rules (Only Omzet as requested)
    if (rules.omzet) {
      const omzetValue = currentMonitoring ? (currentMonitoring.omzet || 0) : 0;
      score += matchRule(omzetValue, rules.omzet);
    }

    // Determine status (Go Modern → Go Digital → Go Online → Go Global)
    const oldStatus = umkm.status_usaha || "";
    let status = "Go Modern";
    let defaultRekomendasi = "Perlu modernisasi usaha. Perbaiki manajemen, pencatatan keuangan, dan standarisasi produk.";

    if (score >= 85) {
      status = "Go Global";
      defaultRekomendasi = "Siap ekspansi pasar internasional. Pertahankan kualitas, perkuat branding global, dan perluas jaringan ekspor.";
    } else if (score >= 70) {
      status = "Go Online";
      defaultRekomendasi = "Siap berjualan di marketplace nasional. Tingkatkan digital presence, optimasi SEO dan iklan online.";
    } else if (score >= 50) {
      status = "Go Digital";
      defaultRekomendasi = "Mulai digitalisasi usaha. Buat media sosial bisnis, pelajari pemasaran digital, dan perbaiki branding produk.";
    }

    // Check level up
    const levelOrder: Record<string, number> = { "Go Modern": 1, "Go Digital": 2, "Go Online": 3, "Go Global": 4 };
    const oldLevel = levelOrder[oldStatus] || 0;
    const newLevel = levelOrder[status] || 0;

    if (newLevel > oldLevel && oldLevel > 0) {
      // Notify UMKM
      await supabaseAdmin.from("notifikasi").insert({
        target_role: "Mitra",
        target_id: umkmId,
        tipe: "naik_kelas",
        judul: "Selamat! UMKM Anda Naik Kelas 🎉",
        pesan: `UMKM "${umkm.nama_umkm}" telah naik dari level ${oldStatus} ke ${status}! Skor usaha saat ini: ${score}.`
      });

      // Notify Fasilitator
      if (umkm.fasilitator_id) {
        await supabaseAdmin.from("notifikasi").insert({
          target_role: "Staff",
          target_id: umkm.fasilitator_id,
          tipe: "naik_kelas",
          judul: "UMKM Binaan Naik Kelas 🎉",
          pesan: `UMKM "${umkm.nama_umkm}" telah naik dari level ${oldStatus} to ${status}! Skor usaha saat ini: ${score}.`
        });
      }
    }

    // Generate Gemini AI recommendation
    let rekomendasi = defaultRekomendasi;
    const apiKey = process.env.AI_API_KEY;

    if (apiKey) {
      try {
        const omzetStr = currentMonitoring?.omzet ? Number(currentMonitoring.omzet).toLocaleString("id-ID") : "0";
        const prompt = `Berikan 1 paragraf rekomendasi singkat (maks 30 kata) untuk UMKM '${umkm.nama_umkm}' yang memiliki skor usaha ${score}. Deskripsi usaha: ${umkm.deskripsi || "Perdagangan"}. Status: ${status}. Omzet bulanan tercatat: Rp ${omzetStr}. Fokus pada langkah konkret berikutnya.`;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );
        const resData = await response.json();
        if (resData.candidates?.[0]?.content?.parts?.[0]?.text) {
          rekomendasi = resData.candidates[0].content.parts[0].text.trim();
        }
      } catch (e) {
        console.error("AI recommendation error:", e);
      }
    }

    // Update UMKM with new score and status
    const { error: updateErr } = await supabaseAdmin
      .from("umkm")
      .update({
        skor_usaha: score,
        status_usaha: status,
        rekomendasi: rekomendasi
      })
      .eq("id", umkmId);

    if (updateErr) return { success: false, message: updateErr.message };

    return { success: true, score, status, rekomendasi };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
