import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
// Presenter client component for QR Code
import QrClient from "@/app/dashboard/pelatihan/kehadiran/[id]/qr/QrClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function QrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pelatihanIdStr } = await params;
  const pelatihanId = parseInt(pelatihanIdStr);

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

  // Only admins or facilitators can view presence QR
  if (user.role === "umkm") {
    redirect("/dashboard");
  }

  // Fetch training
  const { data: pelatihan, error: pErr } = await supabaseAdmin
    .from("pelatihan")
    .select("*")
    .eq("id", pelatihanId)
    .single();

  if (pErr || !pelatihan) {
    redirect("/dashboard/pelatihan");
  }

  return (
    <QrClient
      pelatihan={pelatihan}
    />
  );
}
