"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createProduk(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    
    const { error } = await supabaseAdmin.from('produk').insert({
      umkm_id: parseInt(rawData.umkm_id as string),
      nama_produk: rawData.nama_produk,
      kategori_produk: rawData.kategori_produk,
      harga_produk: parseFloat(rawData.harga_produk as string),
      deskripsi_produk: rawData.deskripsi_produk,
      // Default to placeholder if not uploaded
      foto_produk: 'placeholder.jpg'
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateProduk(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const id = parseInt(rawData.id as string);

    const { error } = await supabaseAdmin.from('produk').update({
      umkm_id: parseInt(rawData.umkm_id as string),
      nama_produk: rawData.nama_produk,
      kategori_produk: rawData.kategori_produk,
      harga_produk: parseFloat(rawData.harga_produk as string),
      deskripsi_produk: rawData.deskripsi_produk,
    }).eq('id', id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteProduk(id: number) {
  try {
    const { error } = await supabaseAdmin.from('produk').delete().eq('id', id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/produk");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
