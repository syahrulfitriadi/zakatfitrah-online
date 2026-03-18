-- =============================================
-- SQL: Tambah ON DELETE CASCADE
-- Agar semua data user terhapus otomatis
-- saat user dihapus dari Supabase Auth
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Fix tabel penerimaan_zakat
ALTER TABLE penerimaan_zakat 
  DROP CONSTRAINT IF EXISTS penerimaan_zakat_user_id_fkey;

ALTER TABLE penerimaan_zakat 
  ADD CONSTRAINT penerimaan_zakat_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Fix tabel pengaturan
ALTER TABLE pengaturan 
  DROP CONSTRAINT IF EXISTS pengaturan_user_id_fkey;

ALTER TABLE pengaturan 
  ADD CONSTRAINT pengaturan_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Selesai! Sekarang jika user dihapus, semua data berikut ikut terhapus:
-- ✅ masjid_profile (sudah CASCADE dari awal)
-- ✅ penerimaan_zakat (baru ditambahkan CASCADE)
-- ✅ pengaturan (baru ditambahkan CASCADE)
