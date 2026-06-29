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

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setTheme(currentTheme);
  }, []);

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
          <form action="/api/logout" method="POST">
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
            <span className="fs-sm text-muted">
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
