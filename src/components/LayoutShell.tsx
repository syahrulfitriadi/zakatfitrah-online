"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";

const NO_SIDEBAR_PATHS = ["/login", "/daftar", "/pantau"];

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR_PATHS.some((p) => pathname.startsWith(p));

  return (
    <AuthProvider>
      {showSidebar ? (
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 w-full max-w-6xl p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      ) : (
        <>{children}</>
      )}
    </AuthProvider>
  );
}
