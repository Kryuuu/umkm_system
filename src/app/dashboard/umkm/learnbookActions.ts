"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jwtVerify(token, secretKey);
  return payload as any;
}

export async function generateAiCurriculumAction(umkmId: number) {
  try {
    const user = await getUser();
    
    // Security check
    if (user.role === "umkm" && user.umkm_id !== umkmId && user.id !== umkmId) {
      return { success: false, message: "Unauthorized access to this UMKM" };
    }

    // Fetch UMKM
    const { data: umkm, error: umkmErr } = await supabaseAdmin.from("umkm").select("*").eq("id", umkmId).single();
    if (umkmErr || !umkm) return { success: false, message: "UMKM tidak ditemukan" };

    // Get max batch
    const { data: maxBatchData } = await supabaseAdmin
      .from("learnbook")
      .select("batch_id")
      .eq("umkm_id", umkmId)
      .order("batch_id", { ascending: false })
      .limit(1);

    const maxBatch = maxBatchData && maxBatchData.length > 0 ? maxBatchData[0].batch_id : 0;
    const newBatchId = maxBatch + 1;

    // AI Generation
    const apiKey = process.env.AI_API_KEY;
    let modulesList: any[] = [];
    let isFallback = false;

    if (apiKey) {
      const prompt = `Sebagai konsultan bisnis expert, buatkan kurikulum belajar 3 modul berurutan yang sangat praktis dan bisa langsung dipraktikkan untuk UMKM bernama '${umkm.nama_umkm}'. 
Fokus bisnis: ${umkm.deskripsi || 'Perdagangan Umum'}. 
Skor bisnis saat ini: ${umkm.skor_usaha || 0}/100. Status: ${umkm.status_usaha || 'Go Modern'}.
Fokuskan pada kelemahan mereka untuk mendongkrak skor. 
KEMBALIKAN HANYA DALAM BENTUK JSON murni (array of objects), tanpa markdown block, tanpa penjelasan apa pun.
Format persis seperti ini:
[
  {
    "judul": "Judul Modul Singkat",
    "deskripsi": "Deskripsi singkat modul 1 kalimat.",
    "konten_html": "<p>Halo pemilik bisnis...</p> <h5>Langkah 1: ...</h5> <p>Penjelasan langkah</p>",
    "tugas_judul": "Tugas Modul",
    "tugas_deskripsi": "Instruksi tugas..."
  }
]`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                response_mime_type: "application/json"
              }
            })
          }
        );

        const resData = await response.json();
        if (resData.candidates?.[0]?.content?.parts?.[0]?.text) {
          let jsonStr = resData.candidates[0].content.parts[0].text.trim();
          // Clean markdown
          jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            modulesList = parsed;
          }
        }
      } catch (err) {
        console.error("Gemini curriculum generation failed:", err);
      }
    }

    if (modulesList.length === 0) {
      isFallback = true;
      modulesList = [
        {
          judul: "Fundamental Digitalisasi",
          deskripsi: "Mengenal platform digital untuk bisnis.",
          konten_html: `<p>Halo <strong>${umkm.nama_pemilik || 'Pemilik Usaha'}</strong>! Memulai digitalisasi memang terlihat rumit, tapi sangat sederhana jika dilakukan selangkah demi selangkah.</p><h5 class="fw-bold mt-4 mb-3 text-dark">Langkah 1: Siapkan Profil Bisnis</h5><p>Pastikan tokomu muncul di Google Maps saat orang mencari produk terkait di sekitarmu.</p><ul><li>Gunakan foto yang jelas.</li><li>Tulis deskripsi dan jam buka.</li></ul><h5 class="fw-bold mt-4 mb-3 text-dark">Langkah 2: WhatsApp Business</h5><p>Jangan gabungkan nomor pribadi dan bisnis. WhatsApp Business memiliki fitur Katalog yang sangat membantumu.</p>`,
          tugas_judul: "Pembuatan Akun Bisnis",
          tugas_deskripsi: "Buat akun WhatsApp Business dan masukkan minimal 3 foto produkmu ke dalam katalog."
        },
        {
          judul: "Optimasi Media Sosial (Instagram/TikTok)",
          deskripsi: "Membuat konten yang menarik pembeli.",
          konten_html: `<p>Kunci dari media sosial bukanlah sekadar berjualan blak-blakan, tapi juga memberikan edukasi atau hiburan.</p><h5 class="fw-bold mt-4 mb-3 text-dark">Langkah 1: Rumus Konten 3 Detik</h5><p>Jika dalam 3 detik pertama videomu tidak menarik, audiens akan men-scroll (melewati) postinganmu.</p><ul><li>Gunakan teks/judul yang mengundang rasa penasaran.</li><li>Perlihatkan proses pembuatan produk.</li></ul>`,
          tugas_judul: "Upload Konten Pertama",
          tugas_deskripsi: "Buat 1 video pendek berdurasi maksimal 15 detik tentang produk unggulanmu, lalu upload ke Reels/TikTok."
        },
        {
          judul: "Manajemen Keuangan Basic",
          deskripsi: "Pencatatan omzet dan pengeluaran.",
          konten_html: `<p>Banyak bisnis UMKM gagal berkembang karena uang pribadi dan uang bisnis tercampur.</p><h5 class="fw-bold mt-4 mb-3 text-dark">Langkah 1: Pemisahan Rekening</h5><p>Langkah paling awal adalah membuat rekening bank terpisah khusus untuk keluar-masuk uang bisnis.</p>`,
          tugas_judul: "Pencatatan Pertama",
          tugas_deskripsi: "Catat seluruh pengeluaran dan pemasukan bisnismu selama 3 hari berturut-turut."
        }
      ];
    }

    // Insert modules
    for (let i = 0; i < modulesList.length; i++) {
      const m = modulesList[i];
      await supabaseAdmin.from("learnbook").insert({
        umkm_id: umkmId,
        batch_id: newBatchId,
        judul: m.judul || `Modul ${i + 1}`,
        deskripsi: m.deskripsi || "",
        konten_html: m.konten_html || "<p>Konten kosong.</p>",
        tugas_judul: m.tugas_judul || "Tugas",
        tugas_deskripsi: m.tugas_deskripsi || "",
        urutan: i + 1,
        status: i === 0 ? "active" : "locked"
      });
    }

    revalidatePath(`/dashboard/umkm/learnbook/${umkmId}`);
    return { success: true, isFallback };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function completeModuleAction(moduleId: number, umkmId: number) {
  try {
    const user = await getUser();

    // Fetch current module
    const { data: moduleData, error } = await supabaseAdmin
      .from("learnbook")
      .select("*")
      .eq("id", moduleId)
      .single();

    if (error || !moduleData) return { success: false, message: "Modul tidak ditemukan" };

    // Update current module to completed
    const { error: updateErr } = await supabaseAdmin
      .from("learnbook")
      .update({
        status: "completed",
        completed_at: new Date().toISOString()
      })
      .eq("id", moduleId);

    if (updateErr) return { success: false, message: updateErr.message };

    // Unlock next module
    const nextUrutan = moduleData.urutan + 1;
    await supabaseAdmin
      .from("learnbook")
      .update({ status: "active" })
      .eq("umkm_id", moduleData.umkm_id)
      .eq("batch_id", moduleData.batch_id)
      .eq("urutan", nextUrutan);

    revalidatePath(`/dashboard/umkm/learnbook/${umkmId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
