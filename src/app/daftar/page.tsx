"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DaftarPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [namaMasjid, setNamaMasjid] = useState("");
  const [alamat, setAlamat] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshProfile } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Sign Up
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError("Gagal membuat akun.");
      setLoading(false);
      return;
    }

    // 2. Create masjid profile
    const { error: profileError } = await supabase.from("masjid_profile").insert({
      id: authData.user.id,
      nama_masjid: namaMasjid,
      alamat_masjid: alamat,
    });

    if (profileError) {
      setError("Akun berhasil dibuat, tapi gagal menyimpan profil masjid: " + profileError.message);
      setLoading(false);
      return;
    }

    // 3. Create default pengaturan for this user
    await supabase.from("pengaturan").insert({
      user_id: authData.user.id,
      nominal_beras: 2.5,
      nominal_uang: 35000,
    });

    // 4. Refresh profile in context so sidebar shows mosque name immediately
    await refreshProfile();

    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-2 2-4 4-4 6.5 0 1.5.5 2.5 1.5 3.5H9v8h6v-8h-1.5c1-.9 1.5-2 1.5-3.5C16 7 14 5 12 3z" /><path d="M3 22h18" /><path d="M5 13v9" /><path d="M19 13v9" /><circle cx="12" cy="9" r="1" /></svg>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">Daftar Akun Masjid</h1>
          <p className="text-slate-400 text-sm mt-1">Buat akun untuk mulai mencatat zakat fitrah</p>
        </div>

        {/* Form */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Masjid</label>
              <input
                type="text"
                className="premium-input"
                placeholder="Contoh: Masjid Nurul Huda"
                value={namaMasjid}
                onChange={(e) => setNamaMasjid(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Masjid</label>
              <input
                type="text"
                className="premium-input"
                placeholder="Contoh: Desa Depok, Siraman"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                required
              />
            </div>
            <hr className="border-slate-100" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="premium-input"
                placeholder="panitia@masjid.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                className="premium-input"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-70">
              {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-emerald-600 font-semibold hover:underline">Masuk</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">Made with ❤️ by @syahrulfitriadi · BacktoRoot Project 2026</p>
      </div>
    </div>
  );
}
