"use client";

import { useState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon">
            <i className="bi bi-building"></i>
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
            <input type="text" name="username" className="form-control" placeholder="Username" required autoComplete="off" />
          </div>
          <div className="login-input-group">
            <i className="bi bi-lock-fill input-icon" style={{ color: "#a5b4fc", background: "none", border: "none" }}></i>
            <input type="password" name="password" className="form-control" placeholder="Password" required />
          </div>
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
  );
}
