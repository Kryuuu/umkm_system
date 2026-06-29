import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import MasterClient from "./MasterClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function MasterUMKMPage() {
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

  if (user.role === 'umkm') {
    redirect("/dashboard");
  }

  const { data: umkmListRaw } = await supabaseAdmin.from('umkm').select('*, fasilitator:fasilitator_id(nickname)').order('id', { ascending: true });
  const { data: fasilitatorList } = await supabaseAdmin.from('fasilitator').select('id, nickname, domisili');

  const umkmList = umkmListRaw?.map(u => ({
      ...u,
      nama_fasilitator: u.fasilitator?.nickname
  })) || [];

  return <MasterClient umkmList={umkmList} fasilitatorList={fasilitatorList || []} />;
}
