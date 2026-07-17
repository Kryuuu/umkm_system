# Penjelasan Sistem Absensi (QR & Manual) dan Sistem Penilaian (Scoring) UMKM

Dokumen ini menjelaskan secara teknis dan konseptual alur kerja serta implementasi dari **Sistem Kehadiran (Absensi)** dan **Sistem Penilaian (Scoring & Leaderboard)** pada platform manajemen UMKM ini.

---

## 1. Sistem Absensi dan Kehadiran (QR & Kode Manual)

Sistem absensi pelatihan dikembangkan dengan berfokus pada kemudahan akses (multi-metode) serta keamanan yang tinggi untuk mencegah kecurangan (anti-cheat & token rotation).

### A. Metode Pemindaian (Frontend)
Terdapat dua metode untuk melakukan absensi melalui antarmuka `ScanClient.tsx`:
1. **Pemindaian QR Code (Kamera)**:
   - Terintegrasi menggunakan pustaka `html5-qrcode`.
   - Secara default akan memprioritaskan kamera belakang (`facingMode: "environment"`).
   - Terdapat penanganan error untuk *Insecure Context* (HTTP tanpa localhost), yang akan memandu pengguna mengaktifkan HTTPS atau memberikan akses izin kamera jika diblokir oleh browser.
2. **Kode Manual (Alternatif)**:
   - Sebagai solusi jika kamera bermasalah, pengguna dapat menginput 8 karakter kode manual.
   - Kode manual ini sinkron dengan QR Code (diambil dari sebagian/potongan UUID QR code) dan divalidasi dengan cara yang sama.

### B. Rotasi Token & Masa Aktif (Security)
Absensi menggunakan token berbasis UUID untuk meminimalisasi tebakan acak.
- **Masa Aktif Singkat**: Setiap QR/Token (UUID) yang di-_generate_ (`generateQrTokenAction`) hanya berlaku selama **5 menit**.
- **Rotasi Otomatis (Immediate Rotation)**: Hal ini merupakan fitur keamanan utama. Saat 1 (satu) UMKM berhasil memindai dan tercatat hadir, sistem secara otomatis *memutar/membuat ulang* QR Token baru untuk pelatihan tersebut (`verifyQrTokenAndRecordPresence`). Ini memastikan QR code yang disebarkan / di-screenshot ke grup WhatsApp tidak akan bisa digunakan oleh UMKM lain karena tokennya langsung hangus dan berganti.

### C. Sistem Anti-Spam (3-Strike Ban)
Sistem memiliki mekanisme penalti untuk mencegah brute force atau spam kode absen acak:
- **Pencatatan Kegagalan (`failed_absent_attempts`)**: Jika token yang discan sudah kedaluwarsa atau salah, hitungan kesalahan di tabel UMKM akan bertambah.
- **Pemblokiran (Banned)**: Jika UMKM salah memasukkan kode sebanyak **3 kali berturut-turut**, akunnya otomatis diblokir (`is_banned = true`) khusus dari sistem absensi.
- **Reset Otomatis**: Jika berhasil memasukkan token yang benar sebelum mencapai 3 kali, hitungan kesalahannya akan di-_reset_ kembali ke 0.

### D. Pemulihan Akses (Unban & Thread Konsultasi)
Bila UMKM terkena blokir, antarmuka (SweetAlert) akan menampilkan tombol **"Lapor Admin"**:
- Memanggil fungsi `reportBanToAdminAction()`.
- Secara otomatis meng-generate tiket/thread baru di modul **Konsultasi**.
- Pesan otomatis berbunyi "Permohonan Buka Blokir Absensi" dikirimkan atas nama UMKM.
- Notifikasi akan terkirim kepada Fasilitator terkait dan seluruh Admin, meminta mereka untuk meninjau dan membuka blokir UMKM.

---

## 2. Sistem Penilaian (Dynamic Scoring & Leaderboard)

Sistem *Scoring* untuk Leaderboard dibuat sangat dinamis, mengikuti aturan yang bisa di-_setting_ bebas oleh Admin tanpa harus mengedit kode sistem (hardcode).

### A. Aturan Berbasis Database (Dynamic Rules)
Aturan hitung (*Scoring Rules*) disimpan di dalam tabel `scoring_rules`.
- Fungsi `fetchScoringRules()` mengambil seluruh aturan yang aktif dari database, lalu mengelompokkannya berdasarkan kategori (contoh: *omzet*).
- Hal ini memungkinkan Admin menambah, menghapus, atau mengubah rentang omzet dan jumlah poin dari halaman panel tanpa *downtime*.

### B. Logika Reset Bulanan (Monthly Reset)
Agar Leaderboard dapat mencerminkan performa kompetitif yang *real-time* dan adil:
- Skor dikalkulasi secara eksklusif menggunakan nilai omzet (dari tabel `monitoring`) pada **bulan dan tahun saat ini (Current Date)**.
- Jika UMKM belum mengisi laporan omzet pada bulan yang sedang berjalan, omzetnya dianggap `0` untuk bulan tersebut.
- Hal ini secara tidak langsung me-_reset_ *leaderboard* setiap tanggal 1, memacu UMKM untuk rutin melaporkan monitoring bulanan mereka.

### C. Poin Tak Terbatas (Unlimited Score Limit)
Berbeda dengan sistem penilaian konvensional yang membatasi nilai mentok di 100 poin, sistem menggunakan penghitungan skala (*scale*):
- Pada urutan aturan yang paling tinggi (di mana `kondisi_max = null`), sistem akan menghitung seberapa jauh pencapaian UMKM dibandingkan batas bawahnya (`kondisi_min`).
- *Multiplier*: Jika *rule* maksimum adalah 100 poin untuk omzet >= Rp 25 juta, lalu UMKM mencapai Rp 50 juta, maka rasio poin akan berlipat mengikuti skala (50juta / 25juta * 100 poin).

### D. Sistem "Naik Kelas" (Leveling Up) & Notifikasi
Berdasarkan *Total Score* terbaru, UMKM akan dikategorikan ulang kelas bisnisnya (Fungsi `calculateScore`):
1. **Go Modern** (Skor 0 - 49)
2. **Go Digital** (Skor 50 - 69)
3. **Go Online** (Skor 70 - 84)
4. **Go Global** (Skor >= 85)

Ketika level *status_usaha* UMKM berpindah ke level yang lebih tinggi:
- Notifikasi otomatis (Tipe: `naik_kelas`) masuk ke Dashboard **UMKM**.
- Notifikasi kebanggaan juga terkirim ke **Fasilitator** pendamping UMKM tersebut (`target_id: umkm.fasilitator_id`).

### E. Integrasi AI (Gemini AI Recommendation)
Setiap kali skor direkalkulasi:
- Data pencapaian omzet, kelas bisnis yang baru, dan skor diproses lalu dikirimkan sebagai _prompt_ ke **Google Gemini AI**.
- Gemini akan merespons (via *Generative Language API*) dengan saran 1 paragraf (maks. 30 kata) mengenai *next-step* yang konkret bagi UMKM tersebut.
- Saran ini otomatis tersimpan di kolom `rekomendasi` dan ditampilkan pada profil UMKM.
