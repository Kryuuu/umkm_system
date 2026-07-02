import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PenjualanClient from "./PenjualanClient";
import SelectUmkmClient from "@/components/SelectUmkmClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function PenjualanPage({
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

  const isUmkmUser = user.role === "Mitra";
  const activeUmkmId = isUmkmUser ? (user.umkm_id || user.id) : (umkm_id ? parseInt(umkm_id) : null);

  // For Admin & Facilitator: if no umkm_id is selected, show UMKM Selection Screen
  if (!isUmkmUser && !activeUmkmId) {
    let umkmListQuery = supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik");
    if (user.role === "Staff") {
      umkmListQuery = umkmListQuery.ilike("domisili", `%${user.domisili || ""}%`);
    }
    const { data: umkmList } = await umkmListQuery;
    return (
      <SelectUmkmClient
        umkmList={umkmList || []}
        targetPage="penjualan"
        targetLabel="data penjualan"
        user={user}
      />
    );
  }

  // Fetch list of UMKM in parallel only if needed, along with products and sales
  let umkmListPromise: any = Promise.resolve({ data: [] as any[] });
  if (!isUmkmUser) {
    let query = supabaseAdmin.from("umkm").select("id, nama_umkm, nama_pemilik");
    if (user.role === "Staff") {
      query = query.ilike("domisili", `%${user.domisili || ""}%`);
    }
    umkmListPromise = query.then(res => res as any);
  }

  const [umkmResult, produkResult, penjualanResult] = await Promise.all([
    umkmListPromise,
    supabaseAdmin
      .from("produk")
      .select("id, nama_produk, harga_produk, umkm_id")
      .eq("umkm_id", activeUmkmId),
    supabaseAdmin
      .from("penjualan")
      .select(`*, umkm:umkm_id(nama_umkm), produk:produk_id(nama_produk)`)
      .eq("umkm_id", activeUmkmId)
      .order("tanggal", { ascending: false })
  ]);

  const umkmList = umkmResult.data;
  const produkListRaw = produkResult.data;
  const penjualanListRaw = penjualanResult.data;

  const penjualanList = penjualanListRaw?.map(s => ({
    ...s,
    nama_umkm: s.umkm?.nama_umkm,
    nama_produk: s.produk?.nama_produk
  })) || [];

  return (
    <PenjualanClient
      penjualanList={penjualanList}
      umkmList={umkmList || []}
      produkList={produkListRaw || []}
      user={user}
      activeUmkmId={activeUmkmId!}
    />
  );
}
