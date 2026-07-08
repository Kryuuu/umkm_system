"use server";

import { revalidatePath } from "next/cache";
import { getAuthUser, supabaseAdmin } from "@/lib/server-auth";
import { canAccess } from "@/lib/permissions";

type ActionResult = { success: true } | { success: false; message: string };

async function requireScoringAccess() {
  const user = await getAuthUser();
  if (user.role === "Mitra") throw new Error("FORBIDDEN");
  
  if (user.role === "Staff") {
    // Fetch staff permissions from DB
    const { data: staff } = await supabaseAdmin
      .from("fasilitator")
      .select("permissions")
      .eq("id", user.id)
      .single();
    
    if (!canAccess(user.role, staff?.permissions, "scoring_rules")) {
      throw new Error("FORBIDDEN");
    }
  }
  
  return user;
}

export async function getScoringRules() {
  try {
    await requireScoringAccess();
    
    const { data, error } = await supabaseAdmin
      .from("scoring_rules")
      .select("*")
      .order("kategori")
      .order("urutan");

    if (error) {
      // Table might not exist yet
      return { success: false as const, message: "Tabel scoring_rules belum dibuat. Jalankan migration-scoring-rules.sql di Supabase SQL Editor.", rules: [] };
    }

    return { success: true as const, rules: data || [] };
  } catch (err: any) {
    if (err.message === "FORBIDDEN") {
      return { success: false as const, message: "Anda tidak memiliki akses ke fitur ini.", rules: [] };
    }
    return { success: false as const, message: err.message, rules: [] };
  }
}

export async function createScoringRule(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireScoringAccess();

    const kategori = formData.get("kategori")?.toString().trim() || "";
    const label = formData.get("label")?.toString().trim() || "";
    const deskripsi = formData.get("deskripsi")?.toString().trim() || "";
    const kondisi_min = Number(formData.get("kondisi_min")) || 0;
    const kondisi_max_raw = formData.get("kondisi_max")?.toString().trim();
    const kondisi_max = kondisi_max_raw && kondisi_max_raw !== "" ? Number(kondisi_max_raw) : null;
    const poin = Number(formData.get("poin")) || 0;
    const max_poin_raw = formData.get("max_poin")?.toString().trim();
    const max_poin = max_poin_raw && max_poin_raw !== "" ? Number(max_poin_raw) : null;
    const urutan = Number(formData.get("urutan")) || 0;

    if (!kategori) return { success: false, message: "Kategori harus diisi." };
    if (!label) return { success: false, message: "Label harus diisi." };

    const { error } = await supabaseAdmin.from("scoring_rules").insert({
      kategori,
      label,
      deskripsi,
      kondisi_min,
      kondisi_max,
      poin,
      max_poin,
      urutan,
      is_active: true,
      updated_by: user.id,
    });

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/scoring-rules");
    return { success: true };
  } catch (err: any) {
    if (err.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses." };
    return { success: false, message: err.message };
  }
}

export async function updateScoringRule(formData: FormData): Promise<ActionResult> {
  try {
    const user = await requireScoringAccess();

    const id = Number(formData.get("id"));
    if (!id) return { success: false, message: "ID rule tidak valid." };

    const label = formData.get("label")?.toString().trim() || "";
    const deskripsi = formData.get("deskripsi")?.toString().trim() || "";
    const kondisi_min = Number(formData.get("kondisi_min")) || 0;
    const kondisi_max_raw = formData.get("kondisi_max")?.toString().trim();
    const kondisi_max = kondisi_max_raw && kondisi_max_raw !== "" ? Number(kondisi_max_raw) : null;
    const poin = Number(formData.get("poin")) || 0;
    const max_poin_raw = formData.get("max_poin")?.toString().trim();
    const max_poin = max_poin_raw && max_poin_raw !== "" ? Number(max_poin_raw) : null;
    const urutan = Number(formData.get("urutan")) || 0;
    const is_active = formData.get("is_active") === "true";

    if (!label) return { success: false, message: "Label harus diisi." };

    // Log changes
    const { data: oldRule } = await supabaseAdmin
      .from("scoring_rules")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabaseAdmin.from("scoring_rules").update({
      label,
      deskripsi,
      kondisi_min,
      kondisi_max,
      poin,
      max_poin,
      urutan,
      is_active,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) return { success: false, message: error.message };

    // Log the change
    if (oldRule && oldRule.poin !== poin) {
      try {
        await supabaseAdmin.from("scoring_rules_log").insert({
          rule_id: id,
          field_changed: "poin",
          old_value: String(oldRule.poin),
          new_value: String(poin),
          changed_by: user.id,
        });
      } catch (e) {
        // Ignore if log table doesn't exist
      }
    }

    revalidatePath("/dashboard/scoring-rules");
    return { success: true };
  } catch (err: any) {
    if (err.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses." };
    return { success: false, message: err.message };
  }
}

export async function deleteScoringRule(id: number): Promise<ActionResult> {
  try {
    await requireScoringAccess();

    const { error } = await supabaseAdmin.from("scoring_rules").delete().eq("id", id);
    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/scoring-rules");
    return { success: true };
  } catch (err: any) {
    if (err.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses." };
    return { success: false, message: err.message };
  }
}

export async function toggleRuleActive(id: number, isActive: boolean): Promise<ActionResult> {
  try {
    const user = await requireScoringAccess();

    const { error } = await supabaseAdmin.from("scoring_rules").update({
      is_active: isActive,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/scoring-rules");
    return { success: true };
  } catch (err: any) {
    if (err.message === "FORBIDDEN") return { success: false, message: "Anda tidak memiliki akses." };
    return { success: false, message: err.message };
  }
}
