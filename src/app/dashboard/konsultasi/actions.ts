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
  
  // Normalize role to prevent stale session cookies from violating database constraints
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

export async function createKonsultasi(formData: FormData) {
  try {
    const user = await getUser();
    const rawData = Object.fromEntries(formData.entries());

    const umkmId = user.role === "Mitra" ? (user.umkm_id || user.id) : parseInt(rawData.umkm_id as string);
    const pengirimId = user.role === "Mitra" ? (user.umkm_id || user.id) : user.id;

    // Insert to konsultasi
    const { data: newChat, error } = await supabaseAdmin.from("konsultasi").insert({
      umkm_id: umkmId,
      pengirim_role: user.role,
      pengirim_id: pengirimId,
      subjek: rawData.subjek,
      pesan: rawData.pesan,
      parent_id: null,
      is_read: false
    }).select().single();

    if (error) return { success: false, message: error.message };

    // Notification logic
    if (user.role === "Mitra") {
      const { data: uInfo } = await supabaseAdmin.from("umkm").select("nama_umkm, fasilitator_id").eq("id", umkmId).single();
      if (uInfo) {
        if (uInfo.fasilitator_id) {
          await supabaseAdmin.from("notifikasi").insert({
            target_role: "Staff",
            target_id: uInfo.fasilitator_id,
            tipe: "chat",
            judul: "Pesan Baru dari UMKM",
            pesan: `UMKM ${uInfo.nama_umkm} mengirim pesan baru: "${rawData.subjek}"`
          });
        }

        // Notify admins
        const { data: admins } = await supabaseAdmin.from("fasilitator").select("id").eq("role", "Admin");
        if (admins && admins.length > 0) {
          const adminNotifs = admins.map(admin => ({
            target_role: "Admin",
            target_id: admin.id,
            tipe: "chat",
            judul: "Pesan Baru dari UMKM",
            pesan: `UMKM ${uInfo.nama_umkm} mengirim pesan baru: "${rawData.subjek}"`
          }));
          await supabaseAdmin.from("notifikasi").insert(adminNotifs);
        }
      }
    } else {
      await supabaseAdmin.from("notifikasi").insert({
        target_role: "Mitra",
        target_id: umkmId,
        tipe: "chat",
        judul: `Pesan Baru dari ${user.role === 'Admin' ? 'Admin' : 'Staff'}`,
        pesan: `Anda mendapat pesan baru: "${rawData.subjek}"`
      });
    }

    revalidatePath("/dashboard/konsultasi");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function replyKonsultasi(formData: FormData) {
  try {
    const user = await getUser();
    const rawData = Object.fromEntries(formData.entries());
    const parentId = parseInt(rawData.parent_id as string);

    // Get parent thread
    const { data: parent, error: fetchErr } = await supabaseAdmin.from("konsultasi").select("*").eq("id", parentId).single();
    if (fetchErr || !parent) return { success: false, message: "Thread tidak ditemukan" };

    const pengirimId = user.role === "Mitra" ? (user.umkm_id || user.id) : user.id;

    // Insert reply
    const { error } = await supabaseAdmin.from("konsultasi").insert({
      umkm_id: parent.umkm_id,
      pengirim_role: user.role,
      pengirim_id: pengirimId,
      subjek: `Re: ${parent.subjek}`,
      pesan: rawData.pesan,
      parent_id: parentId,
      is_read: false
    });

    if (error) return { success: false, message: error.message };

    // Mark other messages in thread as read
    await supabaseAdmin.from("konsultasi")
      .update({ is_read: true })
      .or(`id.eq.${parentId},parent_id.eq.${parentId}`)
      .neq("pengirim_role", user.role);

    // Notification logic
    if (user.role === "Mitra") {
      const { data: uInfo } = await supabaseAdmin.from("umkm").select("nama_umkm, fasilitator_id").eq("id", parent.umkm_id).single();
      if (uInfo) {
        if (uInfo.fasilitator_id) {
          await supabaseAdmin.from("notifikasi").insert({
            target_role: "Staff",
            target_id: uInfo.fasilitator_id,
            tipe: "chat",
            judul: "Balasan Baru dari UMKM",
            pesan: `UMKM ${uInfo.nama_umkm} membalas thread: "${parent.subjek}"`
          });
        }

        const { data: admins } = await supabaseAdmin.from("fasilitator").select("id").eq("role", "Admin");
        if (admins && admins.length > 0) {
          const adminNotifs = admins.map(admin => ({
            target_role: "Admin",
            target_id: admin.id,
            tipe: "chat",
            judul: "Balasan Baru dari UMKM",
            pesan: `UMKM ${uInfo.nama_umkm} membalas thread: "${parent.subjek}"`
          }));
          await supabaseAdmin.from("notifikasi").insert(adminNotifs);
        }
      }
    } else {
      await supabaseAdmin.from("notifikasi").insert({
        target_role: "Mitra",
        target_id: parent.umkm_id,
        tipe: "chat",
        judul: `Balasan Baru dari ${user.role === 'Admin' ? 'Admin' : 'Staff'}`,
        pesan: `Terdapat balasan baru di thread: "${parent.subjek}"`
      });
    }

    revalidatePath(`/dashboard/konsultasi/thread/${parentId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteKonsultasi(id: number) {
  try {
    // Delete replies first
    const { error: replyErr } = await supabaseAdmin.from("konsultasi").delete().eq("parent_id", id);
    if (replyErr) return { success: false, message: replyErr.message };

    // Delete parent
    const { error: parentErr } = await supabaseAdmin.from("konsultasi").delete().eq("id", id);
    if (parentErr) return { success: false, message: parentErr.message };

    revalidatePath("/dashboard/konsultasi");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
