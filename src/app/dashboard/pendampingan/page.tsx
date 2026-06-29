import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PendampinganClient from "./PendampinganClient";
import SelectUmkmClient from "@/components/SelectUmkmClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function PendampinganPage({
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

  const isUmkmUser = user.role === "umkm";
  const activeUmkmId = isUmkmUser ? (user.umkm_id || user.id) : (umkm_id ? parseInt(umkm_id) : null);

  // For Admin & Facilitator: if no umkm_id is selected, show UMKM Selection Screen
  if (!isUmkmUser && !activeUmkmId) {
    let umkmListQuery = supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik");
    if (user.role === "fasilitator") {
      umkmListQuery = umkmListQuery.ilike("domisili", `%${user.domisili || ""}%`);
    }
    const { data: umkmList } = await umkmListQuery;
    return (
      <SelectUmkmClient
        umkmList={umkmList || []}
        targetPage="pendampingan"
        targetLabel="pendampingan"
        user={user}
      />
    );
  }

  // Fetch list of UMKM in parallel only if needed, along with pendampingan list
  let umkmListPromise: any = Promise.resolve({ data: [] as any[] });
  if (!isUmkmUser) {
    let query = supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik");
    if (user.role === "fasilitator") {
      query = query.ilike("domisili", `%${user.domisili || ""}%`);
    }
    umkmListPromise = query.then(res => res as any);
  }

  const [umkmResult, pendampinganListResult] = await Promise.all([
    umkmListPromise,
    supabaseAdmin
      .from("pendampingan")
      .select(`*, umkm:umkm_id(nama_umkm)`)
      .eq("umkm_id", activeUmkmId)
      .order("tanggal", { ascending: false })
  ]);

  const umkmList = umkmResult.data;
  const pendampinganListRaw = pendampinganListResult.data;

  const pendampinganList = pendampinganListRaw?.map(d => ({
    ...d,
    nama_umkm: d.umkm?.nama_umkm
  })) || [];

  return <PendampinganClient pendampinganList={pendampinganList} umkmList={umkmList || []} user={user} activeUmkmId={activeUmkmId!} />;
}
