-- =============================================
-- SQL Migration: Fitur Auth Multi-Masjid
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Tabel profil masjid
CREATE TABLE IF NOT EXISTS masjid_profile (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nama_masjid TEXT NOT NULL,
  alamat_masjid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tambah kolom user_id di tabel penerimaan_zakat
ALTER TABLE penerimaan_zakat ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Tambah kolom user_id di tabel pengaturan
ALTER TABLE pengaturan ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. RLS Policies

-- masjid_profile
ALTER TABLE masjid_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can manage own profile" ON masjid_profile FOR ALL USING (auth.uid() = id);
CREATE POLICY "Public can view profiles" ON masjid_profile FOR SELECT USING (true);

-- penerimaan_zakat
ALTER TABLE penerimaan_zakat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all" ON penerimaan_zakat;
DROP POLICY IF EXISTS "User can manage own data" ON penerimaan_zakat;
DROP POLICY IF EXISTS "Public can view data" ON penerimaan_zakat;
CREATE POLICY "User can manage own data" ON penerimaan_zakat FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view data" ON penerimaan_zakat FOR SELECT USING (true);

-- pengaturan
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all" ON pengaturan;
DROP POLICY IF EXISTS "User can manage own settings" ON pengaturan;
DROP POLICY IF EXISTS "Public can view settings" ON pengaturan;
CREATE POLICY "User can manage own settings" ON pengaturan FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view settings" ON pengaturan FOR SELECT USING (true);
