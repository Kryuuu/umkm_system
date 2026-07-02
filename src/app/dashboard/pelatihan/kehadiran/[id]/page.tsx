import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import KehadiranClient from "./KehadiranClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function KehadiranPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Only admins or facilitators can view presence
  if (user.role === "Mitra") {
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

  // Fetch all UMKMs
  const { data: umkms } = await supabaseAdmin
    .from("umkm")
    .select("id, nama_umkm, nama_pemilik")
    .order("nama_umkm", { ascending: true });

  // Fetch presence entries for this training
  const { data: presence } = await supabaseAdmin
    .from("kehadiran_pelatihan")
    .select("*")
    .eq("pelatihan_id", pelatihanId);

  // Combine them: for each UMKM, find presence
  const kehadiranList = (umkms || []).map((u) => {
    const pRecord = (presence || []).find((p) => p.umkm_id === u.id);
    return {
      umkm_id: u.id,
      nama_umkm: u.nama_umkm,
      nama_pemilik: u.nama_pemilik,
      status_hadir: pRecord ? pRecord.status_hadir : ""
    };
  });

  return (
    <KehadiranClient
      pelatihan={pelatihan}
      kehadiranList={kehadiranList}
    />
  );
}
