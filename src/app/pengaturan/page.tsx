"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function PengaturanPage() {
  const { user, loading: authLoading } = useAuth();
  const [nominalBeras, setNominalBeras] = useState<number>(2.5);
  const [nominalUang, setNominalUang] = useState<number>(35000);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchPengaturan() {
      const { data, error } = await supabase
        .from('pengaturan')
        .select('nominal_beras, nominal_uang')
        .eq('user_id', user!.id)
        .single();
      
      if (data && !error) {
        setNominalBeras(data.nominal_beras);
        setNominalUang(data.nominal_uang);
      } else {
        // Baris pengaturan belum ada, buat baru
        await supabase.from('pengaturan').insert({
          user_id: user!.id,
          nominal_beras: 2.5,
          nominal_uang: 35000,
        });
      }
      setLoading(false);
    }
    fetchPengaturan();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Cek dulu apakah baris sudah ada
    const { data: existing } = await supabase
      .from('pengaturan')
      .select('id')
      .eq('user_id', user!.id)
      .single();

    let error;
    if (existing) {
      // Sudah ada → update
      ({ error } = await supabase
        .from('pengaturan')
        .update({ nominal_beras: nominalBeras, nominal_uang: nominalUang, updated_at: new Date().toISOString() })
        .eq('user_id', user!.id));
    } else {
      // Belum ada → insert
      ({ error } = await supabase
        .from('pengaturan')
        .insert({
          user_id: user!.id,
          nominal_beras: nominalBeras,
          nominal_uang: nominalUang,
        }));
    }

    setLoading(false);

    if (!error) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      alert("Gagal menyimpan pengaturan: " + error.message);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pengaturan Aplikasi</h1>
          <p className="text-slate-500 mt-1">Konfigurasi nominal standar Zakat Fitrah per jiwa.</p>
        </div>
      </div>

      <div className="glass-card p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
            <h3 className="text-emerald-800 font-semibold mb-1">Informasi</h3>
            <p className="text-emerald-700 text-sm">
              Nominal yang diatur di sini akan digunakan sebagai standar perhitungan otomatis
              kewajiban zakat pada halaman Penerimaan. Pastikan nominal sesuai dengan ketetapan
              Baznas atau kesepakatan pengurus masjid tahun ini.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ketetapan Zakat Beras per Jiwa (Kg)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1"
                  className="premium-input pl-4 pr-12" 
                  value={nominalBeras}
                  onChange={(e) => setNominalBeras(parseFloat(e.target.value))}
                  required
                />
                <div className="absolute inset-y-0 right-0 top-0 flex items-center pr-4">
                   <span className="text-slate-400 font-medium">Kg</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">Standar umum: 2.5 Kg atau 2.7 Kg</p>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ketetapan Zakat Uang per Jiwa (Rp)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 top-0 flex items-center pl-4 pr-3 border-r border-slate-200">
                   <span className="text-slate-500 font-medium">Rp</span>
                </div>
                <input 
                  type="number" 
                  className="premium-input pl-14" 
                  value={nominalUang}
                  onChange={(e) => setNominalUang(parseInt(e.target.value))}
                  required
                />
              </div>
              <p className="text-sm text-slate-500 mt-1">Sesuai ketetapan harga beras di daerah setempat (Misal: 35.000, 40.000, 45.000)</p>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center gap-4">
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-70">
              {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
            {isSaved && (
              <span className="text-emerald-600 font-medium flex items-center gap-1 animate-pulse">
                ✓ Berhasil disimpan
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
