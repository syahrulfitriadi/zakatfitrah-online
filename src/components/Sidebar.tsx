"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// Minimalist SVG icons
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
);
const IconPenerimaan = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14" /><path d="M5 12h14" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>
);
const IconRekap = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /></svg>
);
const IconPengaturan = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
);
const IconCollapse = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></svg>
);
const IconExpand = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
);
const IconMosque = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-2 2-4 4-4 6.5 0 1.5.5 2.5 1.5 3.5H9v8h6v-8h-1.5c1-.9 1.5-2 1.5-3.5C16 7 14 5 12 3z" /><path d="M3 22h18" /><path d="M5 13v9" /><path d="M19 13v9" /><circle cx="12" cy="9" r="1" /></svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);

const menuItems = [
  { href: "/", label: "Dashboard", icon: IconDashboard },
  { href: "/penerimaan", label: "Penerimaan", icon: IconPenerimaan },
  { href: "/rekap", label: "Rekap", icon: IconRekap },
  { href: "/pengaturan", label: "Pengaturan", icon: IconPengaturan },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
      <aside className={`hidden md:flex ${isCollapsed ? "w-[72px]" : "w-64"} transition-all duration-300 flex-shrink-0 flex-col bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-sm sticky top-0 h-screen`}>
        {/* Header */}
        <div className={`p-4 border-b border-slate-100 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <IconMosque />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <p className="font-bold text-sm bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 leading-tight">Zakat Fitrah Online</p>
              <p className="text-[10px] text-slate-400 leading-tight">{profile?.nama_masjid || '...'}</p>
            </div>
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {!isCollapsed && <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Menu Utama</p>}

          {menuItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} title={item.label} className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
                <Icon />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {!isCollapsed && <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-6 mb-3">Sistem</p>}
          {isCollapsed && <div className="my-4 border-t border-slate-100" />}

          <Link href="/pengaturan" title="Pengaturan" className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive("/pengaturan") ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"}`}>
            <IconPengaturan />
            {!isCollapsed && <span>Pengaturan</span>}
          </Link>
        </nav>

        {/* Footer – always visible */}
        <div className="p-3 border-t border-slate-100 flex flex-col gap-2 flex-shrink-0">
          {!isCollapsed && (
            <div className="space-y-2">
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-[11px] font-medium text-emerald-800">{profile?.nama_masjid || '...'}</p>
                <p className="text-[10px] text-emerald-600">{profile?.alamat_masjid || ''}</p>
              </div>
              <div className="text-center pt-1">
                <p className="text-[10px] text-slate-400">Made with ❤️ by @syahrulfitriadi</p>
                <p className="text-[9px] text-slate-400">BacktoRoot Project 2026</p>
              </div>
            </div>
          )}
          <div className="flex gap-1">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <IconExpand /> : <><IconCollapse /> <span>Collapse</span></>}
            </button>
            <button
              onClick={signOut}
              className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <IconLogout />
              {!isCollapsed && <span>Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ===== MOBILE BOTTOM NAVIGATION (hidden on desktop) ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-center justify-around px-2 h-16">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[56px] transition-all ${
                  isActive(item.href)
                    ? "text-emerald-600"
                    : "text-slate-400"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${isActive(item.href) ? "bg-emerald-50" : ""}`}>
                  <Icon />
                </div>
                <span className={`text-[10px] font-medium leading-tight ${isActive(item.href) ? "text-emerald-700" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl min-w-[56px] text-slate-400 transition-all active:scale-95"
          >
            <div className="p-1.5 rounded-lg">
              <IconLogout />
            </div>
            <span className="text-[10px] font-medium leading-tight">Keluar</span>
          </button>
        </div>
      </nav>
    </>
  );
}
