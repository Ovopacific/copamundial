"use client";

import { useAuth } from "@/lib/auth-context";
import { LogOut, User, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  // Do not render navbar on the login page
  if (pathname === "/login") return null;

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-dark-border/40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 sm:gap-8">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary transition-all duration-300 group-hover:rotate-12 group-hover:scale-110">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-black font-extrabold" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-black tracking-widest text-glow text-white leading-none">OVOPACIFIC</span>
            <span className="text-[8px] sm:text-[10px] text-primary font-bold tracking-wider uppercase">MUNDIAL 2026</span>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-6 text-sm font-bold uppercase tracking-wider">
          <Link href="/" className="text-gray-300 hover:text-primary transition-colors">
            Inicio
          </Link>
          <Link href="/#matches-board" className="text-gray-300 hover:text-primary transition-colors">
            Partidos
          </Link>
          <Link href="/leaderboard" className="text-gray-300 hover:text-primary transition-colors flex items-center gap-1">
            <Trophy className="w-4 h-4 text-[#ffd700]" />
            Tabla
          </Link>
          <Link href="/profile" className="text-gray-300 hover:text-[#00ff66] transition-colors">
            Retos
          </Link>
          <Link href="/leaderboard" className="text-gray-300 hover:text-primary transition-colors">
            Ranking
          </Link>
          {user?.email === "yolfranllecastillo@gmail.com" && (
            <Link href="/admin" className="text-[#ff0055] hover:text-white font-black transition-colors flex items-center gap-1 ml-4 bg-[#ff0055]/10 px-3 py-1 rounded-lg border border-[#ff0055]/30">
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="flex gap-4 items-center">
        {!loading && (
          <>
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-dark-surface border border-dark-border">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full" />
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  )}
                  <span className="text-xs sm:text-sm font-medium text-white">{user.displayName?.split(" ")[0]}</span>
                </div>
                <button 
                  onClick={logout}
                  className="p-1.5 sm:p-2 rounded-lg text-sm font-medium transition-colors hover:bg-red-500/10 text-gray-400 hover:text-red-500"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-primary text-black hover:bg-primary-dark transition-all transform hover:scale-105 glow-primary"
              >
                Entrar / Registrarse
              </Link>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
