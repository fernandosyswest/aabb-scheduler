"use client";
// src/components/Header.tsx

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Member } from "@/types";

interface HeaderProps {
  member: Member | null;
  userEmail: string;
}

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: "/reservas",
    label: "Reservas",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    href: "/torneios",
    label: "Torneios",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 000-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0012 0V2z" />
      </svg>
    ),
  },
];

export default function Header({ member, userEmail }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const displayName = member?.full_name ?? userEmail;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <header
        className="sticky top-0 z-50 bg-white"
        style={{ borderBottom: "2px solid #F9DD17", boxShadow: "0 2px 16px rgba(0,56,169,0.08)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden"
              style={{ background: "#0038A9" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3C8 7 8 17 12 21" />
                <path d="M12 3C16 7 16 17 12 21" />
              </svg>
              <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: "#F9DD17" }} />
            </div>
            <div className="hidden sm:block">
              <div
                className="text-lg leading-none tracking-widest"
                style={{ fontFamily: "'Bebas Neue', sans-serif", color: "#0038A9" }}
              >
                AABB Tênis
              </div>
              <div className="text-xs text-slate-400 tracking-wider uppercase leading-none mt-0.5">
                Reservas & Torneios
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                  style={
                    active
                      ? { background: "#0038A9", color: "white" }
                      : { color: "#475569" }
                  }
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "#e8eef8";
                      (e.currentTarget as HTMLElement).style.color = "#0038A9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                      (e.currentTarget as HTMLElement).style.color = "#475569";
                    }
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all duration-150 hover:bg-slate-50"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, #0038A9, #1a4fc4)",
                    border: "2px solid #F9DD17",
                  }}
                >
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-700 leading-none">
                    {member?.full_name?.split(" ")[0] ?? "Usuário"}
                  </div>
                  {member?.member_number && (
                    <div className="text-xs text-slate-400 leading-none mt-0.5">
                      {member.member_number}
                    </div>
                  )}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" className="hidden sm:block">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-12 w-56 bg-white rounded-xl z-20 py-1 animate-fade-in"
                    style={{ boxShadow: "0 10px 40px rgba(0,56,169,0.15)", border: "1px solid #e2e8f0" }}
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-sm font-semibold text-slate-800">
                        {member?.full_name ?? userEmail}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{userEmail}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      {loggingOut ? "Saindo..." : "Sair do sistema"}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 px-4 py-3 flex flex-col gap-1 animate-fade-in">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={
                    active
                      ? { background: "#0038A9", color: "white" }
                      : { color: "#475569" }
                  }
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
