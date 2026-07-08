-- Migration: Ban UMKM for failed attendance
-- Jalankan di Supabase SQL Editor

ALTER TABLE umkm 
ADD COLUMN IF NOT EXISTS failed_absent_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;
