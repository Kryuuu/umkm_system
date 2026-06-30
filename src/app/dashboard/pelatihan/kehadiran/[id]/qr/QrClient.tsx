"use client";

import { useState, useEffect, useRef } from "react";
import { getPelatihanQrTokenAction, generateQrTokenAction, getKehadiranStatsAction } from "../../../kehadiranActions";

export default function QrClient({ pelatihan }: { pelatihan: any }) {
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUmkm: 0, totalHadir: 0, recent: [] as any[] });
  
  const currentTokenRef = useRef<string | null>(null);
  currentTokenRef.current = qrToken;

  const lastCheckedIdRef = useRef<number | null>(null);

  // Play a browser-synthesized chime sound
  const playChime = () => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (err) {
      console.error("Audio chime error:", err);
    }
  };

  const handleGenerateQr = async () => {
    const res = await generateQrTokenAction(pelatihan.id);
    if (res.success && res.qrToken) {
      setQrToken(res.qrToken);
    }
  };

  // Poll for QR Code and Attendance Stats
  useEffect(() => {
    const initQrAndStats = async () => {
      setLoading(true);
      // Fetch Token
      const tokenRes = await getPelatihanQrTokenAction(pelatihan.id);
      if (tokenRes.success && tokenRes.qrToken) {
        const isExpired = tokenRes.qrExpiresAt && new Date(tokenRes.qrExpiresAt) < new Date();
        if (isExpired) {
          await handleGenerateQr();
        } else {
          setQrToken(tokenRes.qrToken);
        }
      } else {
        await handleGenerateQr();
      }

      // Fetch Stats
      const statsRes = await getKehadiranStatsAction(pelatihan.id);
      if (statsRes.success) {
        setStats({
          totalUmkm: statsRes.totalUmkm,
          totalHadir: statsRes.totalHadir,
          recent: statsRes.recent || [],
        });
        if (statsRes.recent && statsRes.recent.length > 0) {
          lastCheckedIdRef.current = statsRes.recent[0].id;
        }
      }
      setLoading(false);
    };

    initQrAndStats();

    const interval = setInterval(async () => {
      // 1. Poll token
      const tokenRes = await getPelatihanQrTokenAction(pelatihan.id);
      if (tokenRes.success && tokenRes.qrToken) {
        if (tokenRes.qrToken !== currentTokenRef.current) {
          setQrToken(tokenRes.qrToken);
        }
      }

      // 2. Poll stats
      const statsRes = await getKehadiranStatsAction(pelatihan.id);
      if (statsRes.success) {
        setStats((prev) => {
          // Play sound if a new person has scanned (recent[0].id is different)
          if (
            statsRes.recent &&
            statsRes.recent.length > 0 &&
            statsRes.recent[0].id !== lastCheckedIdRef.current
          ) {
            playChime();
            lastCheckedIdRef.current = statsRes.recent[0].id;
          }
          return {
            totalUmkm: statsRes.totalUmkm,
            totalHadir: statsRes.totalHadir,
            recent: statsRes.recent || [],
          };
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [pelatihan.id]);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.close();
    }
  };

  const percentage = stats.totalUmkm > 0 ? Math.round((stats.totalHadir / stats.totalUmkm) * 100) : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  };

  return (
    <>
      <style>{`
        .presenter-viewport {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 999999;
          background: linear-gradient(135deg, #0b0f19 0%, #0f172a 50%, #1e1b4b 100%);
          color: white;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }

        .bg-glow-1 {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          top: -150px;
          left: -150px;
          z-index: 1;
          pointer-events: none;
        }

        .bg-glow-2 {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%);
          bottom: -150px;
          right: -150px;
          z-index: 1;
          pointer-events: none;
        }

        .presenter-card {
          position: relative;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 3rem;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(99, 102, 241, 0.1);
          text-align: center;
          z-index: 10;
        }

        .qr-pulsing-box {
          position: relative;
          background: white;
          padding: 1.25rem;
          border-radius: 24px;
          display: inline-block;
          box-shadow: 0 0 35px rgba(168, 85, 247, 0.25);
          margin-bottom: 2rem;
          border: 4px solid transparent;
          background-clip: padding-box;
          transition: transform 0.3s ease;
          animation: qrBoxPulse 2.5s infinite alternate ease-in-out;
        }

        .qr-pulsing-box::before {
          content: '';
          position: absolute;
          top: -4px; bottom: -4px; left: -4px; right: -4px;
          background: linear-gradient(135deg, #a855f7, #6366f1);
          border-radius: 24px;
          z-index: -1;
        }

        @keyframes qrBoxPulse {
          0% { transform: scale(1); box-shadow: 0 0 25px rgba(99, 102, 241, 0.3); }
          100% { transform: scale(1.03); box-shadow: 0 0 45px rgba(168, 85, 247, 0.55); }
        }

        .qr-laser-scanner {
          position: absolute;
          top: 1.25rem;
          left: 1.25rem;
          right: 1.25rem;
          height: 3px;
          background: linear-gradient(to right, transparent, #ec4899, #6366f1, #ec4899, transparent);
          box-shadow: 0 0 10px rgba(236, 72, 153, 0.8);
          animation: laserScan 3.5s infinite linear;
          pointer-events: none;
          z-index: 5;
        }

        @keyframes laserScan {
          0% { top: 1.25rem; }
          50% { top: calc(100% - 1.25rem - 3px); }
          100% { top: 1.25rem; }
        }

        .gradient-title {
          background: linear-gradient(to right, #e0f2fe, #f472b6, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        .custom-progressbar {
          height: 12px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .custom-progressbar-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(to right, #4f46e5, #a855f7, #ec4899);
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .badge-pill-light {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.8);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .recent-item {
          animation: fadeInUp 0.5s ease forwards;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 10px 16px;
          margin-top: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="presenter-viewport">
        <div className="bg-glow-1"></div>
        <div className="bg-glow-2"></div>

        <div className="presenter-card">
          <div className="mb-3 d-flex justify-content-center">
            <span className="badge-pill-light">
              <i className="bi bi-broadcast me-1 text-danger animate-pulse"></i> LIVE SCAN ABSENSI
            </span>
          </div>

          <h3 className="gradient-title mb-2 fs-2">{pelatihan.nama_pelatihan}</h3>
          
          <div className="d-flex justify-content-center gap-3 text-white-50 fs-sm mb-4">
            <span>
              <i className="bi bi-calendar-event me-1 text-primary"></i> {formatDate(pelatihan.tanggal)}
            </span>
            <span>|</span>
            <span>
              <i className="bi bi-geo-alt me-1 text-pink"></i> {pelatihan.lokasi}
            </span>
          </div>

          {/* QR Container */}
          <div className="qr-pulsing-box">
            <div className="qr-laser-scanner"></div>
            {loading ? (
              <div className="d-flex align-items-center justify-content-center" style={{ width: '260px', height: '260px' }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : qrToken ? (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrToken)}`}
                alt="QR Code Absensi"
                style={{ width: '260px', height: '260px', display: 'block', borderRadius: '12px' }}
              />
            ) : (
              <div className="d-flex align-items-center justify-content-center text-dark fw-bold" style={{ width: '260px', height: '260px' }}>
                Gagal memuat QR Code
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="px-3 mb-4">
            <div className="d-flex justify-content-between align-items-end mb-2">
              <span className="fs-sm fw-semibold text-white-50">Kehadiran Peserta</span>
              <span className="fs-3 fw-bold text-white d-flex align-items-baseline">
                {stats.totalHadir} <span className="fs-sm text-white-50 fw-normal ms-1">/ {stats.totalUmkm} UMKM ({percentage}%)</span>
              </span>
            </div>
            <div className="custom-progressbar shadow-inner">
              <div className="custom-progressbar-fill" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>

          {/* Recent Scans (Live Feed) */}
          {stats.recent.length > 0 && (
            <div className="text-start px-3 mb-4">
              <span className="fs-xs fw-bold text-white-50 tracking-wider">BARU SAJA HADIR</span>
              <div className="mt-1">
                {stats.recent.map((item, index) => (
                  <div className="recent-item" key={item.id} style={{ animationDelay: `${index * 0.1}s` }}>
                    <div>
                      <strong className="text-white d-block fs-sm">{item.nama_umkm}</strong>
                      <span className="text-white-50" style={{ fontSize: '0.7rem' }}>{item.nama_pemilik}</span>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill fs-xs px-2 py-1">
                      <i className="bi bi-check-circle-fill me-1"></i> Hadir
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer controls */}
          <div className="d-flex justify-content-center gap-3 mt-2">
            <button 
              onClick={handleGenerateQr}
              disabled={loading}
              className="btn btn-sm btn-outline-light rounded-pill px-3 py-2 fs-xs border-white border-opacity-10 text-white-50"
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Regenerasi QR Manual
            </button>
            <button 
              onClick={handleClose}
              className="btn btn-sm btn-outline-danger rounded-pill px-3 py-2 fs-xs border-danger border-opacity-20 text-danger-emphasis"
            >
              <i className="bi bi-x-circle me-1"></i> Tutup Presentasi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
