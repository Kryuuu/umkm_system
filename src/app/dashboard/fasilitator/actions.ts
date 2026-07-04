"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getAuthUser, requireAdmin, supabaseAdmin } from "@/lib/server-auth";
import { sanitizePermissions } from "@/lib/permissions";

type ActionResult = { success: true } | { success: false; message: string };

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "FORBIDDEN") return "Anda tidak memiliki hak akses untuk tindakan ini.";
    if (error.message === "UNAUTHORIZED") return "Sesi Anda sudah berakhir. Silakan login kembali.";
    return error.message;
  }
  return "Terjadi kesalahan pada server.";
}

function text(formData: FormData, key: string) {
  return formData.get(key)?.toString().trim() || "";
}

export async function createFasilitator(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const password = text(formData, "password");
    if (password.length < 6) return { success: false, message: "Password minimal 6 karakter." };

    const role = text(formData, "role") === "Admin" ? "Admin" : "Staff";
    const permissions = sanitizePermissions(formData.getAll("permissions"));
    const values = {
      username: text(formData, "username"),
      password: await bcrypt.hash(password, 10),
      nickname: text(formData, "nickname"),
      role,
      no_telpon: text(formData, "no_telpon") || null,
      email: text(formData, "email") || null,
      agama: text(formData, "agama") || null,
      domisili: text(formData, "domisili") || null,
      permissions: role === "Staff" ? permissions : [],
    };
    let { error } = await supabaseAdmin.from("fasilitator").insert(values);
    if (error?.message.toLowerCase().includes("permissions")) {
      const { permissions: _permissions, ...legacyValues } = values;
      void _permissions;
      const fallback = await supabaseAdmin.from("fasilitator").insert(legacyValues);
      error = fallback.error;
    }
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/fasilitator");
    return { success: true };
  } catch (error) {
    return { success: false, message: errorMessage(error) };
  }
}

export async function updateStaff(formData: FormData): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const id = Number(formData.get("id"));
    if (!id) return { success: false, message: "ID staff tidak valid." };

    const currentRole = text(formData, "role") === "Admin" ? "Admin" : "Staff";
    if (id === admin.id && currentRole !== "Admin") {
      return { success: false, message: "Anda tidak dapat menurunkan role akun sendiri." };
    }

    const updates: Record<string, unknown> = {
      username: text(formData, "username"),
      nickname: text(formData, "nickname"),
      role: currentRole,
      no_telpon: text(formData, "no_telpon") || null,
      email: text(formData, "email") || null,
      agama: text(formData, "agama") || null,
      domisili: text(formData, "domisili") || null,
    };
    const password = text(formData, "password");
    if (password) {
      if (password.length < 6) return { success: false, message: "Password minimal 6 karakter." };
      updates.password = await bcrypt.hash(password, 10);
    }

    const { error } = await supabaseAdmin.from("fasilitator").update(updates).eq("id", id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/fasilitator");
    revalidatePath("/dashboard/fasilitator/profile");
    return { success: true };
  } catch (error) {
    return { success: false, message: errorMessage(error) };
  }
}

export async function updateOwnProfile(formData: FormData): Promise<ActionResult> {
  try {
    const user = await getAuthUser();
    if (user.role === "Mitra") return { success: false, message: "Akun ini tidak menggunakan profil staff." };

    const updates: Record<string, unknown> = {
      nickname: text(formData, "nickname"),
      no_telpon: text(formData, "no_telpon") || null,
      email: text(formData, "email") || null,
      agama: text(formData, "agama") || null,
      domisili: text(formData, "domisili") || null,
    };
    const password = text(formData, "password");
    if (password) {
      if (password.length < 6) return { success: false, message: "Password minimal 6 karakter." };
      updates.password = await bcrypt.hash(password, 10);
    }

    const { error } = await supabaseAdmin.from("fasilitator").update(updates).eq("id", user.id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/fasilitator/profile");
    return { success: true };
  } catch (error) {
    return { success: false, message: errorMessage(error) };
  }
}

export async function updateStaffPermissions(staffId: number, permissions: string[]): Promise<ActionResult> {
  try {
    await requireAdmin();
    const safePermissions = sanitizePermissions(permissions);
    const { data: staff, error: staffError } = await supabaseAdmin
      .from("fasilitator")
      .select("id, role")
      .eq("id", staffId)
      .single();
    if (staffError || !staff) return { success: false, message: "Staff tidak ditemukan." };
    if (staff.role === "Admin") return { success: false, message: "Akun Admin selalu memiliki seluruh akses." };

    const { error } = await supabaseAdmin
      .from("fasilitator")
      .update({ permissions: safePermissions })
      .eq("id", staffId);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/fasilitator");
    return { success: true };
  } catch (error) {
    return { success: false, message: errorMessage(error) };
  }
}

export async function deleteFasilitator(id: number): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (id === admin.id) return { success: false, message: "Akun yang sedang digunakan tidak dapat dihapus." };

    const { error } = await supabaseAdmin.from("fasilitator").delete().eq("id", id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/fasilitator");
    return { success: true };
  } catch (error) {
    return { success: false, message: errorMessage(error) };
  }
}
