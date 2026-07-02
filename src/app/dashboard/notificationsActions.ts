"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";

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

  return payload as any;
}

export async function getNotificationsAction() {
  try {
    const user = await getUser();
    
    let query = supabaseAdmin
      .from("notifikasi")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);

    if (user.role === "Admin") {
      query = query.eq("target_role", "Admin");
    } else if (user.role === "Staff") {
      query = query.eq("target_role", "Staff").eq("target_id", user.id);
    } else if (user.role === "Mitra") {
      const activeUmkmId = user.umkm_id || user.id;
      query = query.eq("target_role", "Mitra").eq("target_id", activeUmkmId);
    } else {
      return { success: true, notifications: [] };
    }

    const { data, error } = await query;
    if (error) throw error;

    return { success: true, notifications: data || [] };
  } catch (err: any) {
    return { success: false, message: err.message, notifications: [] };
  }
}

export async function markNotificationAsReadAction(id: number) {
  try {
    const user = await getUser();
    
    const { error } = await supabaseAdmin
      .from("notifikasi")
      .update({ is_read: true })
      .eq("id", id);

    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function markAllNotificationsAsReadAction() {
  try {
    const user = await getUser();
    
    let query = supabaseAdmin
      .from("notifikasi")
      .update({ is_read: true });

    if (user.role === "Admin") {
      query = query.eq("target_role", "Admin");
    } else if (user.role === "Staff") {
      query = query.eq("target_role", "Staff").eq("target_id", user.id);
    } else if (user.role === "Mitra") {
      const activeUmkmId = user.umkm_id || user.id;
      query = query.eq("target_role", "Mitra").eq("target_id", activeUmkmId);
    } else {
      return { success: true };
    }

    const { error } = await query;
    if (error) throw error;

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
