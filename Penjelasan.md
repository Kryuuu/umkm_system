# Dokumentasi Sistem Manajemen UMKM (UMKM Management System)

Dokumen ini berisi penjelasan lengkap mengenai fitur-fitur aplikasi dan susunan (skema) database yang digunakan. Dokumen ini dapat digunakan sebagai acuan penyusunan laporan proyek/skripsi dari Bab 1 (Latar Belakang & Ruang Lingkup) hingga Bab 5 (Implementasi & Pengujian).

---

## 1. Penjelasan Fitur Aplikasi (Fungsi Modul)

Aplikasi ini dirancang sebagai platform terintegrasi untuk membina, mengawasi, dan mengembangkan kualitas Usaha Mikro, Kecil, dan Menengah (UMKM). Berikut adalah daftar fitur utamanya:

### 1.1. Dashboard Interaktif (Pusat Kendali Eksekutif & UMKM)
- **Dashboard Admin/Fasilitator**: Menampilkan ringkasan statistik (total UMKM binaan, total omzet keseluruhan, serapan tenaga kerja, jangkauan pelanggan) secara *real-time* dengan sajian grafik pertumbuhan.
- **Dashboard UMKM**: Menampilkan statistik personal (omzet pribadi, skor usaha, status skala usaha) dan daftar *to-do/recommendation* untuk naik kelas.

### 1.2. Manajemen Master Data UMKM & Fasilitator
- **Manajemen UMKM**: Admin dapat mendaftarkan, mengedit, dan menghapus data profil UMKM (termasuk menunjuk Fasilitator/Pendamping untuk UMKM tertentu).
- **Manajemen Fasilitator**: Pengelolaan akun Admin, Staff, dan Mitra (Fasilitator). Sistem dilengkapi dengan kontrol Hak Akses (*Role-Based Access Control*) untuk membatasi wewenang setiap peran.

### 1.3. Manajemen Produk dan Penjualan (Katalog Bisnis)
- **Katalog Produk**: UMKM dapat menambahkan dan mengelola daftar produk mereka (nama produk, kategori, harga).
- **Pencatatan Penjualan**: Pencatatan log transaksi (produk yang terjual, kuantitas, total harga) guna memudahkan kalkulasi keuntungan atau omzet.

### 1.4. Monitoring Kinerja Bulanan
- Modul untuk mencatat evaluasi bisnis UMKM setiap bulan. 
- Metrik yang dinilai meliputi pencapaian **Omzet**, jumlah **Tenaga Kerja**, dan jangkauan **Pelanggan**. Data dari modul ini digunakan sebagai acuan pertumbuhan bisnis.

### 1.5. Analisis AI & Learnbook (Sistem Cerdas)
- Sistem akan membaca histori omzet, produk, dan laporan monitoring UMKM lalu melakukan **Analisis Otomatis menggunakan AI (Artificial Intelligence)**.
- **Learnbook**: Fitur edukasi personal. AI memberikan nilai **Skor Usaha** (0-100) beserta daftar rekomendasi tindakan/tugas yang harus dilakukan agar UMKM bisa "Go Global".

### 1.6. Modul Pelatihan & Sistem Absensi QR Code (Real-time)
- **Pengelolaan Jadwal**: Admin dapat menjadwalkan program pelatihan atau seminar untuk UMKM (menetapkan kuota, lokasi, dan tanggal).
- **Sistem Scan QR Code**: Proses absensi dilakukan secara digital dan *real-time* melalui pindai (*scan*) QR Code oleh fasilitator atau scan mandiri oleh UMKM dengan menggunakan kamera *smartphone*, dilengkapi dengan sistem token yang aman.

### 1.7. Pendampingan (Mentoring / Coaching)
- Fitur untuk menjadwalkan dan mencatat hasil sesi *coaching* pribadi antara Fasilitator dan pemilik UMKM. Termasuk perekaman topik, kendala, serta catatan hasil pendampingan.

### 1.8. Live Konsultasi (Sistem Chat)
- Ruang obrolan/pesan yang memungkinkan pelaku UMKM berkonsultasi langsung dengan Fasilitator, Staff, atau Admin secara *asynchronous*. Fitur ini mempermudah pelacakan riwayat konsultasi serta pengelompokan (grouping) *thread* obrolan per UMKM.

### 1.9. Leaderboard (Peringkat UMKM)
- Sistem gamifikasi yang menampilkan daftar peringkat UMKM terbaik berdasarkan **Skor Usaha** tertinggi. Hal ini dirancang untuk menciptakan lingkungan persaingan yang sehat dan kompetitif antar UMKM binaan.

### 1.10. Sistem Notifikasi Otomatis
- Pusat pemberitahuan cerdas (Notifikasi) yang mengirim alert kepada user berdasarkan wewenangnya (misalnya: notifikasi acara pelatihan baru untuk UMKM, notifikasi pesan konsultasi masuk untuk Admin).

---

## 2. Susunan Database (Struktur Tabel)

Aplikasi ini menggunakan basis data relasional (menggunakan Supabase/PostgreSQL) dengan struktur tabel utama sebagai berikut:

### `umkm` (Tabel Induk Pelaku Usaha)
Menyimpan profil inti dari entitas UMKM binaan.
- `id` (Primary Key)
- `nama_umkm` (Nama perusahaan/usaha)
- `nama_pemilik` (Nama penanggung jawab)
- `status_usaha` (Skala bisnis saat ini, misal: Pemula, Berkembang)
- `skor_usaha` (Nilai akumulatif dari perhitungan performa / AI)
- `rekomendasi` (Catatan rekomendasi langkah dari hasil analisis AI)
- `fasilitator_id` (Foreign Key - Pembina yang bertanggung jawab)

### `fasilitator` (Tabel Pengguna/Admin/Staff)
Menyimpan data *user management* untuk pihak internal pengelola.
- `id` (Primary Key)
- `username` & `password` (Kredensial login)
- `nickname` (Nama tampilan)
- `role` (Hak akses pengguna: *Admin, Staff, Mitra*)
- `domisili`, `no_telpon`, `email`, `agama` (Data demografi/kontak)

### `produk` (Tabel Katalog Barang/Jasa)
- `id` (Primary Key)
- `umkm_id` (Foreign Key - Relasi kepemilikan produk)
- `nama_produk` (Nama barang/jasa)
- `kategori_produk` (Klasifikasi jenis barang)
- `harga_produk` (Harga per satuan)

### `penjualan` (Tabel Transaksi/Sales)
- `id` (Primary Key)
- `umkm_id` (Foreign Key)
- `produk_id` (Foreign Key - Merujuk ke barang yang terjual)
- `jumlah` (Kuantitas penjualan)
- `total_harga` (Nominal transaksi)
- `tanggal_penjualan` (Waktu transaksi terjadi)

### `monitoring` (Tabel Evaluasi Berkala)
- `id` (Primary Key)
- `umkm_id` (Foreign Key)
- `bulan` & `tahun` (Periode pendataan)
- `omzet` (Pendapatan kotor bulan terkait)
- `jumlah_tenaga_kerja` (Pertambahan/pengurangan karyawan)
- `jumlah_pelanggan` (Estimasi jangkauan pasar bulan tersebut)

### `pelatihan` (Tabel Event/Kegiatan)
- `id` (Primary Key)
- `nama_pelatihan` (Judul acara)
- `tanggal` (Jadwal pelaksanaan)
- `lokasi` (Tempat diselenggarakan)
- `kuota` (Batas maksimal peserta)
- `deskripsi` (Rincian acara)

### `kehadiran` (Tabel Absensi Event)
- `id` (Primary Key)
- `pelatihan_id` (Foreign Key - Merujuk ke event terkait)
- `umkm_id` (Foreign Key - Peserta yang hadir)
- `waktu_scan` (Timestamp saat QR Code berhasil diverifikasi)
- `status` (Hadir/Izin/Tidak Hadir)

### `pendampingan` (Tabel Riwayat Mentoring)
- `id` (Primary Key)
- `umkm_id` (Foreign Key)
- `fasilitator_id` (Foreign Key)
- `tanggal` (Waktu sesi dilaksanakan)
- `topik` (Fokus pembicaraan / kendala utama)
- `catatan` (Hasil, kesimpulan, atau tindak lanjut dari sesi)

### `konsultasi` (Tabel Chat/Tiket Bantuan)
- `id` (Primary Key)
- `umkm_id` (Foreign Key)
- `pengirim_role` (Tanda apakah pesan dikirim oleh 'umkm', 'Admin', 'Staff', atau 'Mitra')
- `pesan` (Isi teks chat)
- `tanggal` (Waktu pengiriman pesan)
- `lampiran` (File/gambar pendukung jika ada)

### `learnbook` (Tabel Tugas & Kurikulum AI)
- `id` (Primary Key)
- `umkm_id` (Foreign Key)
- `materi` / `tugas` (Daftar action item yang diberikan AI untuk diselesaikan)
- `status` (Pending, Progress, Selesai)
- `hasil_analisis` (Alasan *Why* dibalik pemberian tugas tersebut)

### `notifikasi` (Tabel Sistem Alert)
- `id` (Primary Key)
- `target_role` (Kepada siapa notifikasi dikirimkan)
- `pesan` (Konten pemberitahuan)
- `status_baca` (Flag untuk menandai Unread/Read)
- `tanggal` (Waktu notifikasi di-*trigger*)

---

*Catatan: Dokumen ini disusun khusus sebagai bahan referensi dan copy-paste terstruktur untuk penulisan karya tulis / skripsi. Seluruh arsitektur tabel sudah mengacu pada penerapan operasional di platform UMKM System.*
