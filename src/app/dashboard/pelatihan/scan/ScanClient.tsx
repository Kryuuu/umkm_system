"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { verifyQrTokenAndRecordPresence } from "../kehadiranActions";

export default function ScanClient({ user }: { user: any }) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInsecure, setIsInsecure] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerStartedRef = useRef(false);

  // Check if context is insecure (e.g. HTTP on non-localhost)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSecure = 
        window.isSecureContext || 
        window.location.protocol === "https:" || 
        window.location.hostname === "localhost" || 
        window.location.hostname === "127.0.0.1";
      setIsInsecure(!isSecure);
    }
  }, []);

  const requestCameraPermissionDirectly = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      return false;
    } catch (err) {
      console.warn("Direct camera request failed/denied:", err);
      return false;
    }
  };

  const startScanner = async () => {
    if (scannerStartedRef.current) return;
    setCameraError(null);
    setScanning(true);
    scannerStartedRef.current = true;

    try {
      // Force request camera permission immediately
      await requestCameraPermissionDirectly();

      // Small timeout to ensure DOM container is rendered
      setTimeout(async () => {
        const container = document.getElementById("reader");
        if (!container) {
          scannerStartedRef.current = false;
          setScanning(false);
          return;
        }

        const html5Qrcode = new Html5Qrcode("reader");
        html5QrcodeRef.current = html5Qrcode;

        try {
          await html5Qrcode.start(
            { facingMode: "environment" }, // Rear camera
            {
              fps: 20,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.75;
                return { width: size, height: size };
              },
            },
            async (decodedText) => {
              await handleVerification(decodedText);
            },
            () => {
              // Ignore failure frames
            }
          );
        } catch (startErr: any) {
          console.error("Camera start error:", startErr);
          let errorMsg = "Gagal mengakses kamera. Silakan periksa izin kamera Anda.";
          
          if (isInsecure) {
            errorMsg = "Browser memblokir kamera pada koneksi HTTP tidak aman (bukan HTTPS/localhost).";
          } else if (startErr?.toString().includes("NotAllowedError") || startErr?.toString().includes("Permission denied")) {
            errorMsg = "Izin akses kamera ditolak. Berikan izin kamera pada browser untuk memindai.";
          }
          
          setCameraError(errorMsg);
          setScanning(false);
          scannerStartedRef.current = false;
        }
      }, 300);
    } catch (err: any) {
      console.error("Init scanner error:", err);
      setCameraError("Terjadi kesalahan saat menginisialisasi kamera.");
      setScanning(false);
      scannerStartedRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      try {
        await html5QrcodeRef.current.stop();
      } catch (err) {
        console.error("Gagal menonaktifkan kamera:", err);
      }
      html5QrcodeRef.current = null;
    }
    setScanning(false);
    scannerStartedRef.current = false;
  };

  const handleVerification = async (token: string) => {
    if (loading) return;
    setLoading(true);

    // Stop scanner immediately to prevent multiple scans
    await stopScanner();

    const Swal = (window as any).Swal;
    Swal.fire({
      title: "Memproses Absensi...",
      text: "Memverifikasi token kehadiran Anda...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const res = await verifyQrTokenAndRecordPresence(token);

      if (res.success) {
        if (res.sudahHadir) {
          Swal.fire({
            icon: "info",
            title: "Sudah Terabsen",
            text: res.message || "Anda sudah melakukan absensi untuk pelatihan ini.",
            confirmButtonText: "Kembali ke Pelatihan",
            confirmButtonColor: "#3b82f6",
          }).then(() => {
            router.push("/dashboard/pelatihan");
          });
          return;
        }

        Swal.fire({
          icon: "success",
          title: "Absensi Berhasil!",
          text: res.message || "Kehadiran Anda berhasil dicatat.",
          confirmButtonText: "Kembali ke Pelatihan",
          confirmButtonColor: "#4f46e5",
        }).then(() => {
          router.push("/dashboard/pelatihan");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Absensi Gagal",
          text: res.message || "Token QR Code tidak valid atau sudah kedaluwarsa.",
          confirmButtonText: "Scan Ulang",
          confirmButtonColor: "#e11d48",
        }).then(() => {
          setLoading(false);
          if (activeTab === "camera") {
            startScanner();
          }
        });
      }
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: err.message || "Gagal menghubungi server.",
        confirmButtonText: "Coba Lagi",
      }).then(() => {
        setLoading(false);
        if (activeTab === "camera") {
          startScanner();
        }
      });
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    await handleVerification(manualToken.trim());
  };

  useEffect(() => {
    if (activeTab === "camera") {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [activeTab]);

  return (
    <>
      <style>{`
        @keyframes scanLaser {
          0% { top: 5%; }
          50% { top: 95%; }
          100% { top: 5%; }
        }
        @keyframes pulseBorder {
          0%, 100% { border-color: rgba(99, 102, 241, 0.4); box-shadow: 0 0 10px rgba(99, 102, 241, 0.2); }
          50% { border-color: rgba(99, 102, 241, 0.8); box-shadow: 0 0 25px rgba(99, 102, 241, 0.6); }
        }
        @keyframes subtlePulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.03); opacity: 1; }
        }
        .scanner-view-container {
          position: relative;
          width: 100%;
          max-width: 320px;
          height: 320px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 24px;
          border: 3px solid rgba(99, 102, 241, 0.4);
          background-color: #03030c;
          animation: pulseBorder 4s infinite ease-in-out;
        }
        .scanner-laser-line {
          position: absolute;
          left: 6%;
          right: 6%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #818cf8, #a855f7, #818cf8, transparent);
          animation: scanLaser 2.2s infinite ease-in-out;
          box-shadow: 0 0 12px rgba(129, 140, 248, 0.8), 0 0 4px rgba(168, 85, 247, 0.8);
          z-index: 10;
          pointer-events: none;
        }
        .scanner-overlay-box {
          position: absolute;
          top: 12.5%;
          left: 12.5%;
          right: 12.5%;
          bottom: 12.5%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          z-index: 5;
          pointer-events: none;
          box-shadow: 0 0 0 9999px rgba(3, 3, 12, 0.6);
        }
        /* Corners indicators */
        .scanner-corner {
          position: absolute;
          width: 20px;
          height: 20px;
          border-color: #6366f1;
          border-style: solid;
          z-index: 8;
          pointer-events: none;
          filter: drop-shadow(0 0 6px rgba(99, 102, 241, 0.8));
        }
        .scanner-corner.top-left {
          top: 10%;
          left: 10%;
          border-width: 4px 0 0 4px;
          border-top-left-radius: 8px;
        }
        .scanner-corner.top-right {
          top: 10%;
          right: 10%;
          border-width: 4px 4px 0 0;
          border-top-right-radius: 8px;
        }
        .scanner-corner.bottom-left {
          bottom: 10%;
          left: 10%;
          border-width: 0 0 4px 4px;
          border-bottom-left-radius: 8px;
        }
        .scanner-corner.bottom-right {
          bottom: 10%;
          right: 10%;
          border-width: 0 4px 4px 0;
          border-bottom-right-radius: 8px;
        }
        #reader {
          width: 100% !important;
          height: 100% !important;
          background: transparent;
        }
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 20px;
        }
        .glass-panel {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .sliding-tab-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sliding-tab-btn.active {
          background: #6366f1 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-1 text-heading">Absensi Kehadiran Pelatihan</h5>
          <p className="text-muted fs-sm mb-0">Pindai QR Code kehadiran menggunakan kamera perangkat Anda</p>
        </div>
        <button
          onClick={async () => {
            await stopScanner();
            router.push("/dashboard/pelatihan");
          }}
          className="btn-outline-custom border-0 bg-transparent text-primary d-flex align-items-center gap-2"
          style={{ cursor: "pointer", fontWeight: "600" }}
        >
          <i className="bi bi-arrow-left fs-5"></i> Kembali
        </button>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="panel glass-panel shadow-lg rounded-4 overflow-hidden mb-4 p-4 text-center">
            <h5 className="fw-bold mb-1 text-white" style={{ letterSpacing: "0.5px" }}>Metode Validasi Absen</h5>
            <p className="text-muted fs-xs mb-4">Pilih metode pemindaian kamera atau masukkan token manual</p>

            <div className="d-flex justify-content-center gap-2 mb-4 p-1 bg-black bg-opacity-40 rounded-pill" style={{ maxWidth: "290px", margin: "0 auto", border: "1px solid rgba(255,255,255,0.05)" }}>
              <button
                onClick={() => setActiveTab("camera")}
                className={`btn rounded-pill px-3 py-2 fs-xs fw-semibold border-0 sliding-tab-btn ${
                  activeTab === "camera" ? "active" : "text-white-50 bg-transparent"
                }`}
                style={{ flex: 1 }}
              >
                <i className="bi bi-camera-fill me-1.5"></i> Kamera
              </button>
              <button
                onClick={() => setActiveTab("manual")}
                className={`btn rounded-pill px-3 py-2 fs-xs fw-semibold border-0 sliding-tab-btn ${
                  activeTab === "manual" ? "active" : "text-white-50 bg-transparent"
                }`}
                style={{ flex: 1 }}
              >
                <i className="bi bi-keyboard-fill me-1.5"></i> Kode Manual
              </button>
            </div>

            {activeTab === "camera" && (
              <div className="animate-fade-in">
                {cameraError ? (
                  <div className="alert border-0 rounded-4 text-start fs-sm p-4 mb-3 text-white" style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                    <div className="d-flex align-items-center mb-3">
                      <div className="bg-danger bg-opacity-20 p-2 rounded-circle d-inline-flex justify-content-center align-items-center me-2.5" style={{ width: "36px", height: "36px" }}>
                        <i className="bi bi-camera-video-off-fill text-danger fs-5"></i>
                      </div>
                      <h6 className="fw-bold mb-0 text-white">Kamera Terhambat</h6>
                    </div>
                    
                    <p className="text-white-50 mb-3 fs-xs leading-relaxed">
                      {cameraError}
                    </p>

                    <div className="bg-black bg-opacity-35 rounded-3 p-3 mb-3 text-white-50 fs-xs">
                      <span className="fw-bold text-white mb-1.5 d-block">💡 Solusi Cepat:</span>
                      {isInsecure ? (
                        <ol className="ps-3 mb-0" style={{ listStyleType: "decimal" }}>
                          <li className="mb-1">Buka aplikasi menggunakan <strong>HTTPS</strong> atau dari perangkat <strong>localhost</strong>.</li>
                          <li>Jika menggunakan IP lokal (e.g. Chrome di HP), buka <code>chrome://flags</code>, cari <code>Insecure origins treated as secure</code>, masukkan URL web ini, pilih enabled, lalu restart Chrome.</li>
                        </ol>
                      ) : (
                        <ol className="ps-3 mb-0" style={{ listStyleType: "decimal" }}>
                          <li className="mb-1">Klik ikon <strong>Gembok / Pengaturan</strong> di kiri kolom URL browser.</li>
                          <li className="mb-1">Ubah izin <strong>Kamera</strong> ke status <strong>Izinkan / Allow</strong>.</li>
                          <li>Muat ulang (refresh) halaman ini untuk memulai ulang kamera.</li>
                        </ol>
                      )}
                    </div>

                    <div className="text-center">
                      <button
                        onClick={async () => {
                          setCameraError(null);
                          startScanner();
                        }}
                        className="btn btn-sm btn-light rounded-pill px-4 fw-semibold text-dark w-100 py-2"
                      >
                        <i className="bi bi-arrow-clockwise me-1"></i> Coba Aktifkan Kamera
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="scanner-view-container shadow mb-3">
                      <div id="reader"></div>
                      {scanning && (
                        <>
                          <div className="scanner-overlay-box"></div>
                          <div className="scanner-laser-line"></div>
                          <div className="scanner-corner top-left"></div>
                          <div className="scanner-corner top-right"></div>
                          <div className="scanner-corner bottom-left"></div>
                          <div className="scanner-corner bottom-right"></div>
                        </>
                      )}
                      
                      {!scanning && (
                        <div className="position-absolute top-50 start-50 translate-middle text-white text-opacity-50 fs-xs d-flex flex-column align-items-center gap-2">
                          <span className="spinner-border spinner-border-sm text-primary" style={{ animationDuration: "1s" }}></span>
                          <span>Menghubungkan Kamera...</span>
                        </div>
                      )}
                    </div>

                    <div className="d-inline-flex align-items-center justify-content-center gap-2 bg-success bg-opacity-10 text-success px-3 py-1.5 rounded-pill fs-xs mb-3 animate-fade-in" style={{ animation: "subtlePulse 2s infinite ease-in-out" }}>
                      <span className="bg-success rounded-circle" style={{ width: "6px", height: "6px", display: "inline-block" }}></span>
                      <span>Kamera Aktif - Posisikan QR Code di Tengah Kotak</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "manual" && (
              <form onSubmit={handleManualSubmit} className="text-start p-2 animate-fade-in">
                <div className="form-group mb-4">
                  <label className="fs-xs fw-bold text-white-50 mb-2">Token Absensi Pelatihan</label>
                  <div className="position-relative">
                    <span className="position-absolute start-0 top-50 translate-middle-y ms-3 text-white-50">
                      <i className="bi bi-key-fill fs-5"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-custom text-center text-white bg-black bg-opacity-40 border-white border-opacity-10 py-3 rounded-3"
                      placeholder="Masukkan 36-karakter token..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      style={{ 
                        fontSize: "0.95rem", 
                        letterSpacing: "1px", 
                        paddingLeft: "45px",
                        border: "1px solid rgba(255, 255, 255, 0.15)"
                      }}
                      required
                    />
                  </div>
                  <small className="text-white-50 fs-xs mt-2.5 d-block text-center bg-black bg-opacity-20 py-2 rounded-2">
                    💡 *Gunakan token cadangan ini jika kamera perangkat Anda bermasalah.
                  </small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded-3 fw-bold border-0 shadow-lg"
                  style={{ 
                    background: "linear-gradient(135deg, #6366f1, #a855f7)",
                    transition: "all 0.2s"
                  }}
                  disabled={loading || !manualToken.trim()}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <i className="bi bi-check-circle-fill me-2"></i>
                  )}
                  Verifikasi Kehadiran
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
