"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loginAction } from "./actions";

const LOGIN_STEP_COUNT = 5;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [username, setUsername] = useState("");
  const router = useRouter();

  const steps = [
    "Memverifikasi kredensial akun...",
    "Mengamankan sesi masuk sistem...",
    "Membaca data & profil UMKM...",
    "Mempersiapkan lembar kerja Anda...",
    `hallo ( ${username} )`
  ];

  useEffect(() => {
    if (!showLoadingOverlay) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => prev < LOGIN_STEP_COUNT - 1 ? prev + 1 : prev);
    }, 700);
    return () => clearInterval(interval);
  }, [showLoadingOverlay]);

  async function handleSubmit(formData: FormData) {
    const userVal = formData.get("username")?.toString() || "";
    setUsername(userVal);
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.success) {
      setLoadingStep(0);
      setShowLoadingOverlay(true);
      // Wait for animation steps before actual redirect
      setTimeout(() => {
        router.push("/dashboard");
      }, 3800);
    }
  }

  return (
    <>
      {showLoadingOverlay && (
        <div className="loading-overlay">
          <style>{`
            .loading-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: linear-gradient(135deg, #0b0f19 0%, #0f172a 50%, #1e1b4b 100%);
              z-index: 999999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              font-family: 'Inter', sans-serif;
              color: white;
            }

            .loading-logo-container {
              position: relative;
              margin-bottom: 2rem;
            }

            .loading-logo-glow {
              width: 90px;
              height: 90px;
              background: linear-gradient(135deg, #6366f1, #8b5cf6);
              border-radius: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2.2rem;
              color: white;
              box-shadow: 0 0 40px rgba(99, 102, 241, 0.4);
              animation: logoPulse 2s infinite alternate ease-in-out;
            }

            @keyframes logoPulse {
              0% { transform: scale(1); box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
              100% { transform: scale(1.08); box-shadow: 0 0 60px rgba(139, 92, 246, 0.6); }
            }

            .loading-spinner-ring {
              position: absolute;
              top: -12px;
              left: -12px;
              right: -12px;
              bottom: -12px;
              border: 3px solid transparent;
              border-top-color: #10b981;
              border-bottom-color: #6366f1;
              border-radius: 50%;
              animation: spinnerSpin 1.8s infinite linear;
            }

            @keyframes spinnerSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            .loading-bar-container {
              width: 320px;
              height: 6px;
              background: rgba(255, 255, 255, 0.08);
              border-radius: 99px;
              overflow: hidden;
              margin-bottom: 1.5rem;
              border: 1px solid rgba(255, 255, 255, 0.05);
            }

            .loading-bar-fill {
              height: 100%;
              background: linear-gradient(90deg, #10b981, #6366f1, #8b5cf6);
              border-radius: 99px;
              transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .loading-text {
              font-size: 1.05rem;
              font-weight: 600;
              color: rgba(255, 255, 255, 0.9);
              height: 24px;
              margin-bottom: 0.5rem;
              letter-spacing: 0.2px;
              text-align: center;
            }

            .loading-subtext {
              font-size: 0.725rem;
              color: rgba(255, 255, 255, 0.35);
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
          `}</style>
          
          <div className="loading-logo-container">
            <div className="loading-spinner-ring"></div>
            <div className="loading-logo-glow">
              <Image src="/rumah-bumn-icon.png" alt="Rumah BUMN" width={256} height={256} priority />
            </div>
          </div>

          <div className="loading-text">
            {steps[loadingStep]}
          </div>

          <div className="loading-bar-container">
            <div className="loading-bar-fill" style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}></div>
          </div>

          <div className="loading-subtext">
            Mempersiapkan Lingkungan Kerja
          </div>
        </div>
      )}

      <div className="login-wrapper">
        <div className="login-card">
          <div className="logo-section">
            <div className="logo-icon">
              <Image src="/rumah-bumn-icon.png" alt="Rumah BUMN" width={256} height={256} priority />
            </div>
            <h2>UMKM Monitor</h2>
            <p className="subtitle">Sistem Informasi Pendampingan & Monitoring UMKM</p>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", padding: "12px 16px", borderRadius: "10px", marginBottom: "20px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="bi bi-exclamation-circle-fill"></i>
              {error}
            </div>
          )}

          <form action={handleSubmit}>
            <div className="login-input-group">
              <i className="bi bi-person-fill input-icon" style={{ color: "#a5b4fc", background: "none", border: "none" }}></i>
              <input type="text" name="username" className="form-control" placeholder="Username" required autoComplete="username" />
            </div>
            <div className="login-input-group">
              <i className="bi bi-lock-fill input-icon" style={{ color: "#a5b4fc", background: "none", border: "none" }}></i>
              <input type="password" name="password" className="form-control" placeholder="Password" required autoComplete="current-password" />
            </div>
            <label className="remember-login">
              <input type="checkbox" name="rememberMe" />
              <span className="remember-check" aria-hidden="true"><i className="bi bi-check" /></span>
              <span>
                <strong>Ingat saya</strong>
                <small>Tetap masuk selama 30 hari</small>
              </span>
            </label>
            <button type="submit" className="btn-login" disabled={loading}>
              <i className="bi bi-box-arrow-in-right me-2"></i>
              {loading ? "Memproses..." : "Masuk ke Sistem"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px", color: "rgba(255,255,255,0.3)", fontSize: "0.75rem" }}>
            &copy; {new Date().getFullYear()} Rumah BUMN — Sistem Monitoring UMKM
          </div>
        </div>
      </div>
    </>
  );
}
