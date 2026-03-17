"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";

export default function PantauPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [profile, setProfile] = useState<{ nama_masjid: string; alamat_masjid: string } | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Summary states
  const [totalZakatBeras, setTotalZakatBeras] = useState(0);
  const [totalZakatUang, setTotalZakatUang] = useState(0);
  const [totalInfaqBeras, setTotalInfaqBeras] = useState(0);
  const [totalInfaqUang, setTotalInfaqUang] = useState(0);

  useEffect(() => {
    fetchAll();
  }, [userId]);

  // Real-time update
  useEffect(() => {
    const channel = supabase
      .channel('pantau-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'penerimaan_zakat' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  async function fetchAll() {
    // Fetch profile
    const { data: prof } = await supabase
      .from("masjid_profile")
      .select("nama_masjid, alamat_masjid")
      .eq("id", userId)
      .single();

    if (!prof) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setProfile(prof);

    // Fetch all records for this masjid
    const { data: rows } = await supabase
      .from("penerimaan_zakat")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (rows) {
      setData(rows);
      setTotalZakatBeras(rows.filter(r => r.jenis_zakat === 'Beras').reduce((sum, r) => sum + Number(r.jumlah_zakat), 0));
      setTotalZakatUang(rows.filter(r => r.jenis_zakat === 'Uang').reduce((sum, r) => sum + Number(r.jumlah_zakat), 0));
      setTotalInfaqBeras(rows.filter(r => r.jenis_infaq === 'Beras').reduce((sum, r) => sum + Number(r.jumlah_infaq), 0));
      setTotalInfaqUang(rows.filter(r => r.jenis_infaq === 'Uang').reduce((sum, r) => sum + Number(r.jumlah_infaq), 0));
    }

    setLoading(false);
  }

  const formatWaktu = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🕌</div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-2">Masjid Tidak Ditemukan</h1>
          <p className="text-sm md:text-base text-slate-500">Link pantau yang Anda buka tidak valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-14 md:h-14 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-3 md:mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-2 2-4 4-4 6.5 0 1.5.5 2.5 1.5 3.5H9v8h6v-8h-1.5c1-.9 1.5-2 1.5-3.5C16 7 14 5 12 3z" /><path d="M3 22h18" /><path d="M5 13v9" /><path d="M19 13v9" /><circle cx="12" cy="9" r="1" /></svg>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">{profile?.nama_masjid || "..."}</h1>
          <p className="text-slate-500 text-xs md:text-sm mt-1">{profile?.alamat_masjid}</p>
          <p className="text-emerald-600 text-xs font-medium mt-2">📊 Pantau Rekapitulasi Zakat Fitrah</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 p-3 md:p-4 text-center shadow-sm">
            <p className="text-[10px] md:text-xs text-slate-400 mb-1">Zakat Beras</p>
            <p className="text-lg md:text-xl font-bold text-emerald-600">{totalZakatBeras} <span className="text-xs md:text-sm font-medium">Kg</span></p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 p-3 md:p-4 text-center shadow-sm">
            <p className="text-[10px] md:text-xs text-slate-400 mb-1">Zakat Uang</p>
            <p className="text-base md:text-xl font-bold text-emerald-600">Rp {totalZakatUang.toLocaleString()}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 p-3 md:p-4 text-center shadow-sm">
            <p className="text-[10px] md:text-xs text-slate-400 mb-1">Infaq Beras</p>
            <p className="text-lg md:text-xl font-bold text-teal-600">{totalInfaqBeras} <span className="text-xs md:text-sm font-medium">Kg</span></p>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 p-3 md:p-4 text-center shadow-sm">
            <p className="text-[10px] md:text-xs text-slate-400 mb-1">Infaq Uang</p>
            <p className="text-base md:text-xl font-bold text-teal-600">Rp {totalInfaqUang.toLocaleString()}</p>
          </div>
        </div>

        {/* ===== MOBILE CARD VIEW (hidden on md+) ===== */}
        <div className="md:hidden relative">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          )}
          {data.length === 0 && !loading ? (
            <div className="text-center py-12 text-slate-400">Belum ada data penerimaan zakat.</div>
          ) : !loading && (
            <div className="space-y-3">
              {data.map((row, index) => (
                <div key={row.id} className="bg-white/80 backdrop-blur-xl rounded-xl border border-slate-200 p-3 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 text-sm">{row.nama_penyetor}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatWaktu(row.created_at)}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-2">#{index + 1}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 mt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[11px] text-slate-400">Jiwa: </span>
                      <span className="text-sm font-medium text-slate-700">{row.jumlah_jiwa}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400">Zakat: </span>
                      <span className="text-sm font-semibold text-emerald-600">
                        {row.jenis_zakat === 'Beras' ? `${row.jumlah_zakat} Kg` : `Rp ${row.jumlah_zakat.toLocaleString()}`}
                      </span>
                    </div>
                    {row.jumlah_infaq > 0 && (
                      <div>
                        <span className="text-[11px] text-slate-400">Infaq: </span>
                        <span className="text-sm font-semibold text-teal-600">
                          {row.jenis_infaq === 'Beras' ? `${row.jumlah_infaq} Kg` : `Rp ${row.jumlah_infaq.toLocaleString()}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== DESKTOP TABLE VIEW (hidden on mobile) ===== */}
        <div className="hidden md:block bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-sm tracking-wide border-b border-slate-200">
                  <th className="p-4 font-semibold w-12 text-center">No</th>
                  <th className="p-4 font-semibold">Nama Jamaah</th>
                  <th className="p-4 font-semibold text-center w-20">Jiwa</th>
                  <th className="p-4 font-semibold text-right">Zakat</th>
                  <th className="p-4 font-semibold text-right">Infaq</th>
                  <th className="p-4 font-semibold text-center">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">Belum ada data penerimaan zakat.</td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-center text-slate-400">{index + 1}</td>
                      <td className="p-4 font-medium text-slate-800">{row.nama_penyetor}</td>
                      <td className="p-4 text-center text-slate-600">{row.jumlah_jiwa}</td>
                      <td className="p-4 text-right">
                        <span className="text-emerald-600 font-semibold">
                          {row.jenis_zakat === 'Beras' ? `${row.jumlah_zakat} Kg` : `Rp ${row.jumlah_zakat.toLocaleString()}`}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {row.jumlah_infaq > 0 ? (
                          <span className="text-teal-600 font-semibold">
                            {row.jenis_infaq === 'Beras' ? `${row.jumlah_infaq} Kg` : `Rp ${row.jumlah_infaq.toLocaleString()}`}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-sm text-slate-500">{formatWaktu(row.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 md:mt-8">
          <p className="text-[10px] text-slate-400">Zakat Fitrah Online · Made with ❤️ by @syahrulfitriadi · BacktoRoot Project 2026</p>
        </div>
      </div>
    </div>
  );
}
