-- SQL Migration Script to Update Constraints and Roles
-- Run this in the Supabase SQL Editor.

-- 1. Drop existing check constraints
ALTER TABLE fasilitator DROP CONSTRAINT IF EXISTS fasilitator_role_check;
ALTER TABLE konsultasi DROP CONSTRAINT IF EXISTS konsultasi_pengirim_role_check;
ALTER TABLE notifikasi DROP CONSTRAINT IF EXISTS notifikasi_target_role_check;

-- 2. Update existing records in the database (Must be done BEFORE adding the constraints back)
-- For fasilitator table:
UPDATE fasilitator SET role = 'Admin' WHERE role = 'Admin Staff';
UPDATE fasilitator SET role = 'Staff' WHERE role = 'Mitra';

-- For konsultasi table:
UPDATE konsultasi SET pengirim_role = 'Admin' WHERE pengirim_role = 'Admin Staff';
UPDATE konsultasi SET pengirim_role = 'Staff' WHERE pengirim_role = 'Mitra';
UPDATE konsultasi SET pengirim_role = 'Mitra' WHERE pengirim_role = 'umkm';

-- For notifikasi table:
UPDATE notifikasi SET target_role = 'Admin' WHERE target_role = 'Admin Staff';
UPDATE notifikasi SET target_role = 'Staff' WHERE target_role = 'Mitra';
UPDATE notifikasi SET target_role = 'Mitra' WHERE target_role = 'umkm';

-- 3. Add new check constraints allowing Admin, Staff, and Mitra
ALTER TABLE fasilitator ADD CONSTRAINT fasilitator_role_check CHECK (role IN ('Admin', 'Staff'));
ALTER TABLE konsultasi ADD CONSTRAINT konsultasi_pengirim_role_check CHECK (pengirim_role IN ('Admin', 'Staff', 'Mitra'));
ALTER TABLE notifikasi ADD CONSTRAINT notifikasi_target_role_check CHECK (target_role IN ('Admin', 'Staff', 'Mitra'));

-- 4. Hak akses modular untuk akun Staff
ALTER TABLE fasilitator
ADD COLUMN IF NOT EXISTS permissions TEXT[] NOT NULL DEFAULT ARRAY[
  'umkm_master', 'umkm_data', 'produk', 'monitoring', 'pelatihan',
  'pendampingan', 'konsultasi', 'penjualan', 'leaderboard'
]::TEXT[];

-- Admin selalu dikendalikan oleh role dan tidak dibatasi daftar permission.
-- Staff lama diberi akses yang sebelumnya sudah mereka miliki agar migrasi tidak memutus pekerjaan.
UPDATE fasilitator
SET permissions = ARRAY[
  'umkm_master', 'umkm_data', 'produk', 'monitoring', 'pelatihan',
  'pendampingan', 'konsultasi', 'penjualan', 'leaderboard'
]::TEXT[]
WHERE role = 'Staff' AND (permissions IS NULL OR cardinality(permissions) = 0);

-- 5. Tambah kolom ID UMKM manual (seperti project PHP lama: UMKM-001)
ALTER TABLE umkm ADD COLUMN IF NOT EXISTS id_umkm VARCHAR(50) UNIQUE;
