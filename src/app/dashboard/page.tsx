import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import AdminCharts from "@/components/AdminCharts";
import UMKMCharts from "@/components/UMKMCharts";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function DashboardPage() {
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

  const isAdmin = user.role === 'admin' || user.role === 'fasilitator';

  // Fetch statistics and datasets in parallel based on user role
  let totalUmkm = 0;
  let totalProduk = 0;
  let totalPelatihan = 0;
  let totalPendampingan = 0;

  let totalOmzet = 0;
  let serapanTenagaKerja = 0;
  let jangkauanPelanggan = 0;

  let chartData: any[] = [];
  let kategoriData: any[] = [];
  let growthData: any[] = [];
  let leaderboard: any[] = [];

  let activeUmkmData: any = null;
  let personalMonitoring: any[] = [];
  let personalProductCount = 0;

  const monthToNum: Record<string, number> = {
    'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
    'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
  };

  if (isAdmin) {
    const [
      totalUmkmRes,
      totalProdukRes,
      totalPelatihanRes,
      totalPendampinganRes,
      monitoringRes,
      produkRes,
      leaderboardRes
    ] = await Promise.all([
      supabaseAdmin.from('umkm').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('produk').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('pelatihan').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('pendampingan').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('monitoring').select('umkm_id, omzet, jumlah_tenaga_kerja, jumlah_pelanggan, bulan, tahun, umkm:umkm_id(nama_umkm)'),
      supabaseAdmin.from('produk').select('umkm_id, kategori_produk'),
      supabaseAdmin.from('umkm').select('id, nama_umkm, nama_pemilik, skor_usaha, status_usaha').order('skor_usaha', { ascending: false })
    ]);

    totalUmkm = totalUmkmRes.count || 0;
    totalProduk = totalProdukRes.count || 0;
    totalPelatihan = totalPelatihanRes.count || 0;
    totalPendampingan = totalPendampinganRes.count || 0;

    const allMonitoring = monitoringRes.data || [];
    const allProduk = produkRes.data || [];
    const leaderboardRaw = leaderboardRes.data || [];

    // Sum all omzet
    allMonitoring.forEach(m => {
      totalOmzet += Number(m.omzet || 0);
    });

    // Sum current workforce and customer capacity (using the latest record per UMKM)
    const latestUmkmMon: Record<number, any> = {};
    allMonitoring.forEach(m => {
      const existing = latestUmkmMon[m.umkm_id];
      if (!existing) {
        latestUmkmMon[m.umkm_id] = m;
      } else {
        const existingScore = (existing.tahun * 12) + (monthToNum[(existing.bulan || '').toLowerCase()] || 0);
        const currentScore = (m.tahun * 12) + (monthToNum[(m.bulan || '').toLowerCase()] || 0);
        if (currentScore > existingScore) {
          latestUmkmMon[m.umkm_id] = m;
        }
      }
    });

    Object.values(latestUmkmMon).forEach((m: any) => {
      serapanTenagaKerja += m.jumlah_tenaga_kerja || 0;
      jangkauanPelanggan += m.jumlah_pelanggan || 0;
    });

    // Map chartData: [{ nama_umkm, bulan, omzet }]
    chartData = allMonitoring.map(m => {
      const umkmObj: any = m.umkm;
      const nama = (Array.isArray(umkmObj) ? umkmObj[0]?.nama_umkm : umkmObj?.nama_umkm) || 'UMKM Binaan';
      return {
        nama_umkm: nama,
        bulan: `${m.bulan} ${m.tahun}`,
        omzet: Number(m.omzet || 0)
      };
    });

    // Map kategoriData: [{ kategori_produk, total }]
    const catMap: Record<string, number> = {};
    allProduk.forEach(p => {
      const cat = p.kategori_produk || "Lainnya";
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    kategoriData = Object.keys(catMap).map(k => ({
      kategori_produk: k,
      total: catMap[k]
    }));

    // Map growthData: [{ bulan, total_tk, total_pelanggan }] sorted chronologically
    const periodMap: Record<string, { orderKey: number; total_tk: number; total_pelanggan: number }> = {};
    allMonitoring.forEach(m => {
      const key = `${m.bulan} ${m.tahun}`;
      const mNum = monthToNum[(m.bulan || '').toLowerCase()] || 0;
      const orderKey = (m.tahun * 12) + mNum;
      if (!periodMap[key]) {
        periodMap[key] = { orderKey, total_tk: 0, total_pelanggan: 0 };
      }
      periodMap[key].total_tk += m.jumlah_tenaga_kerja || 0;
      periodMap[key].total_pelanggan += m.jumlah_pelanggan || 0;
    });
    growthData = Object.keys(periodMap)
      .map(key => ({
        bulan: key,
        orderKey: periodMap[key].orderKey,
        total_tk: periodMap[key].total_tk,
        total_pelanggan: periodMap[key].total_pelanggan
      }))
      .sort((a, b) => a.orderKey - b.orderKey);

    // Map leaderboard: attach total_omzet and total_produk counts
    const omzetMap: Record<number, number> = {};
    allMonitoring.forEach(m => {
      omzetMap[m.umkm_id] = (omzetMap[m.umkm_id] || 0) + Number(m.omzet || 0);
    });

    const produkCountMap: Record<number, number> = {};
    allProduk.forEach(p => {
      produkCountMap[p.umkm_id] = (produkCountMap[p.umkm_id] || 0) + 1;
    });

    leaderboard = leaderboardRaw.map(u => ({
      ...u,
      total_omzet: omzetMap[u.id] || 0,
      total_produk: produkCountMap[u.id] || 0
    }));
  } else {
    // For UMKM user
    const activeUmkmId = user.umkm_id || user.id;
    const [umkmRes, monRes, prodRes] = await Promise.all([
      supabaseAdmin.from('umkm').select('*').eq('id', activeUmkmId).single(),
      supabaseAdmin.from('monitoring').select('*').eq('umkm_id', activeUmkmId).order('tahun', { ascending: false }).order('bulan', { ascending: false }),
      supabaseAdmin.from('produk').select('*', { count: 'exact', head: true }).eq('umkm_id', activeUmkmId)
    ]);
    activeUmkmData = umkmRes.data;
    personalMonitoring = monRes.data || [];
    personalProductCount = prodRes.count || 0;
  }

  return (
    <>
      {isAdmin ? (
        <>
          <div className="panel border-0 shadow-sm rounded-4 mb-4" style={{ background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "white", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-5%", top: "-50%", width: "300px", height: "300px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(40px)" }}></div>
            <div className="panel-body p-4 p-md-5 position-relative z-index-1">
              <h3 className="fw-bold mb-2">Pusat Kendali Eksekutif 🚀</h3>
              <p className="mb-0 text-white-50 fs-5">Pantau pertumbuhan dan pergerakan seluruh UMKM Binaan secara real-time.</p>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="panel border-0 shadow-sm rounded-4 h-100" style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", transition: "transform 0.2s" }}>
                <div className="panel-body p-4 d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.2)", width: "60px", height: "60px", fontSize: "1.8rem" }}>
                    <i className="bi bi-cash-stack"></i>
                  </div>
                  <div>
                    <div className="fs-xs fw-bold text-white-50 tracking-wide mb-1">TOTAL OMZET KESELURUHAN</div>
                    <h3 className="fw-bold mb-0">Rp {totalOmzet.toLocaleString('id-ID')}</h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="panel border-0 shadow-sm rounded-4 h-100" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "white", transition: "transform 0.2s" }}>
                <div className="panel-body p-4 d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.2)", width: "60px", height: "60px", fontSize: "1.8rem" }}>
                    <i className="bi bi-person-workspace"></i>
                  </div>
                  <div>
                    <div className="fs-xs fw-bold text-white-50 tracking-wide mb-1">SERAPAN TENAGA KERJA</div>
                    <h3 className="fw-bold mb-0">{serapanTenagaKerja} <span className="fs-6 fw-normal text-white-50">orang</span></h3>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="panel border-0 shadow-sm rounded-4 h-100" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "white", transition: "transform 0.2s" }}>
                <div className="panel-body p-4 d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ background: "rgba(255,255,255,0.2)", width: "60px", height: "60px", fontSize: "1.8rem" }}>
                    <i className="bi bi-people"></i>
                  </div>
                  <div>
                    <div className="fs-xs fw-bold text-white-50 tracking-wide mb-1">JANGKAUAN PELANGGAN</div>
                    <h3 className="fw-bold mb-0">{jangkauanPelanggan} <span className="fs-6 fw-normal text-white-50">orang</span></h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-xl-3 col-sm-6">
              <div className="panel border-0 shadow-sm rounded-4 text-center p-3 h-100 hover-elevate">
                <div className="text-primary fs-1 mb-2"><i className="bi bi-shop"></i></div>
                <h4 className="fw-bold mb-0">{totalUmkm || 0}</h4>
                <div className="fs-sm text-muted">UMKM Binaan</div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="panel border-0 shadow-sm rounded-4 text-center p-3 h-100 hover-elevate">
                <div className="text-success fs-1 mb-2"><i className="bi bi-box-seam"></i></div>
                <h4 className="fw-bold mb-0">{totalProduk || 0}</h4>
                <div className="fs-sm text-muted">Total Produk</div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="panel border-0 shadow-sm rounded-4 text-center p-3 h-100 hover-elevate">
                <div className="text-warning fs-1 mb-2"><i className="bi bi-mortarboard"></i></div>
                <h4 className="fw-bold mb-0">{totalPelatihan || 0}</h4>
                <div className="fs-sm text-muted">Pelatihan & Kegiatan</div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6">
              <div className="panel border-0 shadow-sm rounded-4 text-center p-3 h-100 hover-elevate">
                <div className="text-info fs-1 mb-2"><i className="bi bi-headset"></i></div>
                <h4 className="fw-bold mb-0">{totalPendampingan || 0}</h4>
                <div className="fs-sm text-muted">Sesi Pendampingan</div>
              </div>
            </div>
          </div>
          
          <AdminCharts chartData={chartData} kategoriData={kategoriData} growthData={growthData} leaderboard={leaderboard} />
        </>
      ) : (
        <>
          <div className="panel border-0 shadow-sm rounded-4 mb-4" style={{ background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "white", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-5%", top: "-50%", width: "300px", height: "300px", background: "rgba(255,255,255,0.1)", borderRadius: "50%", filter: "blur(40px)" }}></div>
            <div className="panel-body p-4 p-md-5 position-relative z-index-1 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">
              <div>
                <h3 className="fw-bold mb-2">Selamat Datang, {user.name}! 👋</h3>
                <p className="mb-0 text-white-50 fs-5">Pantau terus perkembangan usahamu dan raih target skor go-global bulan ini.</p>
              </div>
              <div className="text-center p-3 rounded-4 border border-white border-opacity-25" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", minWidth: "220px" }}>
                  <div className="fs-xs text-white-50 mb-1 fw-bold tracking-wide">STATUS SKALA USAHA</div>
                  <div className="fs-4 fw-bold text-white">{activeUmkmData?.status_usaha || 'Pemula'}</div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
              <div className="col-xl-8">
                  <div className="row g-3 mb-4">
                      <div className="col-md-3">
                          <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex align-items-center gap-3">
                              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px", fontSize: "1.5rem" }}>
                                  <i className="bi bi-star-fill"></i>
                              </div>
                              <div>
                                  <div className="fs-xs fw-bold text-muted tracking-wide mb-1">SKOR USAHA</div>
                                  <h4 className="fw-bold text-primary mb-0">{Math.round(activeUmkmData?.skor_usaha || 0)} <span className="fs-sm fw-normal text-muted">/ 100</span></h4>
                              </div>
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex align-items-center gap-3">
                              <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px", fontSize: "1.5rem" }}>
                                  <i className="bi bi-cash-coin"></i>
                              </div>
                              <div>
                                  <div className="fs-xs fw-bold text-muted tracking-wide mb-1">OMZET TERBARU</div>
                                  <h4 className="fw-bold text-success mb-0">Rp {personalMonitoring.length > 0 ? Number(personalMonitoring[0].omzet || 0).toLocaleString('id-ID') : '0'}</h4>
                              </div>
                          </div>
                      </div>
                      <div className="col-md-3">
                          <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex align-items-center gap-3">
                              <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px", fontSize: "1.5rem" }}>
                                  <i className="bi bi-box-seam"></i>
                              </div>
                              <div>
                                  <div className="fs-xs fw-bold text-muted tracking-wide mb-1">PRODUK KOLEKSI</div>
                                  <h4 className="fw-bold text-warning mb-0">{personalProductCount} <span className="fs-sm fw-normal text-muted">item</span></h4>
                              </div>
                          </div>
                      </div>
                      <div className="col-md-3">
                          <Link href="/dashboard/pelatihan/scan" className="text-decoration-none">
                              <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex align-items-center gap-3 hover-elevate" style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', color: 'white', cursor: 'pointer' }}>
                                  <div className="bg-white bg-opacity-20 text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: "50px", height: "50px", fontSize: "1.5rem" }}>
                                      <i className="bi bi-qr-code-scan"></i>
                                  </div>
                                  <div>
                                      <div className="fs-xs fw-bold text-white-50 tracking-wide mb-1">ABSENSI</div>
                                      <h5 className="fw-bold text-white mb-0 d-flex align-items-center">Scan QR Code <i className="bi bi-arrow-right-short ms-1"></i></h5>
                                  </div>
                              </div>
                          </Link>
                      </div>
                  </div>

                  <UMKMCharts monitoringData={personalMonitoring} />
              </div>

              {activeUmkmData?.rekomendasi && (
              <div className="col-xl-4">
                  <div className="panel border-0 shadow-sm rounded-4 h-100 p-4" style={{ background: "linear-gradient(135deg, #fff, #f8fafc)", border: "1px solid #e2e8f0" }}>
                      <h5 className="fw-bold text-dark mb-3"><i className="bi bi-chat-left-quote-fill text-primary me-2"></i> Rekomendasi Usaha</h5>
                      <div className="alert alert-info border-0 rounded-3 mb-0 fs-sm" style={{ background: "#eff6ff", color: "#1e40af", lineHeight: "1.6" }}>
                          {activeUmkmData.rekomendasi}
                      </div>
                  </div>
              </div>
              )}
          </div>
        </>
      )}
    </>
  );
}
