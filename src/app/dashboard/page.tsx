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

  const isAdmin = user.role === 'Admin' || user.role === 'Staff';

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

  let activeUmkmId: any = null;
  let activeUmkmData: any = null;
  let personalMonitoring: any[] = [];
  let personalProductCount = 0;
  let personalProducts: any[] = [];
  let upcomingPelatihan: any[] = [];

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
    activeUmkmId = user.umkm_id || user.id;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const [umkmRes, monRes, prodRes, leaderboardRes, upcomingRes] = await Promise.all([
      supabaseAdmin.from('umkm').select('*').eq('id', activeUmkmId).single(),
      supabaseAdmin.from('monitoring').select('*').eq('umkm_id', activeUmkmId).order('tahun', { ascending: false }).order('bulan', { ascending: false }),
      supabaseAdmin.from('produk').select('*').eq('umkm_id', activeUmkmId).order('id', { ascending: false }),
      supabaseAdmin.from('umkm').select('id, nama_umkm, nama_pemilik, skor_usaha, status_usaha').order('skor_usaha', { ascending: false }).limit(3),
      supabaseAdmin.from('pelatihan').select('*').gte('tanggal', thirtyDaysAgoStr).order('tanggal', { ascending: true }).limit(5)
    ]);

    activeUmkmData = umkmRes.data;
    personalMonitoring = monRes.data || [];
    personalProducts = prodRes.data || [];
    personalProductCount = personalProducts.length;
    leaderboard = leaderboardRes.data || [];
    upcomingPelatihan = upcomingRes.data || [];
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
            <div className="panel-body p-4 p-md-5 position-relative z-index-1 d-flex flex-column flex-md-row justify-content-between align-items-center align-items-md-center gap-4">
              <div className="text-center text-md-start">
                <h3 className="fw-bold mb-2">Selamat Datang, {user.name}! 👋</h3>
                <p className="mb-0 text-white-50 fs-6 fs-md-5">Pantau terus perkembangan usahamu dan raih target skor go-global bulan ini.</p>
              </div>
              <div className="text-center p-3 rounded-4 border border-white border-opacity-25 flex-shrink-0" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", minWidth: "220px", maxWidth: "100%" }}>
                  <div className="fs-xs text-white-50 mb-1 fw-bold tracking-wide">STATUS SKALA USAHA</div>
                  <div className="fs-4 fw-bold text-white">{activeUmkmData?.status_usaha || 'Pemula'}</div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
              {/* Kolom Kiri (Data & Trend) */}
              <div className="col-xl-8">
                  <div className="row g-3 mb-4">
                      <div className="col-6 col-md-3">
                          <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column flex-sm-row align-items-center text-center text-sm-start gap-2 gap-sm-3">
                              <div className="text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "50px", height: "50px", fontSize: "1.5rem", background: "rgba(79, 70, 229, 0.1)" }}>
                                  <i className="bi bi-star-fill"></i>
                              </div>
                              <div>
                                  <div className="fs-xs fw-bold text-muted tracking-wide mb-1">SKOR USAHA</div>
                                  <h4 className="fw-bold text-primary mb-0">{Math.round(activeUmkmData?.skor_usaha || 0)} <span className="fs-xs fw-normal text-muted">/ 100</span></h4>
                              </div>
                          </div>
                      </div>
                      <div className="col-6 col-md-3">
                          <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column flex-sm-row align-items-center text-center text-sm-start gap-2 gap-sm-3">
                              <div className="text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "50px", height: "50px", fontSize: "1.5rem", background: "rgba(16, 185, 129, 0.1)" }}>
                                  <i className="bi bi-cash-coin"></i>
                              </div>
                              <div>
                                  <div className="fs-xs fw-bold text-muted tracking-wide mb-1">OMZET TERBARU</div>
                                  <h4 className="fw-bold text-success mb-0" style={{ fontSize: "clamp(0.85rem, 3.5vw, 1.25rem)" }}>
                                      Rp {personalMonitoring.length > 0 ? Number(personalMonitoring[0].omzet || 0).toLocaleString('id-ID') : '0'}
                                  </h4>
                              </div>
                          </div>
                      </div>
                      <div className="col-6 col-md-3">
                          <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column flex-sm-row align-items-center text-center text-sm-start gap-2 gap-sm-3">
                              <div className="text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "50px", height: "50px", fontSize: "1.5rem", background: "rgba(245, 158, 11, 0.1)" }}>
                                  <i className="bi bi-box-seam"></i>
                              </div>
                              <div>
                                  <div className="fs-xs fw-bold text-muted tracking-wide mb-1">PRODUK KOLEKSI</div>
                                  <h4 className="fw-bold text-warning mb-0">{personalProductCount} <span className="fs-xs fw-normal text-muted">item</span></h4>
                              </div>
                          </div>
                      </div>
                      <div className="col-6 col-md-3">
                          <Link href="/dashboard/pelatihan/scan" className="text-decoration-none">
                              <div className="panel border-0 shadow-sm rounded-4 h-100 p-3 d-flex flex-column flex-sm-row align-items-center text-center text-sm-start gap-2 gap-sm-3 hover-elevate" style={{ background: 'linear-gradient(135deg, #4f46e5, #9333ea)', color: 'white', cursor: 'pointer' }}>
                                  <div className="text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "50px", height: "50px", fontSize: "1.5rem", background: "rgba(255, 255, 255, 0.2)" }}>
                                      <i className="bi bi-qr-code-scan"></i>
                                  </div>
                                  <div>
                                      <div className="fs-xs fw-bold text-white-50 tracking-wide mb-1">ABSENSI</div>
                                      <h5 className="fw-bold text-white mb-0 d-flex align-items-center justify-content-center justify-content-sm-start" style={{ fontSize: "clamp(0.85rem, 3.5vw, 1.1rem)" }}>
                                          Scan QR <i className="bi bi-arrow-right-short ms-1"></i>
                                      </h5>
                                  </div>
                              </div>
                          </Link>
                      </div>
                  </div>

                  <UMKMCharts monitoringData={personalMonitoring} />

                  {/* Produk Terbaru */}
                  <div className="panel border-0 shadow-sm rounded-4 mt-4">
                      <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-0 d-flex justify-content-between align-items-center">
                          <h5 className="fw-bold mb-0 text-dark"><i className="bi bi-stars text-warning me-2"></i> Produk Terbaru</h5>
                          <Link href="/dashboard/produk" className="btn btn-sm btn-outline-primary rounded-pill px-3">Kelola</Link>
                      </div>
                      <div className="panel-body p-3 p-md-4">
                          <div className="table-responsive">
                              <table className="table table-borderless align-middle mb-0">
                                  <thead className="border-bottom">
                                      <tr>
                                          <th className="text-muted fs-xs fw-bold">NAMA PRODUK</th>
                                          <th className="text-muted fs-xs fw-bold">KATEGORI</th>
                                          <th className="text-muted fs-xs fw-bold text-end">HARGA</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {personalProducts.length === 0 ? (
                                          <tr><td colSpan={3} className="text-center text-muted py-4">Belum ada produk.</td></tr>
                                      ) : (
                                          personalProducts.slice(0, 4).map((p) => (
                                              <tr key={p.id}>
                                                  <td className="fw-bold text-dark">{p.nama_produk}</td>
                                                  <td><span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">{p.kategori_produk}</span></td>
                                                  <td className="fw-bold text-end text-dark">Rp {Number(p.harga_produk || 0).toLocaleString('id-ID')}</td>
                                              </tr>
                                          ))
                                      )}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Kolom Kanan (Action & Info) */}
              <div className="col-xl-4">
                  {/* AI Recommendation & Progress */}
                  <div className="panel border-0 shadow-sm rounded-4 mb-4" style={{ background: "linear-gradient(180deg, var(--bg-card) 0%, rgba(79,70,229,0.03) 100%)" }}>
                      <div className="panel-body p-3 p-md-4 text-center">
                          <div className="position-relative d-inline-block mb-3" style={{ width: "120px", height: "120px" }}>
                              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
                                  <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${Math.round(activeUmkmData?.skor_usaha || 0)}, 100`} />
                              </svg>
                              <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
                                  <div className="fs-4 fw-bold text-primary">{Math.round(activeUmkmData?.skor_usaha || 0)}%</div>
                              </div>
                          </div>
                          <h6 className="fw-bold mb-1 text-dark">Progress Menuju Go Global</h6>
                          <p className="fs-sm text-muted mb-4">Selesaikan tugas dari AI untuk mencapai skor 100%.</p>
                          
                          <div className="text-start p-3 rounded-3 border shadow-sm mb-3 position-relative" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
                              <span className="position-absolute top-0 start-50 translate-middle badge rounded-pill bg-warning text-black"><i className="bi bi-robot"></i> Pesan AI</span>
                              <p className="fs-sm mb-0 mt-2" style={{ lineHeight: "1.5", color: "var(--text-main)" }}>
                                  {activeUmkmData?.rekomendasi || 'Belum ada rekomendasi. Analisis diperlukan.'}
                              </p>
                          </div>
                          
                          <Link href={`/dashboard/umkm/learnbook/${activeUmkmId}`} className="btn-primary-custom w-100 rounded-pill py-2 text-decoration-none d-block">
                              <i className="bi bi-journal-text me-2"></i> Buka Learn Book
                          </Link>
                      </div>
                  </div>

                  {/* Leaderboard Mini */}
                  <div className="panel border-0 shadow-sm rounded-4 mb-4">
                      <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2">
                          <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-trophy-fill text-warning me-2"></i> Leaderboard Top 3</h6>
                      </div>
                      <div className="panel-body p-3 pt-2 p-md-4 pt-md-2">
                          <div className="d-flex flex-column gap-3">
                              {leaderboard.map((item, idx) => {
                                  const isMe = item.id === activeUmkmId;
                                  const medal = ['🥇','🥈','🥉'][idx] || `${idx + 1}`;
                                  return (
                                      <div key={item.id} className={`d-flex align-items-center justify-content-between p-2 rounded-3 ${isMe ? 'bg-primary bg-opacity-10 border border-primary border-opacity-25' : 'border'}`}>
                                          <div className="d-flex align-items-center gap-2">
                                              <div className="fs-4">{medal}</div>
                                              <div>
                                                  <h6 className="mb-0 fw-bold fs-sm text-dark">{item.nama_umkm}</h6>
                                                  {isMe && <span className="badge bg-primary fs-xs px-2 py-1">ANDA</span>}
                                              </div>
                                          </div>
                                          <div className="fw-bold text-dark fs-6">{Math.round(item.skor_usaha || 0)}</div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  </div>

                  {/* Jadwal Pelatihan Vertical */}
                  <div className="panel border-0 shadow-sm rounded-4">
                      <div className="panel-header border-bottom-0 pt-3 px-3 pt-md-4 px-md-4 pb-2 d-flex justify-content-between align-items-center">
                          <h6 className="fw-bold mb-0 text-dark"><i className="bi bi-calendar-event text-info me-2"></i> Acara Terdekat</h6>
                      </div>
                      <div className="panel-body p-3 pt-2 p-md-4 pt-md-2">
                          {upcomingPelatihan.length === 0 ? (
                              <div className="text-center text-muted p-3 border rounded-3 fs-sm bg-light">Belum ada jadwal</div>
                          ) : (
                              <div className="position-relative border-start border-2 ms-3 ps-3 pb-2">
                                  {upcomingPelatihan.map((p) => {
                                      const today = new Date().toISOString().split('T')[0];
                                      const eventDate = p.tanggal;
                                      let statusText = 'Akan Datang';
                                      let statusColor = 'primary';
                                      if (eventDate < today) {
                                          statusText = 'Selesai';
                                          statusColor = 'success';
                                      } else if (eventDate === today) {
                                          statusText = 'Berjalan';
                                          statusColor = 'warning';
                                      }
                                      return (
                                          <div className="mb-4 position-relative" key={p.id}>
                                              <div className={`position-absolute bg-${statusColor} rounded-circle shadow-sm`} style={{ width: '14px', height: '14px', left: '-25px', top: '3px', border: '2px solid var(--bg-card)' }}></div>
                                              <div className="d-flex justify-content-between align-items-center mb-1">
                                                  <h6 className="fw-bold mb-0 fs-sm text-dark">{p.nama_pelatihan}</h6>
                                                  <span className={`badge bg-${statusColor} bg-opacity-10 text-${statusColor} fs-xs rounded-pill px-2`}>{statusText}</span>
                                              </div>
                                              <div className="fs-xs text-muted d-flex align-items-center gap-2 mb-1">
                                                  <i className={`bi bi-clock text-${statusColor}`}></i> {new Date(p.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                              </div>
                                              <div className="fs-xs text-muted d-flex align-items-center gap-2">
                                                  <i className="bi bi-geo-alt text-danger"></i> <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>{p.lokasi}</span>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
        </>
      )}
    </>
  );
}
