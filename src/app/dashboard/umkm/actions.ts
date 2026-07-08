"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function saveFile(file: File | null): Promise<string | null> {
    if (!file || file.size === 0) return null;
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/dokumen');
    await fs.writeFile(path.join(uploadDir, fileName), buffer);
    return fileName;
}

export async function createUmkm(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    
    const hashedPassword = await bcrypt.hash(rawData.password as string, 10);
    
    let halalFileName = await saveFile(formData.get('sertifikat_halal') as File);
    let pirtFileName = await saveFile(formData.get('sertifikat_pirt') as File);
    let nibFileName = await saveFile(formData.get('dokumen_nib') as File);

    const { error } = await supabaseAdmin.from('umkm').insert({
      id_umkm: rawData.id_umkm || null,
      username: rawData.username,
      password: hashedPassword,
      nama_umkm: rawData.nama_umkm,
      nama_pemilik: rawData.nama_pemilik,
      no_telpon: rawData.no_telpon,
      email: rawData.email,
      fasilitator_id: rawData.fasilitator_id ? parseInt(rawData.fasilitator_id as string) : null,
      nik: rawData.nik,
      nib: rawData.nib,
      sertifikat_halal: halalFileName,
      halal_berlaku: rawData.halal_berlaku || null,
      sertifikat_pirt: pirtFileName,
      pirt_berlaku: rawData.pirt_berlaku || null,
      dokumen_nib: nibFileName,
      nib_berlaku: rawData.nib_berlaku || null,
      alamat: rawData.alamat,
      domisili: rawData.domisili,
      deskripsi: rawData.deskripsi,
      status_usaha: rawData.status_usaha || 'Pemula'
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/umkm");
    revalidatePath("/dashboard/umkm/master");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function updateUmkm(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries());
    const id = rawData.id;

    let halalFileName = await saveFile(formData.get('sertifikat_halal') as File);
    let pirtFileName = await saveFile(formData.get('sertifikat_pirt') as File);
    let nibFileName = await saveFile(formData.get('dokumen_nib') as File);

    const updates: any = {
      nama_umkm: rawData.nama_umkm,
      nama_pemilik: rawData.nama_pemilik,
      no_telpon: rawData.no_telpon,
      email: rawData.email,
      nik: rawData.nik,
      nib: rawData.nib,
      halal_berlaku: rawData.halal_berlaku || null,
      pirt_berlaku: rawData.pirt_berlaku || null,
      nib_berlaku: rawData.nib_berlaku || null,
      alamat: rawData.alamat,
      domisili: rawData.domisili,
      deskripsi: rawData.deskripsi,
      status_usaha: rawData.status_usaha || 'Pemula'
    };

    if (rawData.fasilitator_id) {
      updates.fasilitator_id = parseInt(rawData.fasilitator_id as string);
    }

    if (halalFileName) updates.sertifikat_halal = halalFileName;
    if (pirtFileName) updates.sertifikat_pirt = pirtFileName;
    if (nibFileName) updates.dokumen_nib = nibFileName;

    if (rawData.password && (rawData.password as string).trim() !== "") {
      updates.password = await bcrypt.hash(rawData.password as string, 10);
    }

    const { error } = await supabaseAdmin.from('umkm').update(updates).eq('id', id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/umkm");
    revalidatePath("/dashboard/umkm/master");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteUmkm(id: number) {
  try {
    const { error } = await supabaseAdmin.from('umkm').delete().eq('id', id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/umkm");
    revalidatePath("/dashboard/umkm/master");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function toggleBanUmkm(id: number, currentBanStatus: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('umkm')
      .update({ is_banned: !currentBanStatus, failed_absent_attempts: 0 })
      .eq('id', id);
      
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/umkm/master");
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
