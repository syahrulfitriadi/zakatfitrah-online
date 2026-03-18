"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function PenerimaanPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [nama, setNama] = useState("");
  const [jiwa, setJiwa] = useState<number | "">("");
  const [jenisZakat, setJenisZakat] = useState<"Beras" | "Uang">("Beras");
  const [jumlahDisetor, setJumlahDisetor] = useState<number | "">("");
  
  const [jenisInfaq, setJenisInfaq] = useState<"Beras" | "Uang">("Uang");
  const [jumlahInfaq, setJumlahInfaq] = useState<number | "">("");

  // Nominal settings dari database
  const [nominalBeras, setNominalBeras] = useState<number>(2.5); 
  const [nominalUang, setNominalUang] = useState<number>(35000);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Load nominal settings on mount
  useEffect(() => {
    if (!user) return;
    async function fetchPengaturan() {
      const { data } = await supabase
        .from('pengaturan')
        .select('nominal_beras, nominal_uang')
        .eq('user_id', user!.id)
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setNominalBeras(data.nominal_beras);
        setNominalUang(data.nominal_uang);
      }
    }
    fetchPengaturan();
  }, [user]);

  const currentNominal = jenisZakat === "Beras" ? nominalBeras : nominalUang;
  
  // Hitung kewajiban zakat
  const totalWajib = (typeof jiwa === "number" ? jiwa : 0) * currentNominal;
  
  // Auto-hitung kelebihan
  useEffect(() => {
    if (typeof jumlahDisetor === "number" && jumlahDisetor > totalWajib && totalWajib > 0) {
      const kelebihan = jumlahDisetor - totalWajib;
      setJumlahInfaq(kelebihan);
      setJenisInfaq(jenisZakat); // Otomatis samakan jenisnya di awal
    } else {
      setJumlahInfaq("");
    }
  }, [jumlahDisetor, totalWajib, jenisZakat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !jiwa || !jumlahDisetor) return;

    setIsSubmitting(true);
    setMessage(null);

    const infaqValue = typeof jumlahInfaq === 'number' && jumlahInfaq > 0 ? jumlahInfaq : 0;
    const infaqType = infaqValue > 0 ? jenisInfaq : null;

    const { error } = await supabase
      .from('penerimaan_zakat')
      .insert({
        nama_penyetor: nama,
        jumlah_jiwa: jiwa,
        jenis_zakat: jenisZakat,
        jumlah_zakat: jumlahDisetor,
        jenis_infaq: infaqType,
        jumlah_infaq: infaqValue,
        user_id: user!.id
      });

    setIsSubmitting(false);

    if (error) {
      setMessage({ type: 'error', text: 'Gagal merekam data: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Data penerimaan Zakat berhasil disimpan!' });
      // Reset form
      setNama("");
      setJiwa("");
      setJumlahDisetor("");
      setJumlahInfaq("");
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Penerimaan Zakat</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">Form input data setoran zakat fitrah & infaq jamaah.</p>
      </div>

      {message && (
        <div className={`p-3 md:p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'} flex items-center justify-between`}>
          <span className="text-sm md:text-base">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-sm font-bold opacity-50 hover:opacity-100 ml-2 flex-shrink-0">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Form Input */}
        <div className="lg:col-span-2 glass-card p-4 md:p-8">
          <form className="space-y-5 md:space-y-6" onSubmit={handleSubmit}>
            {/* Informasi Penyetor */}
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-base md:text-lg font-bold text-slate-800 border-b pb-2">Informasi Penyetor</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Penyetor (KK)</label>
                  <input 
                    type="text" 
                    className="premium-input" 
                    placeholder="Contoh: Bpk. Supriyadi"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Jiwa</label>
                  <input 
                    type="number" 
                    min="1"
                    className="premium-input" 
                    placeholder="0"
                    value={jiwa}
                    onChange={(e) => setJiwa(e.target.value === "" ? "" : parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Detail Setoran Zakat */}
            <div className="space-y-3 md:space-y-4 pt-4 border-t">
              <h2 className="text-base md:text-lg font-bold text-slate-800 pb-2">Setoran Zakat</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bentuk Setoran</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setJenisZakat("Beras")}
                      className={`flex-1 py-2 px-3 rounded-xl font-medium border text-sm transition-colors ${jenisZakat === "Beras" ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Beras (Kg)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setJenisZakat("Uang")}
                      className={`flex-1 py-2 px-3 rounded-xl font-medium border text-sm transition-colors ${jenisZakat === "Uang" ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      Uang (Rp)
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Jumlah Zakat Disetor {jenisZakat === "Beras" ? "(Kg)" : "(Rp)"}
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    className="premium-input" 
                    placeholder="0"
                    value={jumlahDisetor}
                    onChange={(e) => setJumlahDisetor(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    required
                  />
                  {totalWajib > 0 && typeof jumlahDisetor === "number" && jumlahDisetor < totalWajib && (
                    <p className="text-red-500 text-xs mt-1">
                      ⚠️ Setoran kurang dari kewajiban ({jenisZakat === "Beras" ? `${totalWajib} Kg` : `Rp ${totalWajib.toLocaleString()}`})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tambahan Infaq Jika Ada */}
            <div className={`space-y-3 md:space-y-4 pt-4 border-t transition-all ${typeof jumlahInfaq === 'number' && jumlahInfaq > 0 ? 'bg-teal-50/50 p-3 md:p-4 rounded-xl border-teal-100' : ''}`}>
               <div className="flex flex-wrap items-center gap-2 pb-2">
                 <h2 className="text-base md:text-lg font-bold text-slate-800">Infaq (Opsional / Kelebihan Zakat)</h2>
                 {typeof jumlahInfaq === 'number' && jumlahInfaq > 0 && (
                   <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full font-bold">Auto-Calculated</span>
                 )}
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bentuk Infaq</label>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setJenisInfaq("Beras")}
                        className={`flex-1 py-2 px-3 rounded-xl font-medium border text-sm transition-colors ${jenisInfaq === "Beras" ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        Beras (Kg)
                      </button>
                      <button 
                        type="button"
                        onClick={() => setJenisInfaq("Uang")}
                        className={`flex-1 py-2 px-3 rounded-xl font-medium border text-sm transition-colors ${jenisInfaq === "Uang" ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                      >
                        Uang (Rp)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Jumlah Infaq {jenisInfaq === "Beras" ? "(Kg)" : "(Rp)"}
                    </label>
                    <input 
                      type="number" 
                      step="any"
                      className="premium-input" 
                      placeholder="0"
                      value={jumlahInfaq}
                      onChange={(e) => setJumlahInfaq(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    />
                  </div>
               </div>
            </div>

            <div className="pt-4 md:pt-6">
               <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-70">
                 {isSubmitting ? 'Menyimpan...' : 'Simpan Data Penerimaan'}
               </button>
            </div>
          </form>
        </div>

        {/* Ringkasan Setoran (Ticket) */}
        <div>
           <div className="glass-card p-5 md:p-6 bg-gradient-to-b from-slate-800 to-slate-900 border-none text-white lg:sticky lg:top-24 shadow-2xl">
              <div className="text-center pb-4 border-b border-white/20">
                 <h3 className="text-sm font-medium text-emerald-400">Ringkasan Bukti Setor</h3>
                 <p className="font-bold text-lg md:text-xl mt-1">{nama || "Nama Jamaah"}</p>
                 <p className="text-slate-400 text-sm mt-1">{jiwa ? `${jiwa} Jiwa` : "- Jiwa"}</p>
              </div>

              <div className="py-4 space-y-3 md:space-y-4 border-b border-white/20">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">Wajib Zakat ({jenisZakat})</span>
                    <span className="font-bold">
                       {jenisZakat === "Beras" 
                        ? `${totalWajib} Kg` 
                        : `Rp ${totalWajib.toLocaleString()}`}
                    </span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300">Zakat Disetor ({jenisZakat})</span>
                    <span className="font-bold text-emerald-400">
                       {typeof jumlahDisetor === "number" 
                        ? (jenisZakat === "Beras" ? `${jumlahDisetor} Kg` : `Rp ${jumlahDisetor.toLocaleString()}`)
                        : "-"}
                    </span>
                 </div>
              </div>

              {(typeof jumlahInfaq === 'number' && jumlahInfaq > 0) && (
                <div className="py-4 space-y-3 border-b border-white/20">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-300">Infaq ({jenisInfaq})</span>
                      <span className="font-bold text-teal-400">
                         {jenisInfaq === "Beras" ? `${jumlahInfaq} Kg` : `Rp ${jumlahInfaq.toLocaleString()}`}
                      </span>
                   </div>
                </div>
              )}

              <div className="pt-4 text-center">
                 <p className="text-xs text-slate-400 tracking-wider">{profile?.nama_masjid?.toUpperCase() || 'MASJID'} - {profile?.alamat_masjid?.toUpperCase() || ''}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
