import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import DataTableInitializer from "@/components/DataTableInitializer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "UMKM Monitor - Rumah BUMN",
  description: "Sistem Informasi Manajemen UMKM Rumah BUMN",
  icons: {
    icon: "/rumah-bumn-icon.png",
    apple: "/rumah-bumn-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents auto-zoom on iOS when tapping inputs
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-theme="light" suppressHydrationWarning>
      <head>
        {/* DataTables CSS */}
        <link href="https://cdn.datatables.net/1.13.8/css/dataTables.bootstrap5.min.css" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            const currentTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
          `
        }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <div className="sidebar-overlay" id="sidebarOverlay"></div>
        <Script src="https://code.jquery.com/jquery-3.7.1.min.js" strategy="beforeInteractive" />
        <Script src="https://cdn.datatables.net/1.13.8/js/jquery.dataTables.min.js" strategy="afterInteractive" />
        <Script src="https://cdn.datatables.net/1.13.8/js/dataTables.bootstrap5.min.js" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/sweetalert2@11" strategy="afterInteractive" />
        <DataTableInitializer />
        
        {children}

        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
