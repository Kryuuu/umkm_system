import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || "rahasia-umkm-super-aman-12345");

export default async function AnalisisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: umkmIdStr } = await params;
  const umkmId = parseInt(umkmIdStr);

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

  // Security check: UMKM user can only view their own analysis
  if (user.role === "Mitra" && user.umkm_id !== umkmId && user.id !== umkmId) {
    redirect("/dashboard");
  }

  // Mark all naik_kelas notifications for this user as read
  if (user.role === "Mitra") {
    const myUmkmId = user.umkm_id || user.id;
    await supabaseAdmin
      .from("notifikasi")
      .update({ is_read: true })
      .eq("target_role", "Mitra")
      .eq("target_id", myUmkmId)
      .eq("tipe", "naik_kelas");
  }

  // Fetch UMKM details
  const { data: umkm, error: umkmErr } = await supabaseAdmin
    .from("umkm")
    .select("*")
    .eq("id", umkmId)
    .single();

  if (umkmErr || !umkm) {
    redirect("/dashboard/umkm");
  }

  // Fetch products
  const { data: produk } = await supabaseAdmin
    .from("produk")
    .select("id")
    .eq("umkm_id", umkmId);
  const produkCount = produk?.length || 0;

  // Fetch latest monitoring
  const { data: monitoring } = await supabaseAdmin
    .from("monitoring")
    .select("*")
    .eq("umkm_id", umkmId)
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false })
    .limit(1);

  const latestMonitoring = monitoring && monitoring.length > 0 ? monitoring[0] : null;

  // Calculate breakdown parameters
  const breakdown = {
    omzet: { score: 0, max: 30, value: 0, desc: "Sangat Rendah (< Rp 2 Juta)" },
    produk: { score: 0, max: 20, value: produkCount, desc: "Tidak ada produk" },
    pekerja: { score: 0, max: 15, value: 0, desc: "Tidak ada data tenaga kerja" },
    pelanggan: { score: 0, max: 15, value: 0, desc: "Tidak ada data pelanggan" },
    legalitas: { score: 0, max: 20, value: 0, desc: "Tidak memiliki izin usaha lengkap" }
  };

  // 1. Omzet
  if (latestMonitoring) {
    const omzet = latestMonitoring.omzet || 0;
    breakdown.omzet.value = omzet;
    if (omzet >= 25000000) {
      breakdown.omzet.score = 30;
      breakdown.omzet.desc = "Sangat Tinggi (≥ Rp 25 Juta)";
    } else if (omzet >= 15000000) {
      breakdown.omzet.score = 25;
      breakdown.omzet.desc = "Tinggi (≥ Rp 15 Juta)";
    } else if (omzet >= 10000000) {
      breakdown.omzet.score = 20;
      breakdown.omzet.desc = "Cukup Tinggi (≥ Rp 10 Juta)";
    } else if (omzet >= 5000000) {
      breakdown.omzet.score = 15;
      breakdown.omzet.desc = "Menengah (≥ Rp 5 Juta)";
    } else if (omzet >= 2000000) {
      breakdown.omzet.score = 10;
      breakdown.omzet.desc = "Rendah (≥ Rp 2 Juta)";
    } else {
      breakdown.omzet.score = 5;
      breakdown.omzet.desc = "Sangat Rendah (< Rp 2 Juta)";
    }
  }

  // 2. Produk
  if (produkCount >= 5) {
    breakdown.produk.score = 20;
    breakdown.produk.desc = "Sangat Baik (≥ 5 Produk)";
  } else if (produkCount >= 3) {
    breakdown.produk.score = 15;
    breakdown.produk.desc = "Baik (≥ 3 Produk)";
  } else if (produkCount >= 2) {
    breakdown.produk.score = 10;
    breakdown.produk.desc = "Cukup (≥ 2 Produk)";
  } else if (produkCount >= 1) {
    breakdown.produk.score = 5;
    breakdown.produk.desc = "Kurang (1 Produk)";
  }

  // 3. Pekerja
  if (latestMonitoring) {
    const tk = latestMonitoring.jumlah_tenaga_kerja || 0;
    breakdown.pekerja.value = tk;
    if (tk >= 8) {
      breakdown.pekerja.score = 15;
      breakdown.pekerja.desc = "Sangat Baik (≥ 8 Pekerja)";
    } else if (tk >= 5) {
      breakdown.pekerja.score = 12;
      breakdown.pekerja.desc = "Baik (≥ 5 Pekerja)";
    } else if (tk >= 3) {
      breakdown.pekerja.score = 8;
      breakdown.pekerja.desc = "Cukup (≥ 3 Pekerja)";
    } else if (tk >= 1) {
      breakdown.pekerja.score = 5;
      breakdown.pekerja.desc = "Kurang (1-2 Pekerja)";
    }
  }

  // 4. Pelanggan
  if (latestMonitoring) {
    const pl = latestMonitoring.jumlah_pelanggan || 0;
    breakdown.pelanggan.value = pl;
    if (pl >= 200) {
      breakdown.pelanggan.score = 15;
      breakdown.pelanggan.desc = "Jangkauan Luas (≥ 200 Pelanggan)";
    } else if (pl >= 100) {
      breakdown.pelanggan.score = 12;
      breakdown.pelanggan.desc = "Jangkauan Menengah (≥ 100 Pelanggan)";
    } else if (pl >= 50) {
      breakdown.pelanggan.score = 8;
      breakdown.pelanggan.desc = "Jangkauan Cukup (≥ 50 Pelanggan)";
    } else if (pl >= 20) {
      breakdown.pelanggan.score = 5;
      breakdown.pelanggan.desc = "Jangkauan Terbatas (≥ 20 Pelanggan)";
    }
  }

  // 5. Legalitas
  const legals: string[] = [];
  if (umkm.nib) {
    breakdown.legalitas.score += 7;
    legals.push("NIB");
  }
  if (umkm.sertifikat_halal) {
    breakdown.legalitas.score += 7;
    legals.push("Halal");
  }
  if (umkm.sertifikat_pirt) {
    breakdown.legalitas.score += 6;
    legals.push("PIRT");
  }
  breakdown.legalitas.value = legals.length;
  if (legals.length > 0) {
    breakdown.legalitas.desc = "Memiliki izin: " + legals.join(", ");
  }

  const totalScore = umkm.skor_usaha || 0;
  const statusClass = "badge-" + (umkm.status_usaha || "Go Modern").toLowerCase().replace(/\s+/g, "-");

  return (
    <>
      <div className="content-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link href="/dashboard/umkm" className="text-muted text-decoration-none mb-2 d-inline-block">
            <i className="bi bi-arrow-left"></i> Kembali ke Daftar UMKM
          </Link>
          <h4 className="mb-1">
            <i className="bi bi-clipboard-data text-primary me-2"></i> Analisis Detail Skor UMKM
          </h4>
          <p className="text-muted mb-0">Rincian parameter penilaian dan klasifikasi skala usaha</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Kolom Kiri: Profil & Rekomendasi */}
        <div className="col-lg-4">
          {/* Profil Singkat */}
          <div className="panel mb-4 text-center">
            <div className="panel-body">
              <div className="mb-3">
                <div
                  className="avatar bg-primary bg-opacity-10 text-primary fs-1 mx-auto"
                  style={{ width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
                >
                  <i className="bi bi-shop"></i>
                </div>
              </div>
              <h5 className="fw-bold mb-1">{umkm.nama_umkm}</h5>
              <p className="text-muted fs-sm mb-3">{umkm.nama_pemilik}</p>

              <div className="d-flex justify-content-center align-items-center gap-2 mb-4">
                <h2 className="mb-0 fw-bold text-primary">{totalScore}</h2>
                <span className="text-muted">/ 100</span>
              </div>

              <div className="mb-2">
                <span className={`badge-status ${statusClass} fs-6 px-4 py-2`}>
                  {umkm.status_usaha || "Go Modern"}
                </span>
              </div>
            </div>
          </div>

          {/* AI Rekomendasi */}
          <div className="panel">
            <div className="panel-header">
              <h5 className="m-0">
                <i className="bi bi-lightbulb-fill text-warning me-2"></i> Rekomendasi Sistem
              </h5>
            </div>
            <div className="panel-body">
              <p className="mb-3" style={{ lineHeight: "1.6" }}>
                {umkm.rekomendasi || "Belum ada rekomendasi yang di-generate."}
              </p>
              <Link href={`/dashboard/umkm/learnbook/${umkm.id}`} className="btn btn-outline-primary w-100 rounded-pill">
                <i className="bi bi-journal-check me-2"></i> Buat Modul Belajar AI
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Penilaian (Progress Bars) */}
        <div className="col-lg-8">
          <div className="panel">
            <div className="panel-header">
              <h5 className="m-0">
                <i className="bi bi-list-check me-2"></i> Rincian Parameter Penilaian
              </h5>
            </div>
            <div className="panel-body">
              <div className="list-group list-group-flush">
                {/* 1. Omzet */}
                <div className="list-group-item py-4 px-0">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-cash-stack text-success me-2"></i> Omzet Bulanan
                    </h6>
                    <span className="fw-bold fs-5 text-success">
                      {breakdown.omzet.score}{" "}
                      <span className="fs-sm text-muted fw-normal">/ {breakdown.omzet.max} pts</span>
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: `${(breakdown.omzet.score / breakdown.omzet.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted fs-sm">
                    <span>Status: {breakdown.omzet.desc}</span>
                    <span>Value: Rp {Number(breakdown.omzet.value).toLocaleString("id-ID")}</span>
                  </div>
                </div>

                {/* 2. Produk */}
                <div className="list-group-item py-4 px-0">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-box-seam text-info me-2"></i> Variasi Produk
                    </h6>
                    <span className="fw-bold fs-5 text-info">
                      {breakdown.produk.score}{" "}
                      <span className="fs-sm text-muted fw-normal">/ {breakdown.produk.max} pts</span>
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar bg-info"
                      style={{ width: `${(breakdown.produk.score / breakdown.produk.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted fs-sm">
                    <span>Status: {breakdown.produk.desc}</span>
                    <span>Value: {breakdown.produk.value} produk</span>
                  </div>
                </div>

                {/* 3. Pekerja */}
                <div className="list-group-item py-4 px-0">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-person-workspace text-warning me-2"></i> Serapan Tenaga Kerja
                    </h6>
                    <span className="fw-bold fs-5 text-warning">
                      {breakdown.pekerja.score}{" "}
                      <span className="fs-sm text-muted fw-normal">/ {breakdown.pekerja.max} pts</span>
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar bg-warning"
                      style={{ width: `${(breakdown.pekerja.score / breakdown.pekerja.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted fs-sm">
                    <span>Status: {breakdown.pekerja.desc}</span>
                    <span>Value: {breakdown.pekerja.value} orang</span>
                  </div>
                </div>

                {/* 4. Pelanggan */}
                <div className="list-group-item py-4 px-0">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-people text-primary me-2"></i> Jangkauan Pelanggan
                    </h6>
                    <span className="fw-bold fs-5 text-primary">
                      {breakdown.pelanggan.score}{" "}
                      <span className="fs-sm text-muted fw-normal">/ {breakdown.pelanggan.max} pts</span>
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar bg-primary"
                      style={{ width: `${(breakdown.pelanggan.score / breakdown.pelanggan.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted fs-sm">
                    <span>Status: {breakdown.pelanggan.desc}</span>
                    <span>Value: {breakdown.pelanggan.value} pelanggan</span>
                  </div>
                </div>

                {/* 5. Legalitas */}
                <div className="list-group-item py-4 px-0 border-bottom-0">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="fw-bold mb-0">
                      <i className="bi bi-shield-check text-danger me-2"></i> Legalitas Usaha
                    </h6>
                    <span className="fw-bold fs-5 text-danger">
                      {breakdown.legalitas.score}{" "}
                      <span className="fs-sm text-muted fw-normal">/ {breakdown.legalitas.max} pts</span>
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar bg-danger"
                      style={{ width: `${(breakdown.legalitas.score / breakdown.legalitas.max) * 100}%` }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted fs-sm">
                    <span>Status: {breakdown.legalitas.desc}</span>
                    <span>Value: {breakdown.legalitas.value} sertifikat</span>
                  </div>
                </div>
              </div>
            </div>
            {user.role !== "Mitra" && (
              <div className="panel-footer bg-light text-end rounded-bottom-4 p-3">
                <Link href="/dashboard/umkm" className="btn btn-primary rounded-pill px-4">
                  <i className="bi bi-pencil-square me-2"></i> Update Data UMKM
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
