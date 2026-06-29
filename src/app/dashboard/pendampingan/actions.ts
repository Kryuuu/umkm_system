"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createPendampingan(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    
    const { error } = await supabaseAdmin.from('pendampingan').insert({
      umkm_id: parseInt(rawData.umkm_id as string),
      tanggal: rawData.tanggal,
      jenis_pendampingan: rawData.jenis_pendampingan,
      hasil: rawData.hasil,
      catatan: rawData.catatan
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/pendampingan");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updatePendampingan(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const id = parseInt(rawData.id as string);

    const { error } = await supabaseAdmin.from('pendampingan').update({
      umkm_id: parseInt(rawData.umkm_id as string),
      tanggal: rawData.tanggal,
      jenis_pendampingan: rawData.jenis_pendampingan,
      hasil: rawData.hasil,
      catatan: rawData.catatan
    }).eq('id', id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/pendampingan");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deletePendampingan(id: number) {
  try {
    const { error } = await supabaseAdmin.from('pendampingan').delete().eq('id', id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/pendampingan");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
