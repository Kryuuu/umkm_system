import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import UMKMProfileClient from "../../UMKMProfileClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function EditDataUMKMPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Normalize role
  let normalizedRole = user.role;
  if (normalizedRole === 'admin' || normalizedRole === 'Admin Staff') {
    normalizedRole = 'Admin';
  } else if (normalizedRole === 'fasilitator') {
    normalizedRole = 'Staff';
  } else if (normalizedRole === 'umkm') {
    normalizedRole = 'Mitra';
  }
  
  if (normalizedRole === 'Mitra') {
      redirect("/dashboard/umkm"); // Mitra should not access this route
  }

  const { id: umkmIdStr } = await params;
  const id = parseInt(umkmIdStr);

  const [umkmRes, prodRes, monRes] = await Promise.all([
    supabaseAdmin.from('umkm').select('*').eq('id', id).single(),
    supabaseAdmin.from('produk').select('*', { count: 'exact', head: true }).eq('umkm_id', id),
    supabaseAdmin.from('monitoring').select('*').eq('umkm_id', id).order('tahun', { ascending: false }).order('bulan', { ascending: false }).limit(1)
  ]);

  const umkm = umkmRes.data;
  const produkCount = prodRes.count || 0;
  const latestMonitoring = monRes.data && monRes.data.length > 0 ? monRes.data[0] : null;

  if (!umkm) {
    return (
      <div className="alert alert-danger">Data UMKM tidak ditemukan di database.</div>
    );
  }

  return (
    <>
      <div className="mb-3">
         <Link href="/dashboard/umkm" className="btn btn-outline-secondary btn-sm rounded-pill shadow-sm">
             <i className="bi bi-arrow-left me-1"></i> Kembali ke Daftar UMKM
         </Link>
      </div>
      <UMKMProfileClient 
        umkm={umkm} 
        produkCount={produkCount} 
        latestMonitoring={latestMonitoring}
        isAdmin={true} 
        initialTab="edit"
      />
    </>
  );
}
