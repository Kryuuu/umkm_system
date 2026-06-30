import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import UMKMProfileClient from "./UMKMProfileClient";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function DataUMKMPage() {
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

  // If role is umkm, fetch their detailed profile and parameters
  if (user.role === 'umkm') {
    const activeUmkmId = user.umkm_id || user.id;
    const [umkmRes, prodRes, monRes] = await Promise.all([
      supabaseAdmin.from('umkm').select('*').eq('id', activeUmkmId).single(),
      supabaseAdmin.from('produk').select('*', { count: 'exact', head: true }).eq('umkm_id', activeUmkmId),
      supabaseAdmin.from('monitoring').select('*').eq('umkm_id', activeUmkmId).order('tahun', { ascending: false }).order('bulan', { ascending: false }).limit(1)
    ]);

    const umkm = umkmRes.data;
    const produkCount = prodRes.count || 0;
    const latestMonitoring = monRes.data && monRes.data.length > 0 ? monRes.data[0] : null;

    if (!umkm) {
      return (
        <div className="alert alert-danger">Data UMKM Anda tidak ditemukan di database.</div>
      );
    }

    return (
      <UMKMProfileClient 
        umkm={umkm} 
        produkCount={produkCount} 
        latestMonitoring={latestMonitoring} 
      />
    );
  }

  // Admin & Fasilitator list view
  const { data: umkmList } = await supabaseAdmin.from('umkm').select('*').order('id', { ascending: true });

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
              <h5 className="fw-bold mb-1">Data UMKM Binaan</h5>
              <p className="text-muted fs-sm mb-0">Kelola dan lengkapi data detail UMKM</p>
          </div>
      </div>

      <div className="panel">
          <div className="panel-body p-0">
              <div className="table-responsive p-3">
                  <table className="table-custom data-table" style={{width:'100%'}}>
                      <thead>
                          <tr>
                              <th>ID</th>
                              <th>Nama UMKM</th>
                              <th>Pemilik</th>
                              <th>Telepon</th>
                              <th>Email</th>
                              <th>Domisili</th>
                              <th>Alamat</th>
                              <th>NIB</th>
                              <th>Status</th>
                              <th>Skor</th>
                              <th>Aksi</th>
                          </tr>
                      </thead>
                      <tbody>
                          {umkmList?.map((u: any) => {
                              const statusClass = 'badge-' + (u.status_usaha || '').toLowerCase().replace(/ /g, '-');
                              return (
                                  <tr key={u.id}>
                                      <td><span className="badge bg-primary bg-opacity-10 text-primary fw-bold">{u.id}</span></td>
                                      <td><strong>{u.nama_umkm}</strong></td>
                                      <td>{u.nama_pemilik}</td>
                                      <td>{u.no_telpon || '-'}</td>
                                      <td>{u.email || '-'}</td>
                                      <td>{u.domisili || '-'}</td>
                                      <td className="text-truncate" style={{maxWidth: '150px'}} title={u.alamat || '-'}>{u.alamat || '-'}</td>
                                      <td>{u.nib || '-'}</td>
                                      <td><span className={`badge-status ${statusClass}`}>{u.status_usaha}</span></td>
                                      <td>
                                          <Link href={`/dashboard/umkm/analisis/${u.id}`} className="text-decoration-none" title="Lihat Analisis Skor">
                                              <strong className="text-primary bg-primary bg-opacity-10 px-2 py-1 rounded">
                                                  {Number(u.skor_usaha || 0).toLocaleString('id-ID')} <i className="bi bi-search" style={{fontSize:'0.75rem'}}></i>
                                              </strong>
                                          </Link>
                                      </td>
                                      <td>
                                          <div className="d-flex gap-2 justify-content-center">
                                              <Link href={`/dashboard/umkm/analisis/${u.id}`} className="btn-info-custom btn-table-action" title="Analisis Skor">
                                                  <i className="bi bi-clipboard-data"></i>
                                              </Link>
                                              <Link href={`/dashboard/umkm/edit/${u.id}`} className="btn-warning-custom btn-table-action" title="Lengkapi Data / Edit">
                                                  <i className="bi bi-pencil"></i>
                                              </Link>
                                              <button className="btn-danger-custom btn-table-action" title="Hapus">
                                                  <i className="bi bi-trash"></i>
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>
    </>
  );
}
