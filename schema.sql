-- Tabel Pengaturan Nominal
CREATE TABLE pengaturan (
  id integer PRIMARY KEY DEFAULT 1,
  nominal_beras numeric(10,2) NOT NULL DEFAULT 2.50,
  nominal_uang integer NOT NULL DEFAULT 35000,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Hanya ada 1 baris pengaturan
INSERT INTO pengaturan (id, nominal_beras, nominal_uang) VALUES (1, 2.50, 35000);

-- Tabel Penerimaan Zakat
CREATE TABLE penerimaan_zakat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_penyetor text NOT NULL,
  jumlah_jiwa integer NOT NULL,
  jenis_zakat text NOT NULL CHECK (jenis_zakat IN ('Beras', 'Uang')),
  jumlah_zakat numeric(10,2) NOT NULL,
  jenis_infaq text CHECK (jenis_infaq IN ('Beras', 'Uang')),
  jumlah_infaq numeric(10,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Setup RLS (Buka untuk public sementara buat testing/admin)
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE penerimaan_zakat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to pengaturan" ON pengaturan FOR ALL USING (true);
CREATE POLICY "Allow all access to penerimaan_zakat" ON penerimaan_zakat FOR ALL USING (true);
