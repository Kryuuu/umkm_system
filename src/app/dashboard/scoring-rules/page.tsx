import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ScoringRulesClient from "./ScoringRulesClient";
import { canAccess, sanitizePermissions } from "@/lib/permissions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function ScoringRulesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    user = payload;
    
    // Normalize role
    if (user.role === "admin" || user.role === "Admin Staff") user.role = "Admin";
    else if (user.role === "fasilitator") user.role = "Staff";
    else if (user.role === "umkm") user.role = "Mitra";
  } catch {
    redirect("/");
  }

  if (user.role === "Mitra") redirect("/dashboard");

  // Check staff permissions
  if (user.role === "Staff") {
    const { data: staff } = await supabaseAdmin
      .from("fasilitator")
      .select("permissions")
      .eq("id", user.id)
      .single();
    
    const perms = sanitizePermissions(staff?.permissions);
    if (!canAccess(user.role, perms, "scoring_rules")) {
      redirect("/dashboard");
    }
  }

  // Fetch rules
  let rules: any[] = [];
  let tableReady = true;
  
  try {
    const { data, error } = await supabaseAdmin
      .from("scoring_rules")
      .select("*")
      .order("kategori")
      .order("urutan");

    if (error) {
      tableReady = false;
    } else {
      rules = data || [];
    }
  } catch {
    tableReady = false;
  }

  return <ScoringRulesClient rules={rules} user={user} tableReady={tableReady} />;
}
