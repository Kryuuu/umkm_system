import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function calculateScore(umkmId: number) {
  try {
    // 1. Fetch UMKM info
    const { data: umkm, error: umkmErr } = await supabaseAdmin
      .from("umkm")
      .select("*")
      .eq("id", umkmId)
      .single();

    if (umkmErr || !umkm) return { success: false, message: "UMKM tidak ditemukan" };

    // 2. Fetch products
    const { data: produk } = await supabaseAdmin
      .from("produk")
      .select("id")
      .eq("umkm_id", umkmId);

    const produkCount = produk?.length || 0;

    // 3. Fetch latest monitoring
    const { data: monitoring } = await supabaseAdmin
      .from("monitoring")
      .select("*")
      .eq("umkm_id", umkmId)
      .order("tahun", { ascending: false })
      .order("bulan", { ascending: false }) // Wait, in PG order by month name is alphabetic, but let's assume this gets the latest.
      .limit(1);

    const latestMonitoring = monitoring && monitoring.length > 0 ? monitoring[0] : null;

    let score = 0;

    // 1. Omzet score (max 30)
    if (latestMonitoring) {
      const omzet = latestMonitoring.omzet || 0;
      if (omzet >= 25000000) score += 30;
      else if (omzet >= 15000000) score += 25;
      else if (omzet >= 10000000) score += 20;
      else if (omzet >= 5000000) score += 15;
      else if (omzet >= 2000000) score += 10;
      else score += 5;
    }

    // 2. Product count score (max 20)
    if (produkCount >= 5) score += 20;
    else if (produkCount >= 3) score += 15;
    else if (produkCount >= 2) score += 10;
    else if (produkCount >= 1) score += 5;

    // 3. Employment score (max 15)
    if (latestMonitoring) {
      const tenagaKerja = latestMonitoring.jumlah_tenaga_kerja || 0;
      if (tenagaKerja >= 8) score += 15;
      else if (tenagaKerja >= 5) score += 12;
      else if (tenagaKerja >= 3) score += 8;
      else if (tenagaKerja >= 1) score += 5;
    }

    // 4. Customer base score (max 15)
    if (latestMonitoring) {
      const pelanggan = latestMonitoring.jumlah_pelanggan || 0;
      if (pelanggan >= 200) score += 15;
      else if (pelanggan >= 100) score += 12;
      else if (pelanggan >= 50) score += 8;
      else if (pelanggan >= 20) score += 5;
    }

    // 5. Legality score (max 20)
    if (umkm.nib) score += 7;
    if (umkm.sertifikat_halal) score += 7;
    if (umkm.sertifikat_pirt) score += 6;

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
        pesan: `UMKM "${umkm.nama_umkm}" telah naik dari level ${oldStatus} ke ${status}! Skor usaha: ${score}/100.`
      });

      // Notify Fasilitator
      if (umkm.fasilitator_id) {
        await supabaseAdmin.from("notifikasi").insert({
          target_role: "Staff",
          target_id: umkm.fasilitator_id,
          tipe: "naik_kelas",
          judul: "UMKM Binaan Naik Kelas 🎉",
          pesan: `UMKM "${umkm.nama_umkm}" telah naik dari level ${oldStatus} to ${status}! Skor usaha: ${score}/100.`
        });
      }
    }

    // Generate Gemini AI recommendation
    let rekomendasi = defaultRekomendasi;
    const apiKey = process.env.AI_API_KEY;

    if (apiKey) {
      try {
        const prompt = `Berikan 1 paragraf rekomendasi singkat (maks 30 kata) untuk UMKM '${umkm.nama_umkm}' yang memiliki skor usaha ${score} dari 100. Deskripsi usaha: ${umkm.deskripsi || "Perdagangan"}. Status: ${status}. Omzet bulanan: Rp ${latestMonitoring?.omzet ? Number(latestMonitoring.omzet).toLocaleString("id-ID") : "0"}. Fokus pada langkah konkret berikutnya.`;
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
