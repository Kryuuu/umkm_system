import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, type JWTPayload } from "jose";
import { createClient } from "@supabase/supabase-js";
import { normalizeRole, sanitizePermissions, type StaffPermission } from "@/lib/permissions";

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345",
);

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type AuthUser = JWTPayload & {
  id: number;
  role: "Admin" | "Staff" | "Mitra";
  name?: string;
  username?: string;
  permissions?: StaffPermission[];
};

export async function getAuthUser(): Promise<AuthUser> {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) throw new Error("UNAUTHORIZED");

  const { payload } = await jwtVerify(token, secretKey);
  const id = Number(payload.id);
  if (!id) throw new Error("UNAUTHORIZED");

  const role = normalizeRole(payload.role) as AuthUser["role"];
  return { ...payload, id, role };
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (user.role !== "Admin") throw new Error("FORBIDDEN");
  return user;
}

export async function getStaffPermissions(staffId: number) {
  const { data, error } = await supabaseAdmin
    .from("fasilitator")
    .select("*")
    .eq("id", staffId)
    .single();
  if (error || !data) throw new Error("Akun staff tidak ditemukan.");
  return sanitizePermissions(data.permissions);
}
