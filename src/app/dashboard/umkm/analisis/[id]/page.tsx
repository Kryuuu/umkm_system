import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { fetchScoringRules, matchRule } from "@/lib/scoring";

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

  // Fetch latest monitoring
  const { data: monitoring } = await supabaseAdmin
    .from("monitoring")
    .select("*")
    .eq("umkm_id", umkmId)
    .order("tahun", { ascending: false })
    .order("bulan", { ascending: false })
    .limit(1);

  const latestMonitoring = monitoring && monitoring.length > 0 ? monitoring[0] : null;

  // Monthly Reset Logic: Only count monitoring stats if they belong to the current month/year
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1; // 1-12
  const currentYear = currentDate.getFullYear();
  const isCurrentMonth = latestMonitoring && latestMonitoring.bulan === currentMonth && latestMonitoring.tahun === currentYear;

  // 5. Fetch Scoring Rules
  const rules = await fetchScoringRules();

  // Helper to find description and max points
  function getRuleInfo(value: number, catRules: any[] | undefined) {
    if (!catRules) return { score: 0, desc: "Belum ada aturan", max: 0 };
    let score = 0;
    let desc = "Belum memenuhi kriteria";
    let max = catRules[0]?.max_poin || 0; // Take max_poin from the first rule (or could find max among rules)

    // Check if value exceeds highest rule
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
        break; // matched
      }
    }
    return { score, desc, max };
  }

  const omzetValue = isCurrentMonth ? (latestMonitoring?.omzet || 0) : 0;
  const omzetInfo = getRuleInfo(omzetValue, rules.omzet);

  const breakdown = {
    omzet: { score: omzetInfo.score, max: omzetInfo.max, value: omzetValue, desc: omzetInfo.desc }
  };

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
                <span className="text-muted">pts</span>
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
                      {breakdown.omzet.score} <span className="fs-sm text-muted fw-normal">pts</span>
                    </span>
                  </div>
                  <div className="progress mb-2" style={{ height: "10px" }}>
                    <div
                      className="progress-bar bg-success"
                      style={{ width: breakdown.omzet.max > 0 ? `${(breakdown.omzet.score / breakdown.omzet.max) * 100}%` : (breakdown.omzet.score > 0 ? '100%' : '0%') }}
                    ></div>
                  </div>
                  <div className="d-flex justify-content-between text-muted fs-sm">
                    <span>Status: {breakdown.omzet.desc}</span>
                    <span>Value: Rp {Number(breakdown.omzet.value).toLocaleString("id-ID")}</span>
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
