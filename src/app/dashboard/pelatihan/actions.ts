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

    // Broadcast notification to all UMKM (Mitra) users
    try {
      const { data: allUmkms } = await supabaseAdmin.from('umkm').select('id');
      if (allUmkms && allUmkms.length > 0) {
        const formattedDate = new Date(rawData.tanggal as string).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        const notifications = allUmkms.map(u => ({
          target_role: 'Mitra',
          target_id: u.id,
          tipe: 'pelatihan',
          judul: 'Undangan Pelatihan Baru 📅',
          pesan: `Ada pelatihan baru "${rawData.nama_pelatihan}" oleh ${rawData.pemateri} di ${rawData.lokasi} pada ${formattedDate}. Silakan berhadir!`,
          is_read: false
        }));
        
        await supabaseAdmin.from('notifikasi').insert(notifications);
      }
    } catch (notifErr) {
      console.error("Failed to broadcast training notifications:", notifErr);
      // We don't fail the training creation just because notifications failed
    }

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
