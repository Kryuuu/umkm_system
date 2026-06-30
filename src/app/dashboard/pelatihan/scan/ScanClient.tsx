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
  const [manualToken, setManualToken] = useState("");
  const [activeTab, setActiveTab] = useState<"camera" | "manual">("camera");

  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const scannerStartedRef = useRef(false);

  const startScanner = async () => {
    if (scannerStartedRef.current) return;
    setCameraError(null);
    setScanning(true);
    scannerStartedRef.current = true;

    try {
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
              fps: 15,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.7;
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
          setCameraError(
            "Gagal mengakses kamera. Pastikan Anda telah memberikan izin kamera dan menggunakan HTTPS."
          );
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
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .scanner-laser-line {
          position: absolute;
          left: 0;
          height: 3px;
          width: 100%;
          background: linear-gradient(to right, transparent, #ec4899, #a855f7, #ec4899, transparent);
          animation: scanLaser 3s infinite linear;
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.8);
          z-index: 10;
          pointer-events: none;
        }
        .scanner-overlay-box {
          position: absolute;
          top: 15%;
          left: 15%;
          right: 15%;
          bottom: 15%;
          border: 2px dashed #a21caf;
          border-radius: 12px;
          z-index: 5;
          pointer-events: none;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        }
        .scanner-view-container {
          position: relative;
          width: 100%;
          max-width: 320px;
          height: 320px;
          margin: 0 auto;
          overflow: hidden;
          border-radius: 20px;
          border: 4px solid #1e1b4b;
          background-color: #000;
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="fw-bold mb-1">Absensi Kehadiran Pelatihan</h5>
          <p className="text-muted fs-sm mb-0">Scan QR Code pelatihan untuk mencatat kehadiran Anda</p>
        </div>
        <Link href="/dashboard/pelatihan" className="btn-outline-custom">
          <i className="bi bi-arrow-left"></i> Kembali
        </Link>
      </div>

      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="panel border-0 shadow-lg rounded-4 overflow-hidden mb-4" style={{
            background: "linear-gradient(135deg, #1e1b4b, #311042)",
            color: "white"
          }}>
            <div className="p-4 text-center">
              <h5 className="fw-bold mb-1 text-white">Metode Absensi</h5>
              <p className="text-white-50 fs-xs mb-3">Pilih metode scan kamera atau input kode manual</p>

              <div className="d-flex justify-content-center gap-2 mb-4 p-1 bg-black bg-opacity-25 rounded-pill" style={{ maxWidth: "300px", margin: "0 auto" }}>
                <button
                  onClick={() => setActiveTab("camera")}
                  className={`btn rounded-pill px-3 py-2 fs-xs fw-semibold border-0 ${
                    activeTab === "camera" ? "bg-white text-dark shadow-sm" : "text-white-50 bg-transparent"
                  }`}
                  style={{ flex: 1 }}
                >
                  <i className="bi bi-camera me-1"></i> Kamera
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  className={`btn rounded-pill px-3 py-2 fs-xs fw-semibold border-0 ${
                    activeTab === "manual" ? "bg-white text-dark shadow-sm" : "text-white-50 bg-transparent"
                  }`}
                  style={{ flex: 1 }}
                >
                  <i className="bi bi-keyboard me-1"></i> Kode Manual
                </button>
              </div>

              {activeTab === "camera" && (
                <div>
                  {cameraError ? (
                    <div className="alert alert-danger border-0 rounded-3 text-start fs-sm p-3 mb-3" style={{ background: "rgba(225, 29, 72, 0.15)", color: "#f87171" }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {cameraError}
                      <div className="mt-3 text-center">
                        <button
                          onClick={() => { setCameraError(null); startScanner(); }}
                          className="btn btn-sm btn-outline-light rounded-pill"
                        >
                          <i className="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="scanner-view-container shadow-sm mb-3">
                        <div id="reader" style={{ width: "100%", height: "100%" }}></div>
                        {scanning && (
                          <>
                            <div className="scanner-overlay-box"></div>
                            <div className="scanner-laser-line"></div>
                          </>
                        )}
                      </div>
                      <p className="fs-xs text-white-50 mb-0">
                        {scanning ? "Posisikan QR Code di dalam kotak untuk memindai" : "Mempersiapkan kamera..."}
                      </p>
                    </>
                  )}
                </div>
              )}

              {activeTab === "manual" && (
                <form onSubmit={handleManualSubmit} className="text-start p-2">
                  <div className="form-group mb-3">
                    <label className="fs-sm fw-bold text-white-50 mb-2">Kode Token Absensi</label>
                    <input
                      type="text"
                      className="form-control form-control-custom text-center text-white bg-black bg-opacity-20 border-white border-opacity-10 py-3 rounded-3"
                      placeholder="Masukkan 36-karakter token absensi..."
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      style={{ fontSize: "0.95rem", letterSpacing: "1px" }}
                      required
                    />
                    <small className="text-white-50 fs-xs mt-2 d-block text-center">
                      *Tanyakan kode ini kepada pemateri jika kamera Anda bermasalah.
                    </small>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 rounded-3 fw-bold border-0 shadow"
                    style={{ background: "linear-gradient(135deg, #4f46e5, #9333ea)" }}
                    disabled={loading || !manualToken.trim()}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i className="bi bi-check-circle-fill me-2"></i>
                    )}
                    Verifikasi & Absen
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
