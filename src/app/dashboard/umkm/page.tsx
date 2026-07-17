import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import UMKMProfileClient from "./UMKMProfileClient";
import { fetchScoringRules } from "@/lib/scoring";

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

  // If role is umkm, fetch their detailed profile and parameters
  if (user.role === 'Mitra') {
    const activeUmkmId = user.umkm_id || user.id;
    const [umkmRes, prodRes, monRes, pelatihanRes, kehadiranRes] = await Promise.all([
      supabaseAdmin.from('umkm').select('*').eq('id', activeUmkmId).single(),
      supabaseAdmin.from('produk').select('*', { count: 'exact', head: true }).eq('umkm_id', activeUmkmId),
      supabaseAdmin.from('monitoring').select('*').eq('umkm_id', activeUmkmId).order('tahun', { ascending: false }).order('bulan', { ascending: false }).limit(1),
      supabaseAdmin.from('pelatihan').select('*').order('tanggal', { ascending: true }),
      supabaseAdmin.from('kehadiran_pelatihan').select('*').eq('umkm_id', activeUmkmId)
    ]);

    const umkm = umkmRes.data;
    const produkCount = prodRes.count || 0;
    const latestMonitoring = monRes.data && monRes.data.length > 0 ? monRes.data[0] : null;
    const pelatihanList = pelatihanRes.data || [];
    const kehadiranList = kehadiranRes.data || [];

    if (!umkm) {
      return (
        <div className="alert alert-danger">Data UMKM Anda tidak ditemukan di database.</div>
      );
    }

    // Fetch Scoring Rules to compute breakdown accurately
    const rules = await fetchScoringRules();
    function getRuleInfo(value: number, catRules: any[] | undefined) {
      if (!catRules) return { score: 0, desc: "Belum ada aturan", max: 0 };
      let score = 0;
      let desc = "Belum memenuhi kriteria";
      let max = catRules[0]?.max_poin || 100;
      const sortedRules = [...catRules].sort((a, b) => Number(b.kondisi_min) - Number(a.kondisi_min));
      const highestRule = sortedRules[0];
      if (highestRule && highestRule.kondisi_max === null && value > Number(highestRule.kondisi_min) && Number(highestRule.kondisi_min) > 0) {
        const scale = value / Number(highestRule.kondisi_min);
        score = Math.floor(scale * Number(highestRule.poin));
        desc = highestRule.label + " (Proporsional)";
        return { score, desc, max };
      }
      for (const rule of catRules) {
        const min = Number(rule.kondisi_min) || 0;
        const rMax = rule.kondisi_max != null ? Number(rule.kondisi_max) : null;
        if (value >= min && (rMax === null || value < rMax)) {
          score = Number(rule.poin) || 0;
          desc = rule.label;
          break;
        }
      }
      return { score, desc, max };
    }

    const currentDate = new Date();
    const indonesianMonths = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonthName = indonesianMonths[currentDate.getMonth()];
    const isCurrentMonth = latestMonitoring && latestMonitoring.bulan === currentMonthName && latestMonitoring.tahun === currentDate.getFullYear();
    const omzetValue = isCurrentMonth ? (latestMonitoring?.omzet || 0) : 0;
    const omzetInfo = getRuleInfo(omzetValue, rules.omzet);
    
    const dynamicBreakdown = {
      omzet: { score: omzetInfo.score, max: omzetInfo.max, value: omzetValue, desc: omzetInfo.desc }
    };

    return (
      <UMKMProfileClient 
        umkm={umkm} 
        produkCount={produkCount} 
        latestMonitoring={latestMonitoring}
        pelatihanList={pelatihanList}
        kehadiranList={kehadiranList}
        dynamicBreakdown={dynamicBreakdown}
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
