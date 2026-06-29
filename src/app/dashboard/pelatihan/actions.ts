"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createPelatihan(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    
    const { error } = await supabaseAdmin.from('pelatihan').insert({
      nama_pelatihan: rawData.nama_pelatihan,
      tanggal: rawData.tanggal,
      pemateri: rawData.pemateri,
      lokasi: rawData.lokasi,
      deskripsi: rawData.deskripsi,
      // Default placeholder if not uploaded
      file_materi: ''
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/pelatihan");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updatePelatihan(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const id = parseInt(rawData.id as string);

    const { error } = await supabaseAdmin.from('pelatihan').update({
      nama_pelatihan: rawData.nama_pelatihan,
      tanggal: rawData.tanggal,
      pemateri: rawData.pemateri,
      lokasi: rawData.lokasi,
      deskripsi: rawData.deskripsi,
    }).eq('id', id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/pelatihan");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deletePelatihan(id: number) {
  try {
    const { error } = await supabaseAdmin.from('pelatihan').delete().eq('id', id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/pelatihan");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
