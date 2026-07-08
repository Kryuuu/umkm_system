"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import crypto from "crypto";
import { isManualAttendanceCode, manualCodeFromToken, normalizeAttendanceInput } from "@/lib/attendance-token";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://msajpzdstvevpxvgywva.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key"
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jwtVerify(token, secretKey);
  
  // Normalize role
  let normalizedRole = payload.role;
  if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
    normalizedRole = 'Admin';
  } else if (normalizedRole === 'fasilitator') {
    normalizedRole = 'Staff';
  } else if (normalizedRole === 'umkm') {
    normalizedRole = 'Mitra';
  }
  payload.role = normalizedRole;

  if (payload.role === "Mitra") throw new Error("Unauthorized");
  return payload;
}

async function getActiveUmkmId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jwtVerify(token, secretKey);

  // Normalize role
  let normalizedRole = payload.role;
  if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
    normalizedRole = 'Admin';
  } else if (normalizedRole === 'fasilitator') {
    normalizedRole = 'Staff';
  } else if (normalizedRole === 'umkm') {
    normalizedRole = 'Mitra';
  }
  payload.role = normalizedRole;

  if (payload.role !== "Mitra") {
    throw new Error("Hanya UMKM yang dapat melakukan absensi QR Code");
  }
  return payload.umkm_id || payload.id;
}

export async function saveKehadiranAction(pelatihanId: number, kehadiran: Record<number, string>) {
  try {
    await checkAuth();

    for (const [umkmIdStr, status] of Object.entries(kehadiran)) {
      const umkmId = parseInt(umkmIdStr);

      // Check if existing record
      const { data: existing } = await supabaseAdmin
        .from("kehadiran_pelatihan")
        .select("id")
        .eq("pelatihan_id", pelatihanId)
        .eq("umkm_id", umkmId)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from("kehadiran_pelatihan")
          .update({ status_hadir: status })
          .eq("id", existing.id);
      } else {
        await supabaseAdmin
          .from("kehadiran_pelatihan")
          .insert({
            pelatihan_id: pelatihanId,
            umkm_id: umkmId,
            status_hadir: status
          });
      }
    }

    revalidatePath(`/dashboard/pelatihan/kehadiran/${pelatihanId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getPelatihanQrTokenAction(pelatihanId: number) {
  try {
    await checkAuth();
    
    const { data, error } = await supabaseAdmin
      .from("pelatihan")
      .select("qr_token, qr_expires_at")
      .eq("id", pelatihanId)
      .single();
      
    if (error) throw error;
    return { success: true, qrToken: data?.qr_token, qrExpiresAt: data?.qr_expires_at };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function generateQrTokenAction(pelatihanId: number) {
  try {
    await checkAuth();
    
    const qrToken = crypto.randomUUID();
    const qrExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes validity
    
    const { error } = await supabaseAdmin
      .from("pelatihan")
      .update({ qr_token: qrToken, qr_expires_at: qrExpiresAt })
      .eq("id", pelatihanId);
      
    if (error) throw error;
    
    revalidatePath(`/dashboard/pelatihan/kehadiran/${pelatihanId}`);
    return { success: true, qrToken, qrExpiresAt };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function verifyQrTokenAndRecordPresence(qrToken: string) {
  try {
    const umkmId = await getActiveUmkmId();
    
    // Check ban status first
    const { data: umkmUser } = await supabaseAdmin
      .from("umkm")
      .select("failed_absent_attempts, is_banned")
      .eq("id", umkmId)
      .single();

    if (umkmUser?.is_banned) {
      return { success: false, message: "Akun Anda diblokir dari sistem absensi karena salah memasukkan kode. Silakan lapor ke Admin.", isBanned: true };
    }

    const submittedToken = normalizeAttendanceInput(qrToken);
    const submittedCode = submittedToken.toUpperCase();
    
    // 1. QR memakai UUID lengkap; input manual memakai 8 karakter pertama
    // dari token yang sama sehingga keduanya selalu berputar bersama.
    let pelatihan: { id: number; nama_pelatihan: string; qr_expires_at: string | null } | null = null;
    let lookupError: { message: string } | null = null;

    if (isManualAttendanceCode(submittedCode)) {
      const { data: activeTrainings, error } = await supabaseAdmin
        .from("pelatihan")
        .select("id, nama_pelatihan, qr_token, qr_expires_at")
        .not("qr_token", "is", null);
      lookupError = error;
      const matched = activeTrainings?.find((item) => manualCodeFromToken(item.qr_token) === submittedCode);
      pelatihan = matched ? {
        id: matched.id,
        nama_pelatihan: matched.nama_pelatihan,
        qr_expires_at: matched.qr_expires_at,
      } : null;
    } else {
      const { data, error } = await supabaseAdmin
        .from("pelatihan")
        .select("id, nama_pelatihan, qr_expires_at")
        .eq("qr_token", submittedToken.toLowerCase())
        .maybeSingle();
      pelatihan = data;
      lookupError = error;
    }
      
    if (lookupError || !pelatihan || (pelatihan.qr_expires_at && new Date(pelatihan.qr_expires_at) < new Date())) {
      const attempts = (umkmUser?.failed_absent_attempts || 0) + 1;
      let isBanned = false;
      let msg = "Kode absensi tidak valid atau sudah kedaluwarsa.";
      
      if (attempts >= 3) {
        isBanned = true;
        msg = "Kode salah 3 kali! Akun Anda diblokir sementara untuk absensi. Silakan hubungi Admin.";
      } else {
        msg = `Kode salah atau kedaluwarsa. Kesempatan salah: ${3 - attempts} kali lagi sebelum diblokir.`;
      }
      
      await supabaseAdmin.from("umkm").update({
        failed_absent_attempts: attempts,
        is_banned: isBanned
      }).eq("id", umkmId);

      return { 
        success: false, 
        message: msg,
        isBanned: isBanned
      };
    }
    
    // 2. Jika kode benar, reset attempts ke 0
    if (umkmUser?.failed_absent_attempts && umkmUser.failed_absent_attempts > 0) {
      await supabaseAdmin.from("umkm").update({ failed_absent_attempts: 0 }).eq("id", umkmId);
    }
    
    const pelatihanId = pelatihan.id;
    
    // 3. Record attendance
    const { data: existing } = await supabaseAdmin
      .from("kehadiran_pelatihan")
      .select("id, status_hadir")
      .eq("pelatihan_id", pelatihanId)
      .eq("umkm_id", umkmId)
      .maybeSingle();
      
    if (existing) {
      if (existing.status_hadir === "hadir") {
        return { success: true, message: "Anda sudah terdaftar hadir untuk pelatihan ini sebelumnya.", sudahHadir: true };
      }
      await supabaseAdmin
        .from("kehadiran_pelatihan")
        .update({ status_hadir: "hadir" })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin
        .from("kehadiran_pelatihan")
        .insert({
          pelatihan_id: pelatihanId,
          umkm_id: umkmId,
          status_hadir: "hadir"
        });
    }
    
    // 4. IMMEDIATELY ROTATE TOKEN
    const newQrToken = crypto.randomUUID();
    const newExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    await supabaseAdmin
      .from("pelatihan")
      .update({ qr_token: newQrToken, qr_expires_at: newExpiresAt })
      .eq("id", pelatihanId);
      
    revalidatePath(`/dashboard/pelatihan/kehadiran/${pelatihanId}`);
    return { success: true, message: `Absensi berhasil dicatat untuk pelatihan: ${pelatihan.nama_pelatihan}`, pelatihanName: pelatihan.nama_pelatihan };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getKehadiranStatsAction(pelatihanId: number) {
  try {
    await checkAuth();
    
    const { count: totalUmkm, error: uErr } = await supabaseAdmin
      .from("umkm")
      .select("*", { count: "exact", head: true });
      
    const { count: totalHadir, error: hErr } = await supabaseAdmin
      .from("kehadiran_pelatihan")
      .select("*", { count: "exact", head: true })
      .eq("pelatihan_id", pelatihanId)
      .eq("status_hadir", "hadir");
      
    // Fetch recent 3 checked-in UMKMs
    const { data: recentPresence, error: rErr } = await supabaseAdmin
      .from("kehadiran_pelatihan")
      .select(`
        id,
        created_at,
        umkm (
          nama_umkm,
          nama_pemilik
        )
      `)
      .eq("pelatihan_id", pelatihanId)
      .eq("status_hadir", "hadir")
      .order("created_at", { ascending: false })
      .limit(3);
      
    if (uErr) throw uErr;
    if (hErr) throw hErr;
    
    return { 
      success: true, 
      totalUmkm: totalUmkm || 0, 
      totalHadir: totalHadir || 0,
      recent: (recentPresence || []).map((rp: any) => ({
        id: rp.id,
        nama_umkm: rp.umkm?.nama_umkm || "Unknown",
        nama_pemilik: rp.umkm?.nama_pemilik || "Unknown",
        created_at: rp.created_at
      }))
    };
  } catch (err: any) {
    return { success: false, message: err.message, totalUmkm: 0, totalHadir: 0, recent: [] };
  }
}

export async function getKehadiranListAction(pelatihanId: number) {
  try {
    await checkAuth();
    
    const { data: presence, error } = await supabaseAdmin
      .from("kehadiran_pelatihan")
      .select("*")
      .eq("pelatihan_id", pelatihanId);
      
    if (error) throw error;
    
    return { success: true, presence: presence || [] };
  } catch (err: any) {
    return { success: false, message: err.message, presence: [] };
  }
}

export async function reportBanToAdminAction() {
  try {
    const umkmId = await getActiveUmkmId();
    
    const subjek = "Permohonan Buka Blokir Absensi";
    const pesan = "Halo Admin, akun saya telah diblokir dari sistem absensi karena kesalahan memasukkan kode 3 kali berturut-turut. Mohon bantuannya untuk meninjau dan membuka kembali akses absensi saya. Terima kasih.";

    const { data: newChat, error } = await supabaseAdmin.from("konsultasi").insert({
      umkm_id: umkmId,
      pengirim_role: "Mitra",
      pengirim_id: umkmId,
      subjek: subjek,
      pesan: pesan,
      parent_id: null,
      is_read: false
    }).select().single();

    if (error) throw error;
    
    const { data: uInfo } = await supabaseAdmin.from("umkm").select("nama_umkm, fasilitator_id").eq("id", umkmId).single();
    if (uInfo) {
      if (uInfo.fasilitator_id) {
        await supabaseAdmin.from("notifikasi").insert({
          target_role: "Staff",
          target_id: uInfo.fasilitator_id,
          tipe: "chat",
          judul: "Permohonan Buka Blokir",
          pesan: `UMKM ${uInfo.nama_umkm} mengirim pesan permohonan buka blokir absensi.`
        });
      }

      const { data: admins } = await supabaseAdmin.from("fasilitator").select("id").eq("role", "Admin");
      if (admins && admins.length > 0) {
        const adminNotifs = admins.map(admin => ({
          target_role: "Admin",
          target_id: admin.id,
          tipe: "chat",
          judul: "Permohonan Buka Blokir",
          pesan: `UMKM ${uInfo.nama_umkm} mengirim pesan permohonan buka blokir absensi.`
        }));
        await supabaseAdmin.from("notifikasi").insert(adminNotifs);
      }
    }

    revalidatePath("/dashboard/konsultasi");
    return { success: true, threadId: newChat.id };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
