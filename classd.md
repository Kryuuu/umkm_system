# Class Diagram & Kamus Data Sistem UMKM

Dokumen ini berisi struktur entitas sistem UMKM, direpresentasikan melalui Mermaid Class Diagram (dengan informasi tipe data dan panjang/width), serta dijabarkan secara detail dalam bentuk tabel (Kamus Data).

## 1. Class Diagram

```mermaid
classDiagram
    class Fasilitator {
        +int id [PK]
        +varchar(50) username
        +varchar(255) password
        +varchar(100) nickname
        +varchar(150) domisili
        +varchar(20) no_telpon
        +varchar(30) agama
        +varchar(100) email
        +varchar(50) role
        +varchar(255) foto
        +text[] permissions
        +timestamp created_at
        +timestamp updated_at
    }

    class UMKM {
        +int id [PK]
        +varchar(50) id_umkm
        +int fasilitator_id [FK]
        +varchar(200) nama_umkm
        +varchar(150) nama_pemilik
        +varchar(50) username
        +varchar(255) password
        +varchar(20) no_telpon
        +varchar(100) email
        +varchar(20) nik
        +varchar(50) nib
        +varchar(255) sertifikat_halal
        +date halal_berlaku
        +varchar(255) sertifikat_pirt
        +date pirt_berlaku
        +varchar(255) dokumen_nib
        +date nib_berlaku
        +text alamat
        +varchar(100) domisili
        +text deskripsi
        +decimal(5,2) skor_usaha
        +varchar(50) status_usaha
        +text rekomendasi
        +timestamp created_at
        +timestamp updated_at
    }

    class Pelatihan {
        +int id [PK]
        +varchar(200) nama_pelatihan
        +date tanggal
        +varchar(150) pemateri
        +varchar(200) lokasi
        +text deskripsi
        +varchar(255) file_materi
        +timestamp created_at
        +timestamp updated_at
    }

    class KehadiranPelatihan {
        +int id [PK]
        +int pelatihan_id [FK]
        +int umkm_id [FK]
        +varchar(50) status_hadir
        +timestamp created_at
    }

    class Monitoring {
        +int id [PK]
        +int umkm_id [FK]
        +varchar(20) bulan
        +int tahun
        +decimal(15,2) omzet
        +int jumlah_produk
        +int jumlah_tenaga_kerja
        +int jumlah_pelanggan
        +varchar(255) media_pemasaran
        +text catatan
        +timestamp created_at
        +timestamp updated_at
    }

    class Pendampingan {
        +int id [PK]
        +int umkm_id [FK]
        +date tanggal
        +varchar(200) jenis_pendampingan
        +text hasil
        +text catatan
        +timestamp created_at
        +timestamp updated_at
    }

    class Produk {
        +int id [PK]
        +int umkm_id [FK]
        +varchar(200) nama_produk
        +varchar(100) kategori_produk
        +decimal(15,2) harga_produk
        +text deskripsi_produk
        +varchar(255) foto_produk
        +timestamp created_at
        +timestamp updated_at
    }

    class Penjualan {
        +int id [PK]
        +int umkm_id [FK]
        +int produk_id [FK]
        +date tanggal
        +int jumlah
        +decimal(15,2) total_harga
        +text catatan
        +timestamp created_at
    }

    class Konsultasi {
        +int id [PK]
        +int umkm_id [FK]
        +varchar(50) pengirim_role
        +int pengirim_id
        +varchar(255) subjek
        +text pesan
        +int parent_id [FK]
        +boolean is_read
        +timestamp created_at
    }

    class Notifikasi {
        +int id [PK]
        +varchar(50) target_role
        +int target_id
        +varchar(50) tipe
        +varchar(255) judul
        +text pesan
        +boolean is_read
        +timestamp created_at
    }

    class Learnbook {
        +int id [PK]
        +int umkm_id [FK]
        +int batch_id
        +varchar(255) judul
        +text deskripsi
        +text konten_html
        +varchar(255) tugas_judul
        +text tugas_deskripsi
        +int urutan
        +varchar(50) status
        +timestamp completed_at
        +timestamp created_at
        +timestamp updated_at
    }

    %% Relationships
    Fasilitator "1" -- "0..*" UMKM : membina
    UMKM "1" -- "0..*" Monitoring : memiliki
    UMKM "1" -- "0..*" Pendampingan : mendapat
    UMKM "1" -- "0..*" Produk : mendaftarkan
    UMKM "1" -- "0..*" Penjualan : mencatat
    Produk "1" -- "0..*" Penjualan : dicatat dalam
    UMKM "1" -- "0..*" KehadiranPelatihan : menghadiri
    Pelatihan "1" -- "0..*" KehadiranPelatihan : absen
    UMKM "1" -- "0..*" Konsultasi : thread
    Konsultasi "1" -- "0..*" Konsultasi : membalas
    UMKM "1" -- "0..*" Learnbook : belajar
```

---

## 2. Struktur Tabel Entitas (Kamus Data)

Berikut rincian setiap tabel dan panjang (*width*) setiap field sesuai dengan struktur *database*.

### 1. Tabel `fasilitator`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `username` | VARCHAR | 50 | UNIQUE, username login |
| `password` | VARCHAR | 255 | Password terenkripsi |
| `nickname` | VARCHAR | 100 | Nama panggilan fasilitator |
| `domisili` | VARCHAR | 150 | Alamat/domisili |
| `no_telpon` | VARCHAR | 20 | Nomor kontak |
| `agama` | VARCHAR | 30 | - |
| `email` | VARCHAR | 100 | - |
| `role` | VARCHAR | 50 | Default 'Staff'. Check IN ('Admin', 'Staff') |
| `foto` | VARCHAR | 255 | URL/Path foto profil |
| `permissions` | TEXT[] | Array | Hak akses modular staff |
| `created_at` | TIMESTAMP | 8 Bytes | - |
| `updated_at` | TIMESTAMP | 8 Bytes | - |

### 2. Tabel `umkm`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `id_umkm` | VARCHAR | 50 | UNIQUE, Manual ID UMKM |
| `fasilitator_id` | INT | 4 Bytes | Foreign Key -> `fasilitator(id)` |
| `nama_umkm` | VARCHAR | 200 | Nama usaha |
| `nama_pemilik` | VARCHAR | 150 | Nama pemilik usaha |
| `username` | VARCHAR | 50 | UNIQUE, username login UMKM |
| `password` | VARCHAR | 255 | Password terenkripsi |
| `no_telpon` | VARCHAR | 20 | - |
| `email` | VARCHAR | 100 | - |
| `nik` | VARCHAR | 20 | NIK Pemilik |
| `nib` | VARCHAR | 50 | Nomor Induk Berusaha |
| `sertifikat_halal` | VARCHAR | 255 | URL/Path dokumen halal |
| `halal_berlaku` | DATE | 4 Bytes | Tanggal kedaluwarsa sertifikat |
| `sertifikat_pirt` | VARCHAR | 255 | URL/Path dokumen PIRT |
| `pirt_berlaku` | DATE | 4 Bytes | Tanggal kedaluwarsa PIRT |
| `dokumen_nib` | VARCHAR | 255 | URL/Path file dokumen NIB |
| `nib_berlaku` | DATE | 4 Bytes | Tanggal kedaluwarsa NIB |
| `alamat` | TEXT | Unlimited | Alamat detail |
| `domisili` | VARCHAR | 100 | - |
| `deskripsi` | TEXT | Unlimited | Penjelasan mengenai usaha |
| `skor_usaha` | DECIMAL | (5,2) | Angka total poin leaderboard/scoring |
| `status_usaha` | VARCHAR | 50 | Status misal: Pemula, Go Modern, dst |
| `rekomendasi` | TEXT | Unlimited | Rekomendasi otomatis AI |
| `created_at` | TIMESTAMP | 8 Bytes | - |
| `updated_at` | TIMESTAMP | 8 Bytes | - |

### 3. Tabel `pelatihan`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `nama_pelatihan` | VARCHAR | 200 | Topik/Judul pelatihan |
| `tanggal` | DATE | 4 Bytes | - |
| `pemateri` | VARCHAR | 150 | Nama narasumber |
| `lokasi` | VARCHAR | 200 | Tempat/Platform (Online/Offline) |
| `deskripsi` | TEXT | Unlimited | - |
| `file_materi` | VARCHAR | 255 | URL/Path dokumen materi pdf/ppt |
| `created_at` | TIMESTAMP | 8 Bytes | - |
| `updated_at` | TIMESTAMP | 8 Bytes | - |

### 4. Tabel `kehadiran_pelatihan`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `pelatihan_id` | INT | 4 Bytes | Foreign Key -> `pelatihan(id)` |
| `umkm_id` | INT | 4 Bytes | Foreign Key -> `umkm(id)` |
| `status_hadir` | VARCHAR | 50 | Check IN ('hadir', 'tidak_hadir', 'izin') |
| `created_at` | TIMESTAMP | 8 Bytes | - |

### 5. Tabel `monitoring`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `umkm_id` | INT | 4 Bytes | Foreign Key -> `umkm(id)` |
| `bulan` | VARCHAR | 20 | - |
| `tahun` | INT | 4 Bytes | - |
| `omzet` | DECIMAL | (15,2) | Pendapatan per bulan |
| `jumlah_produk` | INT | 4 Bytes | Varian produk yg dimiliki bulan ini |
| `jumlah_tenaga_kerja`| INT | 4 Bytes | Jumlah pekerja |
| `jumlah_pelanggan` | INT | 4 Bytes | Jumlah pelanggan bulanan |
| `media_pemasaran` | VARCHAR | 255 | Misal: IG, Tokopedia |
| `catatan` | TEXT | Unlimited | - |
| `created_at` | TIMESTAMP | 8 Bytes | - |
| `updated_at` | TIMESTAMP | 8 Bytes | - |

### 6. Tabel `pendampingan`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `umkm_id` | INT | 4 Bytes | Foreign Key -> `umkm(id)` |
| `tanggal` | DATE | 4 Bytes | - |
| `jenis_pendampingan`| VARCHAR | 200 | Kategori pendampingan |
| `hasil` | TEXT | Unlimited | - |
| `catatan` | TEXT | Unlimited | - |
| `created_at` | TIMESTAMP | 8 Bytes | - |
| `updated_at` | TIMESTAMP | 8 Bytes | - |

### 7. Tabel `produk`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `umkm_id` | INT | 4 Bytes | Foreign Key -> `umkm(id)` |
| `nama_produk` | VARCHAR | 200 | - |
| `kategori_produk` | VARCHAR | 100 | Makanan, Minuman, Kriya, dll |
| `harga_produk` | DECIMAL | (15,2) | - |
| `deskripsi_produk` | TEXT | Unlimited | - |
| `foto_produk` | VARCHAR | 255 | URL/Path foto |
| `created_at` | TIMESTAMP | 8 Bytes | - |
| `updated_at` | TIMESTAMP | 8 Bytes | - |

### 8. Tabel `penjualan`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `umkm_id` | INT | 4 Bytes | Foreign Key -> `umkm(id)` |
| `produk_id` | INT | 4 Bytes | Foreign Key -> `produk(id)` |
| `tanggal` | DATE | 4 Bytes | - |
| `jumlah` | INT | 4 Bytes | Jumlah item yang terjual |
| `total_harga` | DECIMAL | (15,2) | Harga X Jumlah |
| `catatan` | TEXT | Unlimited | - |
| `created_at` | TIMESTAMP | 8 Bytes | - |

### 9. Tabel `konsultasi`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `umkm_id` | INT | 4 Bytes | Foreign Key -> `umkm(id)` |
| `pengirim_role` | VARCHAR | 50 | 'Admin', 'Staff', atau 'Mitra' |
| `pengirim_id` | INT | 4 Bytes | ID user dari sender |
| `subjek` | VARCHAR | 255 | Judul/Topik konsultasi |
| `pesan` | TEXT | Unlimited | Isi konsultasi |
| `parent_id` | INT | 4 Bytes | Foreign Key -> `konsultasi(id)` untuk sistem balasan thread |
| `is_read` | BOOLEAN | 1 Byte | Status sudah dibaca atau belum |
| `created_at` | TIMESTAMP | 8 Bytes | - |

### 10. Tabel `notifikasi`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `target_role` | VARCHAR | 50 | Tujuan ('Admin', 'Staff', 'Mitra') |
| `target_id` | INT | 4 Bytes | ID penerima |
| `tipe` | VARCHAR | 50 | 'naik_kelas', 'sertifikasi_expired', 'info', 'chat' |
| `judul` | VARCHAR | 255 | Judul notif |
| `pesan` | TEXT | Unlimited | - |
| `is_read` | BOOLEAN | 1 Byte | - |
| `created_at` | TIMESTAMP | 8 Bytes | - |

### 11. Tabel `learnbook`
| Nama Field | Tipe Data | Panjang (Width) | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | SERIAL / INT | 4 Bytes | Primary Key |
| `umkm_id` | INT | 4 Bytes | Foreign Key -> `umkm(id)` |
| `batch_id` | INT | 4 Bytes | - |
| `judul` | VARCHAR | 255 | - |
| `deskripsi` | TEXT | Unlimited | - |
| `konten_html` | TEXT | Unlimited | Konten bacaan format HTML |
| `tugas_judul` | VARCHAR | 255 | - |
| `tugas_deskripsi` | TEXT | Unlimited | - |
| `urutan` | INT | 4 Bytes | Urutan modul (1, 2, 3...) |
| `status` | VARCHAR | 50 | 'locked', 'active', 'completed' |
| `completed_at` | TIMESTAMP | 8 Bytes | Kapan diselesaikan |
| `created_at` | TIMESTAMP | 8 Bytes | - |
| `updated_at` | TIMESTAMP | 8 Bytes | - |
