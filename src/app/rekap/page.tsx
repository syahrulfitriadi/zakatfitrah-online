"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function RekapPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [totalItems, setTotalItems] = useState(0);

  // Summary states
  const [totalZakatBeras, setTotalZakatBeras] = useState(0);
  const [totalZakatUang, setTotalZakatUang] = useState(0);
  const [totalInfaqBeras, setTotalInfaqBeras] = useState(0);
  const [totalInfaqUang, setTotalInfaqUang] = useState(0);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nama_penyetor: '', jumlah_jiwa: 0, jenis_zakat: 'Beras', jumlah_zakat: 0, jenis_infaq: 'Uang', jumlah_infaq: 0 });

  useEffect(() => {
    if (user) fetchData();
  }, [page, user]);

  // ⚡ Real-time subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('rekap-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'penerimaan_zakat' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [page, user]);

  if (authLoading || !user) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div></div>;

  async function fetchData() {
    if (!user) return;
    setLoading(true);

    // Fetch total count for pagination
    const { count } = await supabase
      .from("penerimaan_zakat")
      .select("*", { count: 'exact', head: true })
      .eq('user_id', user.id);
    
    setTotalItems(count || 0);

    // Fetch paginated data
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage - 1;

    const { data: rows } = await supabase
      .from("penerimaan_zakat")
      .select("*")
      .eq('user_id', user.id)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (rows) {
      setData(rows);
    }

    // Fetch all records for total summary
    const { data: allRows } = await supabase.from("penerimaan_zakat").select("*").eq('user_id', user.id);
    if (allRows) {
      setTotalZakatBeras(allRows.filter(r => r.jenis_zakat === 'Beras').reduce((sum, r) => sum + Number(r.jumlah_zakat), 0));
      setTotalZakatUang(allRows.filter(r => r.jenis_zakat === 'Uang').reduce((sum, r) => sum + Number(r.jumlah_zakat), 0));
      
      setTotalInfaqBeras(allRows.filter(r => r.jenis_infaq === 'Beras').reduce((sum, r) => sum + Number(r.jumlah_infaq), 0));
      setTotalInfaqUang(allRows.filter(r => r.jenis_infaq === 'Uang').reduce((sum, r) => sum + Number(r.jumlah_infaq), 0));
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

  const exportPDF = async () => {
    // Get all data for export
    const { data: allData } = await supabase.from("penerimaan_zakat").select("*").eq('user_id', user!.id).order("created_at", { ascending: false });
    if (!allData) return;

    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text("Laporan Penerimaan Zakat Fitrah & Infaq", 14, 20);
    doc.setFontSize(11);
    doc.text(`${profile?.nama_masjid || 'Masjid'} - ${profile?.alamat_masjid || ''}`, 14, 28);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 34);

    const tableColumn = ["No", "Nama Jamaah", "Jiwa", "Zakat", "Infaq", "Waktu Setor"];
    const tableRows: any[][] = [];

    allData.forEach((row, ind) => {
      const rowData = [
        ind + 1,
        row.nama_penyetor,
        row.jumlah_jiwa,
        row.jenis_zakat === 'Beras' ? `${row.jumlah_zakat} Kg` : `Rp ${row.jumlah_zakat.toLocaleString()}`,
        row.jumlah_infaq > 0 ? (row.jenis_infaq === 'Beras' ? `${row.jumlah_infaq} Kg` : `Rp ${row.jumlah_infaq.toLocaleString()}`) : "-",
        formatWaktu(row.created_at)
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] } // emerald-500
    });

    // Add Totals
    const finalY = (doc as any).lastAutoTable.finalY || 40;
    doc.setFontSize(10);
    doc.text(`Total Zakat Beras: ${totalZakatBeras} Kg`, 14, finalY + 10);
    doc.text(`Total Zakat Uang: Rp ${totalZakatUang.toLocaleString()}`, 14, finalY + 16);
    doc.text(`Total Infaq Beras: ${totalInfaqBeras} Kg`, 14, finalY + 22);
    doc.text(`Total Infaq Uang: Rp ${totalInfaqUang.toLocaleString()}`, 14, finalY + 28);

    doc.save(`Laporan_Zakat_${new Date().getTime()}.pdf`);
  };

  const exportExcel = async () => {
    // Get all data for export
    const { data: allData } = await supabase.from("penerimaan_zakat").select("*").eq('user_id', user!.id).order("created_at", { ascending: false });
    if (!allData) return;

    const excelData = allData.map((row, index) => ({
      "No": index + 1,
      "Nama Jamaah (KK)": row.nama_penyetor,
      "Jumlah Jiwa": row.jumlah_jiwa,
      "Bentuk Zakat": row.jenis_zakat,
      "Jumlah Zakat": row.jumlah_zakat,
      "Bentuk Infaq": row.jenis_infaq || "-",
      "Jumlah Infaq": row.jumlah_infaq,
      "Waktu Setor": formatWaktu(row.created_at)
    }));

    // Add totals row
    excelData.push({
      "No": "", "Nama Jamaah (KK)": "TOTAL KESELURUHAN", "Jumlah Jiwa": "", 
      "Bentuk Zakat": "Zakat Beras:", 
      "Jumlah Zakat": totalZakatBeras,
      "Bentuk Infaq": "Infaq Beras:",
      "Jumlah Infaq": totalInfaqBeras,
      "Waktu Setor": ""
    } as any);

    excelData.push({
      "No": "", "Nama Jamaah (KK)": "", "Jumlah Jiwa": "", 
      "Bentuk Zakat": "Zakat Uang:", 
      "Jumlah Zakat": totalZakatUang,
      "Bentuk Infaq": "Infaq Uang:",
      "Jumlah Infaq": totalInfaqUang,
      "Waktu Setor": ""
    } as any);

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Zakat");
    XLSX.writeFile(workbook, `Laporan_Zakat_${new Date().getTime()}.xlsx`);
  };

  const handleClearData = async () => {
    if (confirm("⚠️ PERINGATAN BUKAN MAIN-MAIN: Apakah Anda yakin ingin menghapus SEMUA data penerimaan? Data yang dihapus tidak dapat dikembalikan lagi!")) {
      setLoading(true);
      const { error } = await supabase.from('penerimaan_zakat').delete().gte('id', '00000000-0000-0000-0000-000000000000');
      
      if (!error) {
        setPage(1);
        fetchData();
        alert("Semua data berhasil dibersihkan.");
      } else {
        alert("Gagal menghapus data: " + error.message);
        setLoading(false);
      }
    }
  };

  const handleDeleteRow = async (id: string, nama: string) => {
    if (confirm(`Hapus data "${nama}"? Data yang dihapus tidak bisa dikembalikan.`)) {
      const { error } = await supabase.from('penerimaan_zakat').delete().eq('id', id);
      if (!error) {
        fetchData();
      } else {
        alert("Gagal menghapus: " + error.message);
      }
    }
  };

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditForm({
      nama_penyetor: row.nama_penyetor,
      jumlah_jiwa: row.jumlah_jiwa,
      jenis_zakat: row.jenis_zakat,
      jumlah_zakat: row.jumlah_zakat,
      jenis_infaq: row.jenis_infaq || 'Uang',
      jumlah_infaq: row.jumlah_infaq || 0,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from('penerimaan_zakat').update({
      nama_penyetor: editForm.nama_penyetor,
      jumlah_jiwa: editForm.jumlah_jiwa,
      jenis_zakat: editForm.jenis_zakat,
      jumlah_zakat: editForm.jumlah_zakat,
      jenis_infaq: editForm.jumlah_infaq > 0 ? editForm.jenis_infaq : null,
      jumlah_infaq: editForm.jumlah_infaq,
    }).eq('id', editingId);

    if (!error) {
      setEditingId(null);
      fetchData();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
  };

  // Mobile card for editing
  const renderMobileEditCard = (row: any, index: number) => (
    <div key={row.id} className="mobile-data-card bg-amber-50/50 border-amber-200">
      <div className="space-y-3">
        <div>
          <p className="mobile-data-label">Nama Jamaah</p>
          <input type="text" className="premium-input text-sm py-2" value={editForm.nama_penyetor} onChange={e => setEditForm({...editForm, nama_penyetor: e.target.value})} />
        </div>
        <div>
          <p className="mobile-data-label">Jumlah Jiwa</p>
          <input type="number" min="1" className="premium-input text-sm py-2 w-24" value={editForm.jumlah_jiwa} onChange={e => setEditForm({...editForm, jumlah_jiwa: parseInt(e.target.value) || 0})} />
        </div>
        <div>
          <p className="mobile-data-label">Zakat</p>
          <div className="flex gap-1 mb-2">
            <button type="button" onClick={() => setEditForm({...editForm, jenis_zakat: 'Beras'})} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editForm.jenis_zakat === 'Beras' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'}`}>Beras</button>
            <button type="button" onClick={() => setEditForm({...editForm, jenis_zakat: 'Uang'})} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editForm.jenis_zakat === 'Uang' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'}`}>Uang</button>
          </div>
          <input type="number" step="any" className="premium-input text-sm py-2" value={editForm.jumlah_zakat} onChange={e => setEditForm({...editForm, jumlah_zakat: parseFloat(e.target.value) || 0})} />
        </div>
        <div>
          <p className="mobile-data-label">Infaq</p>
          <div className="flex gap-1 mb-2">
            <button type="button" onClick={() => setEditForm({...editForm, jenis_infaq: 'Beras'})} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editForm.jenis_infaq === 'Beras' ? 'bg-teal-600 text-white' : 'bg-white border text-slate-500'}`}>Beras</button>
            <button type="button" onClick={() => setEditForm({...editForm, jenis_infaq: 'Uang'})} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${editForm.jenis_infaq === 'Uang' ? 'bg-teal-600 text-white' : 'bg-white border text-slate-500'}`}>Uang</button>
          </div>
          <input type="number" step="any" className="premium-input text-sm py-2" value={editForm.jumlah_infaq} onChange={e => setEditForm({...editForm, jumlah_infaq: parseFloat(e.target.value) || 0})} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors font-medium">Simpan</button>
          <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 bg-slate-200 text-slate-600 text-sm rounded-xl hover:bg-slate-300 transition-colors font-medium">Batal</button>
        </div>
      </div>
    </div>
  );

  // Mobile card for display
  const renderMobileCard = (row: any, index: number) => (
    <div key={row.id} className="mobile-data-card">
      <div className="flex justify-between items-start">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 text-sm">{row.nama_penyetor}</p>
          <p className="text-xs text-slate-500 mt-0.5">{formatWaktu(row.created_at)}</p>
        </div>
        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">#{(page - 1) * itemsPerPage + index + 1}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
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
      <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
        <button onClick={() => startEdit(row)} className="flex-1 py-2 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors font-medium">✏️ Edit</button>
        <button onClick={() => handleDeleteRow(row.id, row.nama_penyetor)} className="flex-1 py-2 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors font-medium">🗑 Hapus</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Rekapitulasi Penerimaan</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">Laporan detail data penerimaan Zakat dan Infaq jamaah.</p>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button onClick={exportPDF} className="btn-secondary flex items-center gap-2 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer text-sm flex-1 sm:flex-none">
             📄 Export PDF
          </button>
          <button onClick={exportExcel} className="btn-secondary flex items-center gap-2 text-teal-700 hover:bg-teal-50 hover:border-teal-200 cursor-pointer text-sm flex-1 sm:flex-none">
             📊 Export Excel
          </button>
          <button onClick={handleClearData} className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer text-sm w-full sm:w-auto">
             🗑️ Bersihkan Data
          </button>
        </div>
      </div>

      {/* Summary Cards (always visible) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-[11px] text-emerald-600 font-medium">Zakat Beras</p>
          <p className="text-lg font-bold text-emerald-700">{totalZakatBeras} <span className="text-xs font-medium">Kg</span></p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
          <p className="text-[11px] text-emerald-600 font-medium">Zakat Uang</p>
          <p className="text-lg font-bold text-emerald-700">Rp {totalZakatUang.toLocaleString()}</p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
          <p className="text-[11px] text-teal-600 font-medium">Infaq Beras</p>
          <p className="text-lg font-bold text-teal-700">{totalInfaqBeras} <span className="text-xs font-medium">Kg</span></p>
        </div>
        <div className="bg-teal-50 rounded-xl p-3 text-center border border-teal-100">
          <p className="text-[11px] text-teal-600 font-medium">Infaq Uang</p>
          <p className="text-lg font-bold text-teal-700">Rp {totalInfaqUang.toLocaleString()}</p>
        </div>
      </div>

      {/* ===== MOBILE CARD VIEW (hidden on md+) ===== */}
      <div className="md:hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        )}
        {data.length === 0 && !loading ? (
          <div className="text-center py-12 text-slate-400">Belum ada data penerimaan zakat.</div>
        ) : (
          <div className="space-y-3">
            {data.map((row, index) =>
              editingId === row.id
                ? renderMobileEditCard(row, index)
                : renderMobileCard(row, index)
            )}
          </div>
        )}
      </div>

      {/* ===== DESKTOP TABLE VIEW (hidden on mobile) ===== */}
      <div className="hidden md:block glass-card overflow-hidden relative min-h-[400px]">
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
                     <th className="p-4 font-semibold text-center w-24">Jiwa</th>
                     <th className="p-4 font-semibold text-right">Zakat (Beras/Uang)</th>
                     <th className="p-4 font-semibold text-right">Infaq (Beras/Uang)</th>
                     <th className="p-4 font-semibold text-center">Waktu Setor</th>
                     <th className="p-4 font-semibold text-center w-28">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {data.length === 0 && !loading ? (
                    <tr>
                       <td colSpan={7} className="p-12 text-center text-slate-400">
                          Belum ada data penerimaan zakat.
                       </td>
                    </tr>
                  ) : (
                    data.map((row, index) => (
                      editingId === row.id ? (
                        <tr key={row.id} className="bg-amber-50/50">
                          <td className="p-3 text-center text-slate-400">{(page - 1) * itemsPerPage + index + 1}</td>
                          <td className="p-3"><input type="text" className="premium-input text-sm py-1.5" value={editForm.nama_penyetor} onChange={e => setEditForm({...editForm, nama_penyetor: e.target.value})} /></td>
                          <td className="p-3"><input type="number" min="1" className="premium-input text-sm py-1.5 text-center w-20" value={editForm.jumlah_jiwa} onChange={e => setEditForm({...editForm, jumlah_jiwa: parseInt(e.target.value) || 0})} /></td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1 items-end">
                              <div className="flex gap-1">
                                <button type="button" onClick={() => setEditForm({...editForm, jenis_zakat: 'Beras'})} className={`px-2 py-1 rounded text-xs font-medium ${editForm.jenis_zakat === 'Beras' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'}`}>Beras</button>
                                <button type="button" onClick={() => setEditForm({...editForm, jenis_zakat: 'Uang'})} className={`px-2 py-1 rounded text-xs font-medium ${editForm.jenis_zakat === 'Uang' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-500'}`}>Uang</button>
                              </div>
                              <input type="number" step="any" className="premium-input text-sm py-1.5 text-right w-28" value={editForm.jumlah_zakat} onChange={e => setEditForm({...editForm, jumlah_zakat: parseFloat(e.target.value) || 0})} />
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1 items-end">
                              <div className="flex gap-1">
                                <button type="button" onClick={() => setEditForm({...editForm, jenis_infaq: 'Beras'})} className={`px-2 py-1 rounded text-xs font-medium ${editForm.jenis_infaq === 'Beras' ? 'bg-teal-600 text-white' : 'bg-white border text-slate-500'}`}>Beras</button>
                                <button type="button" onClick={() => setEditForm({...editForm, jenis_infaq: 'Uang'})} className={`px-2 py-1 rounded text-xs font-medium ${editForm.jenis_infaq === 'Uang' ? 'bg-teal-600 text-white' : 'bg-white border text-slate-500'}`}>Uang</button>
                              </div>
                              <input type="number" step="any" className="premium-input text-sm py-1.5 text-right w-28" value={editForm.jumlah_infaq} onChange={e => setEditForm({...editForm, jumlah_infaq: parseFloat(e.target.value) || 0})} />
                            </div>
                          </td>
                          <td className="p-3 text-center text-sm text-slate-500">{formatWaktu(row.created_at)}</td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col gap-1">
                              <button onClick={handleSaveEdit} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 transition-colors">Simpan</button>
                              <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-300 transition-colors">Batal</button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                         <td className="p-4 text-center text-slate-400">{(page - 1) * itemsPerPage + index + 1}</td>
                         <td className="p-4 font-medium text-slate-800">{row.nama_penyetor}</td>
                         <td className="p-4 text-center text-slate-600">{row.jumlah_jiwa}</td>
                         <td className="p-4 text-right">
                            <span className="block text-emerald-600 font-semibold">
                               {row.jenis_zakat === 'Beras' ? `${row.jumlah_zakat} Kg` : `Rp ${row.jumlah_zakat.toLocaleString()}`}
                            </span>
                         </td>
                         <td className="p-4 text-right">
                            {row.jumlah_infaq > 0 ? (
                              <span className="block text-teal-600 font-semibold">
                                {row.jenis_infaq === 'Beras' ? `${row.jumlah_infaq} Kg` : `Rp ${row.jumlah_infaq.toLocaleString()}`}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                         </td>
                         <td className="p-4 text-center text-sm text-slate-500">{formatWaktu(row.created_at)}</td>
                         <td className="p-4 text-center">
                           <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => startEdit(row)} className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors" title="Edit">✏️</button>
                             <button onClick={() => handleDeleteRow(row.id, row.nama_penyetor)} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200 transition-colors" title="Hapus">🗑</button>
                           </div>
                         </td>
                      </tr>
                      )
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-sm text-slate-500">
         <p>Menampilkan {data.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}-{Math.min(page * itemsPerPage, totalItems)} dari {totalItems} data</p>
         <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm"
            >
              Sebelumnya
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * itemsPerPage >= totalItems || loading}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-sm"
            >
              Selanjutnya
            </button>
         </div>
      </div>
    </div>
  );
}
