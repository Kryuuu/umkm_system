"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { canAccess, type StaffPermission } from "@/lib/permissions";
import { 
  getNotificationsAction, 
  markNotificationAsReadAction, 
  markAllNotificationsAsReadAction 
} from "@/app/dashboard/notificationsActions";

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

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsAction();
      if (res.success) {
        setNotifications(res.notifications);
        setUnreadCount(res.notifications.filter((n: any) => !n.is_read).length);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await markNotificationAsReadAction(notif.id);
      setNotifications(prev => prev.filter(n => n.id !== notif.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setShowNotifications(false);
    
    if (notif.tipe === 'chat') {
      window.location.href = '/dashboard/konsultasi';
    } else if (notif.tipe === 'naik_kelas') {
      window.location.href = `/dashboard/umkm/analisis/${notif.target_id}`;
    } else if (notif.tipe === 'pelatihan') {
      window.location.href = '/dashboard/pelatihan';
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsReadAction();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

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
  const hasAccess = (permission: StaffPermission) => canAccess(user.role, user.permissions, permission);

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
            <Image src="/rumah-bumn-icon.png" alt="Rumah BUMN" width={256} height={256} priority />
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

            {user.role === 'Admin' && (
              <Link href="/dashboard/fasilitator" className={`nav-item ${pathname === '/dashboard/fasilitator' ? 'active' : ''}`}>
                <i className="bi bi-person-badge-fill"></i>
                <span>Data Pengguna</span>
              </Link>
            )}
            
            {user.role !== 'Mitra' && hasAccess('umkm_master') && (
              <Link href="/dashboard/umkm/master" className={`nav-item ${pathname.includes('/umkm/master') ? 'active' : ''}`}>
                <i className="bi bi-database-fill"></i>
                <span>Master UMKM</span>
              </Link>
            )}

            {(user.role === 'Mitra' || hasAccess('umkm_data')) && (
              <Link href="/dashboard/umkm" className={`nav-item ${pathname === '/dashboard/umkm' ? 'active' : ''}`}>
                <i className="bi bi-shop"></i>
                <span>{user.role === 'Mitra' ? 'Info UMKM' : 'Data UMKM'}</span>
              </Link>
            )}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Operasional</div>
            {(user.role === 'Mitra' || hasAccess('produk')) && <Link href="/dashboard/produk" className={`nav-item ${isActive('/dashboard/produk')}`}>
              <i className="bi bi-box-seam-fill"></i>
              <span>Produk UMKM</span>
            </Link>}
            {(user.role === 'Mitra' || hasAccess('monitoring')) && <Link href="/dashboard/monitoring" className={`nav-item ${isActive('/dashboard/monitoring')}`}>
              <i className="bi bi-graph-up-arrow"></i>
              <span>Perkembangan Usaha</span>
            </Link>}
            
            {user.role !== 'Mitra' ? (
              <>
                {hasAccess('pelatihan') && <Link href="/dashboard/pelatihan" className={`nav-item ${isActive('/dashboard/pelatihan')}`}>
                  <i className="bi bi-mortarboard-fill"></i>
                  <span>Pelatihan UMKM</span>
                </Link>}
                {hasAccess('pendampingan') && <Link href="/dashboard/pendampingan" className={`nav-item ${isActive('/dashboard/pendampingan')}`}>
                  <i className="bi bi-people-fill"></i>
                  <span>Pendampingan</span>
                </Link>}
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

            {(user.role === 'Mitra' || hasAccess('konsultasi')) && <Link href="/dashboard/konsultasi" className={`nav-item ${isActive('/dashboard/konsultasi')}`}>
              <i className="bi bi-chat-dots-fill"></i>
              <span>Konsultasi</span>
            </Link>}
            {(user.role === 'Mitra' || hasAccess('penjualan')) && <Link href="/dashboard/penjualan" className={`nav-item ${isActive('/dashboard/penjualan')}`}>
              <i className="bi bi-cart-fill"></i>
              <span>Data Penjualan</span>
            </Link>}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Analisis</div>
            {(user.role === 'Mitra' || hasAccess('leaderboard')) && <Link href="/dashboard/leaderboard" className={`nav-item ${isActive('/dashboard/leaderboard')}`}>
              <i className="bi bi-trophy-fill"></i>
              <span>Leaderboard</span>
            </Link>}
            {user.role !== 'Mitra' && hasAccess('scoring_rules') && <Link href="/dashboard/scoring-rules" className={`nav-item ${isActive('/dashboard/scoring-rules')}`}>
              <i className="bi bi-sliders2"></i>
              <span>Aturan Skor</span>
            </Link>}

            {user.role === 'Admin' && (
              <>
                <a href="#" className={`nav-item ${isLaporanActive} ${laporanExpanded ? 'expanded' : ''}`} onClick={(e) => { e.preventDefault(); setLaporanExpanded(!laporanExpanded); }}>
                  <i className="bi bi-file-earmark-bar-graph-fill"></i>
                  <span>Laporan</span>
                  <i className="bi bi-chevron-right nav-arrow"></i>
                </a>
                <div className={`nav-submenu ${isLaporanActive || laporanExpanded ? 'show' : ''}`} id="laporanSubmenu">
                  <Link href="/dashboard/laporan/umkm" className={`nav-item ${isActive('/dashboard/laporan/umkm')}`}><i className="bi bi-dot"></i> UMKM Binaan</Link>
                  <Link href="/dashboard/laporan/produk" className={`nav-item ${isActive('/dashboard/laporan/produk')}`}><i className="bi bi-dot"></i> Produk UMKM</Link>
                  <Link href="/dashboard/laporan/perkembangan" className={`nav-item ${isActive('/dashboard/laporan/perkembangan')}`}><i className="bi bi-dot"></i> Perkembangan</Link>
                  <Link href="/dashboard/laporan/pelatihan" className={`nav-item ${isActive('/dashboard/laporan/pelatihan')}`}><i className="bi bi-dot"></i> Pelatihan</Link>
                  <Link href="/dashboard/laporan/pendampingan" className={`nav-item ${isActive('/dashboard/laporan/pendampingan')}`}><i className="bi bi-dot"></i> Pendampingan</Link>
                  <Link href="/dashboard/laporan/kehadiran" className={`nav-item ${isActive('/dashboard/laporan/kehadiran')}`}><i className="bi bi-dot"></i> Kehadiran</Link>
                  <Link href="/dashboard/laporan/penjualan" className={`nav-item ${isActive('/dashboard/laporan/penjualan')}`}><i className="bi bi-dot"></i> Penjualan</Link>
                  <Link href="/dashboard/laporan/statistik" className={`nav-item ${isActive('/dashboard/laporan/statistik')}`}><i className="bi bi-dot"></i> Statistik</Link>
                  <Link href="/dashboard/laporan/evaluasi" className={`nav-item ${isActive('/dashboard/laporan/evaluasi')}`}><i className="bi bi-dot"></i> Evaluasi Program</Link>
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
              <span>{user.role === 'Admin' ? 'Admin' : user.role === 'Staff' ? 'Staff' : 'Mitra'}</span>
            </div>
          </div>
          {user.role !== 'Mitra' && (
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
            <button className="btn-toggle-sidebar" id="toggleSidebar" onClick={() => setSidebarActive(!sidebarActive)} style={{ marginRight: '12px' }}>
              <i className="bi bi-list"></i>
            </button>
            <span className="page-title">UMKM Monitor</span>
          </div>
          <div className="header-actions">
            {/* Style for Notification Dropdown */}
            <style>{`
              .notification-wrapper {
                position: relative;
                display: inline-block;
              }
              .notification-dropdown {
                position: absolute;
                top: 45px;
                right: 0;
                width: 320px;
                max-height: 420px;
                background: #ffffff;
                border: 1px solid rgba(0, 0, 0, 0.08);
                border-radius: 16px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              }
              .notification-header {
                padding: 14px 16px;
                border-bottom: 1px solid rgba(0,0,0,0.08);
                background: #f8f9fa;
              }
              .notification-body {
                overflow-y: auto;
                flex-grow: 1;
                max-height: 350px;
              }
              .notification-item {
                padding: 12px 16px;
                border-bottom: 1px solid rgba(0,0,0,0.05);
                cursor: pointer;
                transition: all 0.2s ease;
                background: #ffffff;
              }
              .notification-item:hover {
                background: #f8f9fa;
              }
              .notification-item.unread {
                background: rgba(13, 110, 253, 0.03);
              }
              .notification-item.unread:hover {
                background: rgba(13, 110, 253, 0.06);
              }
              .notification-dot {
                width: 8px;
                height: 8px;
                background-color: #0d6efd;
                border-radius: 50%;
                flex-shrink: 0;
                margin-top: 6px;
                box-shadow: 0 0 8px rgba(13, 110, 253, 0.5);
              }
              .fs-xxs {
                font-size: 0.675rem;
              }
              .line-clamp-2 {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              
              @media (max-width: 576px) {
                .notification-dropdown {
                  position: fixed;
                  top: 60px;
                  right: 16px;
                  left: 16px;
                  width: auto;
                }
              }
              
              /* Dark Mode Adaptations */
              [data-theme='dark'] .notification-dropdown {
                background: #111827;
                border-color: rgba(255, 255, 255, 0.08) !important;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
              }
              [data-theme='dark'] .notification-header {
                background: #1f2937;
                border-bottom-color: rgba(255, 255, 255, 0.08);
                color: #ffffff;
              }
              [data-theme='dark'] .notification-item {
                background: #111827;
                border-bottom-color: rgba(255, 255, 255, 0.05);
              }
              [data-theme='dark'] .notification-item:hover {
                background: #1f2937;
              }
              [data-theme='dark'] .notification-item.unread {
                background: rgba(13, 110, 253, 0.1);
              }
              [data-theme='dark'] .notification-item.unread:hover {
                background: rgba(13, 110, 253, 0.15);
              }
              [data-theme='dark'] .notification-icon {
                background-color: rgba(255, 255, 255, 0.05) !important;
              }
              [data-theme='dark'] .notification-icon i {
                color: #ffffff !important;
              }
              [data-theme='dark'] .text-dark {
                color: #f3f4f6 !important;
              }
            `}</style>

            {/* Notification Bell Dropdown */}
            <div className="notification-wrapper me-3">
              <button 
                className={`btn btn-sm rounded-circle position-relative ${theme === 'dark' ? 'btn-dark' : 'btn-light'}`} 
                onClick={() => setShowNotifications(!showNotifications)} 
                title="Notifikasi"
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bi bi-bell-fill" style={{ fontSize: '1rem' }}></i>
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem', padding: '0.25em 0.5em', marginTop: '4px', marginLeft: '-4px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="notification-dropdown shadow-lg animate-slide-down">
                    <div className="notification-header d-flex justify-content-between align-items-center">
                      <span className="fw-bold fs-sm">Notifikasi</span>
                      {unreadCount > 0 && (
                        <button className="btn btn-sm btn-link text-decoration-none p-0 fs-xs fw-semibold" onClick={handleMarkAllRead}>
                          Tandai semua dibaca
                        </button>
                      )}
                    </div>
                    <div className="notification-body">
                      {notifications.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                          <i className="bi bi-bell-slash fs-3 mb-2 d-block opacity-50"></i>
                          <span className="fs-xs">Tidak ada notifikasi</span>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const iconClass = notif.tipe === 'chat' 
                            ? 'bi-chat-left-dots-fill text-primary' 
                            : notif.tipe === 'naik_kelas' 
                              ? 'bi-trophy-fill text-warning' 
                              : 'bi-bell-fill text-secondary';
                          
                          return (
                            <div 
                              key={notif.id} 
                              className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                              onClick={() => handleNotificationClick(notif)}
                            >
                              <div className="d-flex gap-2 align-items-start">
                                <div className="notification-icon bg-light rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: '34px', height: '34px', flexShrink: 0 }}>
                                  <i className={`bi ${iconClass}`} style={{ fontSize: '1rem' }}></i>
                                </div>
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <div className="d-flex justify-content-between align-items-start gap-1">
                                    <span className="fw-semibold text-dark fs-xs line-clamp-1">{notif.judul}</span>
                                    {!notif.is_read && <span className="notification-dot" />}
                                  </div>
                                  <p className="text-muted mb-1 fs-xxs line-clamp-2" style={{ lineHeight: '1.4' }}>{notif.pesan}</p>
                                  <span className="text-muted fs-xxs opacity-70">
                                    {new Date(notif.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className={`btn btn-sm rounded-circle me-3 ${theme === 'dark' ? 'btn-dark' : 'btn-light'}`} onClick={toggleTheme} title="Ganti Tema" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
