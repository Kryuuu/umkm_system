import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PelatihanClient from "./PelatihanClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function PelatihanPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) redirect("/");

  let user: any = null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    user = payload;
  } catch (err) {
    redirect("/");
  }

  // Normalize role to prevent stale session cookies
  let normalizedRole = user.role;
  if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
    normalizedRole = 'Admin';
  } else if (normalizedRole === 'fasilitator') {
    normalizedRole = 'Staff';
  } else if (normalizedRole === 'umkm') {
    normalizedRole = 'Mitra';
  }
  user.role = normalizedRole;

  // Mark all pelatihan notifications for this user as read
  if (user.role === "Mitra") {
    const myUmkmId = user.umkm_id || user.id;
    await supabaseAdmin
      .from("notifikasi")
      .update({ is_read: true })
      .eq("target_role", "Mitra")
      .eq("target_id", myUmkmId)
      .eq("tipe", "pelatihan");
  }

  const { data: pelatihanList } = await supabaseAdmin.from('pelatihan').select('*').order('tanggal', { ascending: false });

  return <PelatihanClient pelatihanList={pelatihanList || []} user={user} />;
}
