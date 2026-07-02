"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayoutWrapper({ 
  children, 
  user 
}: { 
  children: React.ReactNode, 
  user: any 
}) {
  const pathname = usePathname();
  const [sidebarActive, setSidebarActive] = useState(false);
  const [theme, setTheme] = useState("light");
  const [laporanExpanded, setLaporanExpanded] = useState(false);
  const [showLogoutOverlay, setShowLogoutOverlay] = useState(false);
  const [logoutStep, setLogoutStep] = useState(0);

  const logoutSteps = [
    "Menyimpan perubahan sesi...",
    "Menghapus token enkripsi...",
    "Menutup koneksi aman...",
    "Kembali ke gerbang login..."
  ];

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);
  }, []);

  useEffect(() => {
    if (showLogoutOverlay) {
      const interval = setInterval(() => {
        setLogoutStep((prev) => {
          if (prev < logoutSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 600);
      return () => clearInterval(interval);
    } else {
      setLogoutStep(0);
    }
  }, [showLogoutOverlay]);

  const handleLogout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setShowLogoutOverlay(true);
    setTimeout(() => {
      form.submit();
    }, 2500);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const isActive = (path: string) => pathname === path ? "active" : "";
  const isLaporanActive = pathname.startsWith('/dashboard/laporan') ? "active" : "";

  return (
    <>
      {showLogoutOverlay && (
        <div className="logout-overlay">
          <style>{`
            .logout-overlay {
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

            .logout-logo-container {
              position: relative;
              margin-bottom: 2rem;
            }

            .logout-logo-glow {
              width: 90px;
              height: 90px;
              background: linear-gradient(135deg, #f43f5e, #e11d48);
              border-radius: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2.2rem;
              color: white;
              box-shadow: 0 0 40px rgba(244, 63, 94, 0.4);
              animation: logoPulseRose 2s infinite alternate ease-in-out;
            }

            @keyframes logoPulseRose {
              0% { transform: scale(1); box-shadow: 0 0 30px rgba(244, 63, 94, 0.4); }
              100% { transform: scale(1.08); box-shadow: 0 0 60px rgba(225, 29, 72, 0.6); }
            }

            .logout-spinner-ring {
              position: absolute;
              top: -12px;
              left: -12px;
              right: -12px;
              bottom: -12px;
              border: 3px solid transparent;
              border-top-color: #f43f5e;
              border-bottom-color: #fb7185;
              border-radius: 50%;
              animation: spinnerSpin 1.8s infinite linear;
            }

            @keyframes spinnerSpin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            .logout-bar-container {
              width: 320px;
              height: 6px;
              background: rgba(255, 255, 255, 0.08);
              border-radius: 99px;
              overflow: hidden;
              margin-bottom: 1.5rem;
              border: 1px solid rgba(255, 255, 255, 0.05);
            }

            .logout-bar-fill {
              height: 100%;
              background: linear-gradient(90deg, #f43f5e, #fb7185, #fda4af);
              border-radius: 99px;
              transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .logout-text {
              font-size: 1.05rem;
              font-weight: 600;
              color: rgba(255, 255, 255, 0.9);
              height: 24px;
              margin-bottom: 0.5rem;
              letter-spacing: 0.2px;
              text-align: center;
            }

            .logout-subtext {
              font-size: 0.725rem;
              color: rgba(255, 255, 255, 0.35);
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
          `}</style>
          
          <div className="logout-logo-container">
            <div className="logout-spinner-ring"></div>
            <div className="logout-logo-glow">
              <i className="bi bi-box-arrow-left"></i>
            </div>
          </div>

          <div className="logout-text">
            {logoutSteps[logoutStep]}
          </div>

          <div className="logout-bar-container">
            <div className="logout-bar-fill" style={{ width: `${(logoutStep + 1) * 25}%` }}></div>
          </div>

          <div className="logout-subtext">
            Mengakhiri Sesi Anda
          </div>
        </div>
      )}
      <aside className={`sidebar ${sidebarActive ? 'active' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <i className="bi bi-building"></i>
          </div>
          <div className="sidebar-brand">
            <h4>UMKM Monitor</h4>
            <span>Rumah BUMN</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu Utama</div>
            <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
              <i className="bi bi-grid-1x2-fill"></i>
              <span>Dashboard</span>
            </Link>

            {user.role === 'admin' && (
              <Link href="/dashboard/fasilitator" className={`nav-item ${pathname === '/dashboard/fasilitator' ? 'active' : ''}`}>
                <i className="bi bi-person-badge-fill"></i>
                <span>Data Fasilitator</span>
              </Link>
            )}
            
            {user.role === 'fasilitator' && (
              <Link href="/dashboard/fasilitator/profile" className={`nav-item ${pathname === '/dashboard/fasilitator/profile' ? 'active' : ''}`}>
                <i className="bi bi-person-circle"></i>
                <span>Edit Profil</span>
              </Link>
            )}

            {user.role !== 'umkm' && (
              <Link href="/dashboard/umkm/master" className={`nav-item ${pathname.includes('/umkm/master') ? 'active' : ''}`}>
                <i className="bi bi-database-fill"></i>
                <span>Master UMKM</span>
              </Link>
            )}

            <Link href="/dashboard/umkm" className={`nav-item ${pathname === '/dashboard/umkm' ? 'active' : ''}`}>
              <i className="bi bi-shop"></i>
              <span>{user.role === 'umkm' ? 'Info UMKM' : 'Data UMKM'}</span>
            </Link>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Operasional</div>
            <Link href="/dashboard/produk" className={`nav-item ${isActive('/dashboard/produk')}`}>
              <i className="bi bi-box-seam-fill"></i>
              <span>Produk UMKM</span>
            </Link>
            <Link href="/dashboard/monitoring" className={`nav-item ${isActive('/dashboard/monitoring')}`}>
              <i className="bi bi-graph-up-arrow"></i>
              <span>Perkembangan Usaha</span>
            </Link>
            
            {(user.role === 'admin' || user.role === 'fasilitator') ? (
              <>
                <Link href="/dashboard/pelatihan" className={`nav-item ${isActive('/dashboard/pelatihan')}`}>
                  <i className="bi bi-mortarboard-fill"></i>
                  <span>Pelatihan UMKM</span>
                </Link>
                <Link href="/dashboard/pendampingan" className={`nav-item ${isActive('/dashboard/pendampingan')}`}>
                  <i className="bi bi-people-fill"></i>
                  <span>Pendampingan</span>
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard/pelatihan" className={`nav-item ${isActive('/dashboard/pelatihan')}`}>
                  <i className="bi bi-mortarboard-fill"></i>
                  <span>Pelatihan UMKM</span>
                </Link>
                <Link href="/dashboard/pelatihan/scan" className={`nav-item ${isActive('/dashboard/pelatihan/scan')}`}>
                  <i className="bi bi-qr-code-scan"></i>
                  <span>Scan Absensi</span>
                </Link>
              </>
            )}

            <Link href="/dashboard/konsultasi" className={`nav-item ${isActive('/dashboard/konsultasi')}`}>
              <i className="bi bi-chat-dots-fill"></i>
              <span>Konsultasi</span>
            </Link>
            <Link href="/dashboard/penjualan" className={`nav-item ${isActive('/dashboard/penjualan')}`}>
              <i className="bi bi-cart-fill"></i>
              <span>Data Penjualan</span>
            </Link>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Analisis</div>
            <Link href="/dashboard/leaderboard" className={`nav-item ${isActive('/dashboard/leaderboard')}`}>
              <i className="bi bi-trophy-fill"></i>
              <span>Leaderboard</span>
            </Link>

            {user.role === 'admin' && (
              <>
                <a href="#" className={`nav-item ${isLaporanActive} ${laporanExpanded ? 'expanded' : ''}`} onClick={(e) => { e.preventDefault(); setLaporanExpanded(!laporanExpanded); }}>
                  <i className="bi bi-file-earmark-bar-graph-fill"></i>
                  <span>Laporan</span>
                  <i className="bi bi-chevron-right nav-arrow"></i>
                </a>
                <div className={`nav-submenu ${isLaporanActive || laporanExpanded ? 'show' : ''}`} id="laporanSubmenu">
                  <Link href="/dashboard/laporan/fasilitator" className={`nav-item ${isActive('/dashboard/laporan/fasilitator')}`}><i className="bi bi-dot"></i> Kinerja Fasilitator</Link>
                  <Link href="/dashboard/laporan/umkm" className={`nav-item ${isActive('/dashboard/laporan/umkm')}`}><i className="bi bi-dot"></i> UMKM Binaan</Link>
                  <Link href="/dashboard/laporan/statistik" className={`nav-item ${isActive('/dashboard/laporan/statistik')}`}><i className="bi bi-dot"></i> Statistik</Link>
                </div>
              </>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{getInitials(user.name)}</div>
            <div className="sidebar-user-info">
              <h6>{user.name}</h6>
              <span>{user.role === 'admin' ? 'Administrator' : user.role === 'fasilitator' ? 'Fasilitator' : 'UMKM Binaan'}</span>
            </div>
          </div>
          {user.role === 'admin' && (
            <Link href="/dashboard/fasilitator/profile" className="nav-item mb-1 py-1" style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', opacity: 0.8 }}>
              <i className="bi bi-gear-fill"></i>
              <span>Setelan Profil</span>
            </Link>
          )}
          <form action="/api/logout" method="POST" onSubmit={handleLogout}>
            <button type="submit" className="nav-item mt-2 w-100 text-start bg-transparent border-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <i className="bi bi-box-arrow-left"></i>
              <span>Logout</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div>
            <button className="btn-toggle-sidebar" id="toggleSidebar" onClick={() => setSidebarActive(!sidebarActive)} style={{ display: 'inline-block', marginRight: '15px' }}>
              <i className="bi bi-list"></i>
            </button>
            <span className="page-title">UMKM Monitor</span>
          </div>
          <div className="header-actions">
            <button className={`btn btn-sm rounded-circle me-3 ${theme === 'dark' ? 'btn-dark' : 'btn-light'}`} onClick={toggleTheme} title="Ganti Tema">
              <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-stars'}`}></i>
            </button>
            <span className="fs-sm text-muted d-none d-sm-inline">
              <i className="bi bi-calendar3 me-2"></i>
              {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </header>

        <div className="content-wrapper animate-fade-in">
          {children}
        </div>
      </main>
      
      {sidebarActive && (
        <div className="sidebar-overlay active" onClick={() => setSidebarActive(false)}></div>
      )}
    </>
  );
}
