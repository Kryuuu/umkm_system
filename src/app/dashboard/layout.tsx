import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { DEFAULT_STAFF_PERMISSIONS, normalizeRole, sanitizePermissions } from "@/lib/permissions";

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) redirect("/");

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    
    // Normalize role to prevent stale session cookies
    payload.role = normalizeRole(payload.role);

    if (payload.role === "Admin" || payload.role === "Staff") {
      const { data: account } = await supabaseAdmin
        .from("fasilitator")
        .select("*")
        .eq("id", payload.id)
        .single();
      if (!account) redirect("/");
      payload.name = account.nickname;
      payload.permissions = payload.role === "Staff"
        ? sanitizePermissions(account.permissions ?? DEFAULT_STAFF_PERMISSIONS)
        : DEFAULT_STAFF_PERMISSIONS;
    }
    
    user = payload;
  } catch {
    redirect("/");
  }

  return (
    <DashboardLayoutWrapper user={user}>
      {children}
    </DashboardLayoutWrapper>
  );
}
