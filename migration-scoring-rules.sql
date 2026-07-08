-- Migration: Tabel Aturan Skor (Point Rules) untuk Leaderboard
-- Jalankan script ini di Supabase SQL Editor

-- 1. Buat tabel scoring_rules
CREATE TABLE IF NOT EXISTS scoring_rules (
  id SERIAL PRIMARY KEY,
  kategori VARCHAR(50) NOT NULL,           -- 'omzet', 'produk', 'tenaga_kerja', 'pelanggan', 'legalitas'
  label VARCHAR(100) NOT NULL,             -- Nama tampilan di UI
  deskripsi TEXT,                           -- Penjelasan aturan
  kondisi_min NUMERIC DEFAULT 0,           -- Nilai minimum (>=)
  kondisi_max NUMERIC DEFAULT NULL,        -- Nilai maksimum (<), NULL = tak terbatas
  poin INTEGER NOT NULL DEFAULT 0,         -- Poin yang diberikan
  max_poin INTEGER DEFAULT NULL,           -- Maks poin untuk kategori ini
  urutan INTEGER DEFAULT 0,                -- Urutan tampil
  is_active BOOLEAN DEFAULT TRUE,
  updated_by INTEGER REFERENCES fasilitator(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tambahkan permission baru ke default permissions
ALTER TABLE fasilitator
ALTER COLUMN permissions SET DEFAULT ARRAY[
  'umkm_master', 'umkm_data', 'produk', 'monitoring', 'pelatihan',
  'pendampingan', 'konsultasi', 'penjualan', 'leaderboard', 'scoring_rules'
]::TEXT[];

-- 3. Berikan akses scoring_rules ke staff yang sudah punya akses leaderboard
UPDATE fasilitator
SET permissions = array_append(permissions, 'scoring_rules')
WHERE role = 'Staff'
  AND 'leaderboard' = ANY(permissions)
  AND NOT ('scoring_rules' = ANY(permissions));

-- 4. Seed data aturan skor default (Hanya berfokus pada Omzet)

-- Kategori: Omzet (max 100 poin)
INSERT INTO scoring_rules (kategori, label, deskripsi, kondisi_min, kondisi_max, poin, max_poin, urutan) VALUES
('omzet', 'Omzet >= Rp 25.000.000', 'Omzet bulanan mencapai 25 juta atau lebih', 25000000, NULL, 100, 100, 1),
('omzet', 'Omzet >= Rp 15.000.000', 'Omzet bulanan antara 15 juta - 25 juta', 15000000, 25000000, 85, 100, 2),
('omzet', 'Omzet >= Rp 10.000.000', 'Omzet bulanan antara 10 juta - 15 juta', 10000000, 15000000, 70, 100, 3),
('omzet', 'Omzet >= Rp 5.000.000', 'Omzet bulanan antara 5 juta - 10 juta', 5000000, 10000000, 50, 100, 4),
('omzet', 'Omzet >= Rp 2.000.000', 'Omzet bulanan antara 2 juta - 5 juta', 2000000, 5000000, 30, 100, 5),
('omzet', 'Omzet < Rp 2.000.000', 'Omzet bulanan di bawah 2 juta', 0, 2000000, 15, 100, 6);

-- 5. Buat tabel log perubahan (opsional, untuk audit trail)
CREATE TABLE IF NOT EXISTS scoring_rules_log (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES scoring_rules(id) ON DELETE CASCADE,
  field_changed VARCHAR(50),
  old_value TEXT,
  new_value TEXT,
  changed_by INTEGER REFERENCES fasilitator(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
