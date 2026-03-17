"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, profile, loading: authLoading } = useAuth();
  const [totalZakatBeras, setTotalZakatBeras] = useState(0);
  const [totalZakatUang, setTotalZakatUang] = useState(0);
  const [totalInfaqBeras, setTotalInfaqBeras] = useState(0);
  const [totalInfaqUang, setTotalInfaqUang] = useState(0);
  
  const [nominalBeras, setNominalBeras] = useState<number>(0);
  const [nominalUang, setNominalUang] = useState<number>(0);
  
  const [recentData, setRecentData] = useState<any[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'penerimaan_zakat' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (authLoading || !user) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;

  async function loadDashboardData() {
    if (!user) return;
    // Load Settings
    const { data: pengaturan } = await supabase.from('pengaturan').select('*').eq('user_id', user.id).single();
    if (pengaturan) {
      setNominalBeras(pengaturan.nominal_beras);
      setNominalUang(pengaturan.nominal_uang);
    }

    // Load Stats
    const { data: allPenerimaan } = await supabase.from('penerimaan_zakat').select('*').eq('user_id', user.id);
    if (allPenerimaan) {
      setTotalZakatBeras(allPenerimaan.filter(r => r.jenis_zakat === 'Beras').reduce((sum, r) => sum + Number(r.jumlah_zakat), 0));
      setTotalZakatUang(allPenerimaan.filter(r => r.jenis_zakat === 'Uang').reduce((sum, r) => sum + Number(r.jumlah_zakat), 0));
      setTotalInfaqBeras(allPenerimaan.filter(r => r.jenis_infaq === 'Beras').reduce((sum, r) => sum + Number(r.jumlah_infaq), 0));
      setTotalInfaqUang(allPenerimaan.filter(r => r.jenis_infaq === 'Uang').reduce((sum, r) => sum + Number(r.jumlah_infaq), 0));
    }

    // Load 3 Recent Transactions
    const { data: recent } = await supabase
      .from('penerimaan_zakat')
      .select('id, nama_penyetor, jumlah_jiwa, jenis_zakat, jumlah_zakat, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (recent) {
      setRecentData(recent);
    }
  }

  const copyPantauLink = () => {
    const link = `${window.location.origin}/pantau/${user!.id}`;
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard Zakat Fitrah</h1>
          <p className="text-slate-500 mt-1">Sistem informasi penerimaan zakat {profile?.nama_masjid || ''}.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={copyPantauLink} className="btn-secondary text-sm">
            {linkCopied ? '✅ Link Tersalin!' : '🔗 Salin Link Pantau'}
          </button>
          <Link href="/penerimaan" className="btn-primary">
            + Tambah Penerimaan
          </Link>
          <Link href="/rekap" className="btn-secondary">
            Lihat Laporan
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Zakat Beras</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{totalZakatBeras}</span>
            <span className="text-sm text-slate-500 font-medium">Kg</span>
          </div>
        </div>
        
        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Zakat Uang</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">Rp {totalZakatUang.toLocaleString()}</span>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-teal-500">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Infaq Beras</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">{totalInfaqBeras}</span>
            <span className="text-sm text-slate-500 font-medium">Kg</span>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-teal-500">
          <h3 className="text-sm font-medium text-slate-500 mb-1">Total Infaq Uang</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">Rp {totalInfaqUang.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-8 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 relative z-10">Penerimaan Terakhir</h2>
          
          {recentData.length === 0 ? (
            <div className="bg-white/50 rounded-xl p-8 border border-slate-100 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 text-2xl">
                📝
              </div>
              <p className="text-slate-500 font-medium">Belum ada data penerimaan.</p>
              <p className="text-sm text-slate-400 mt-1">Mulai catat penerimaan zakat jamaah sekarang.</p>
            </div>
          ) : (
            <div className="space-y-3 relative z-10">
              {recentData.map((trx) => (
                <div key={trx.id} className="bg-white/60 hover:bg-white p-4 rounded-xl border border-slate-100 flex justify-between items-center transition-all">
                  <div>
                    <p className="font-semibold text-slate-800">{trx.nama_penyetor} <span className="text-slate-400 text-sm font-normal">({trx.jumlah_jiwa} jiwa)</span></p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(trx.created_at).toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">{trx.jenis_zakat === 'Beras' ? `${trx.jumlah_zakat} Kg` : `Rp ${trx.jumlah_zakat.toLocaleString()}`}</p>
                    <span className="text-xs font-medium text-slate-400">Zakat {trx.jenis_zakat}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-8 relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-none">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl -ml-10 -mb-10"></div>
          
          <h2 className="text-xl font-bold mb-6 relative z-10">Pengaturan Saat Ini</h2>
          
          <div className="space-y-4 relative z-10">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs mb-1">Zakat per Jiwa (Beras)</div>
              <div className="font-semibold">{nominalBeras} Kg</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-emerald-100 text-xs mb-1">Zakat per Jiwa (Uang)</div>
              <div className="font-semibold">Rp {nominalUang.toLocaleString()}</div>
            </div>
          </div>

          <div className="mt-6 relative z-10">
            <Link href="/pengaturan" className="text-sm text-emerald-100 hover:text-white font-medium flex items-center gap-1">
              Ubah Pengaturan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
