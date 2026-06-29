"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import crypto from "crypto";

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
  if (payload.role === "umkm") throw new Error("Unauthorized");
  return payload;
}

async function getActiveUmkmId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");
  const { payload } = await jwtVerify(token, secretKey);
  if (payload.role !== "umkm") {
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
    
    // 1. Find the pelatihan with this token
    const { data: pelatihan, error } = await supabaseAdmin
      .from("pelatihan")
      .select("id, nama_pelatihan, qr_expires_at")
      .eq("qr_token", qrToken)
      .maybeSingle();
      
    if (error || !pelatihan) {
      return { success: false, message: "QR Code tidak valid atau sudah digunakan oleh orang lain." };
    }
    
    // 2. Check expiration
    if (pelatihan.qr_expires_at && new Date(pelatihan.qr_expires_at) < new Date()) {
      return { success: false, message: "QR Code sudah kedaluwarsa. Silakan scan QR Code terbaru di layar." };
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
        return { success: true, message: "Anda sudah melakukan absensi untuk pelatihan ini.", sudahHadir: true };
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

