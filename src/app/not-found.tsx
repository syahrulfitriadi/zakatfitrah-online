"use client";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <h1 className="text-6xl font-bold text-emerald-600 mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-8">Halaman tidak ditemukan</p>
      <a
        href="/"
        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Kembali ke Beranda
      </a>
    </div>
  );
}
