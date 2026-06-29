import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import KonsultasiClient from "./KonsultasiClient";
import SelectUmkmClient from "@/components/SelectUmkmClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function KonsultasiPage({
  searchParams,
}: {
  searchParams: Promise<{ umkm_id?: string }>;
}) {
  const { umkm_id } = await searchParams;
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

  // Fetch list of UMKM for selector
  let umkmListQuery = supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik");
  if (user.role === "fasilitator") {
    umkmListQuery = umkmListQuery.ilike("domisili", `%${user.domisili || ""}%`);
  }
  const { data: umkmList } = await umkmListQuery;

  // For Admin & Facilitator: if no umkm_id is selected, show UMKM Selection Screen
  if (user.role !== "umkm" && !umkm_id) {
    return (
      <SelectUmkmClient
        umkmList={umkmList || []}
        targetPage="konsultasi"
        targetLabel="konsultasi"
        user={user}
      />
    );
  }

  // Determine active umkm_id
  const activeUmkmId = user.role === "umkm" ? (user.umkm_id || user.id) : parseInt(umkm_id as string);

  // Fetch consultation threads for the active UMKM
  let query = supabaseAdmin
    .from("konsultasi")
    .select(`*, umkm:umkm_id(nama_umkm, domisili)`)
    .is("parent_id", null)
    .eq("umkm_id", activeUmkmId)
    .order("created_at", { ascending: false });

  const { data: threadsRaw } = await query;

  let threads = threadsRaw?.map(t => ({
    ...t,
    nama_umkm: t.umkm?.nama_umkm
  })) || [];

  return <KonsultasiClient threads={threads} umkmList={umkmList || []} user={user} />;
}
