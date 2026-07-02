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

export async function analyzeUmkmAction(umkmId: number) {
  try {
    await checkAuth();
    const res = await calculateScore(umkmId);
    if (!res.success) return { success: false, message: res.message };
    revalidatePath("/dashboard/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function analyzeAllAction() {
  try {
    await checkAuth();
    const { data: allUmkm } = await supabaseAdmin.from("umkm").select("id");
    if (!allUmkm) return { success: false, message: "Tidak ada UMKM" };

    for (const u of allUmkm) {
      await calculateScore(u.id);
    }

    revalidatePath("/dashboard/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
