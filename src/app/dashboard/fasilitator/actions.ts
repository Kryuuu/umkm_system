"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createFasilitator(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    
    // Hash password
    const hashedPassword = await bcrypt.hash(rawData.password as string, 10);
    
    const { error } = await supabaseAdmin.from('fasilitator').insert({
      username: rawData.username,
      password: hashedPassword,
      nickname: rawData.nickname,
      role: rawData.role || 'fasilitator',
      no_telpon: rawData.no_telpon,
      email: rawData.email,
      agama: rawData.agama,
      domisili: rawData.domisili
    });

    if (error) {
      console.error("Error createFasilitator:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/fasilitator");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateFasilitator(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const id = rawData.id;

    const updates: any = {
      nickname: rawData.nickname,
      role: rawData.role || 'fasilitator',
      no_telpon: rawData.no_telpon,
      email: rawData.email,
      agama: rawData.agama,
      domisili: rawData.domisili
    };

    if (rawData.password && (rawData.password as string).trim() !== "") {
      updates.password = await bcrypt.hash(rawData.password as string, 10);
    }

    const { error } = await supabaseAdmin.from('fasilitator').update(updates).eq('id', id);

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/fasilitator");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteFasilitator(id: number) {
  try {
    const { error } = await supabaseAdmin.from('fasilitator').delete().eq('id', id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/fasilitator");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
