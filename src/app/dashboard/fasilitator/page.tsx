import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import FasilClient from "./FasilClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function FasilitatorPage() {
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

  // Fetch current user data
  const { data: fasilitator } = await supabaseAdmin.from('fasilitator').select('*').eq('id', user.id).single();
  if (!fasilitator) {
    // maybe umkm trying to access? Redirect.
    redirect("/dashboard");
  }

  let allFasilitator = [];
  if (user.role === 'admin') {
    const { data } = await supabaseAdmin.from('fasilitator').select('*').order('id', { ascending: true });
    allFasilitator = data || [];
  }

  const DOMISILI_KALSEL = [
      'Kota Banjarmasin', 'Kota Banjarbaru', 'Kabupaten Banjar', 'Kabupaten Barito Kuala',
      'Kabupaten Tapin', 'Kabupaten Hulu Sungai Selatan', 'Kabupaten Hulu Sungai Tengah',
      'Kabupaten Hulu Sungai Utara', 'Kabupaten Balangan', 'Kabupaten Tabalong',
      'Kabupaten Tanah Laut', 'Kabupaten Tanah Bumbu', 'Kabupaten Kotabaru'
  ];

  return <FasilClient 
    fasilitator={fasilitator} 
    allFasilitator={allFasilitator} 
    user={user} 
    domisiliKalsel={DOMISILI_KALSEL}
  />;
}
