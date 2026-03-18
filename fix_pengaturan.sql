-- =============================================
-- SQL Cleanup: Hapus baris duplikat di pengaturan
-- Jalankan di Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Lihat semua baris pengaturan (cek dulu)
SELECT * FROM pengaturan;

-- 2. Hapus SEMUA baris duplikat, sisakan hanya 1 baris per user_id
-- Pertama, simpan baris dengan id terkecil per user_id
DELETE FROM pengaturan a
USING pengaturan b
WHERE a.user_id = b.user_id
  AND a.id > b.id;

-- 3. Hapus baris tanpa user_id (orphan rows)
DELETE FROM pengaturan WHERE user_id IS NULL;

-- 4. Verifikasi - seharusnya hanya 1 baris per user
SELECT * FROM pengaturan;
