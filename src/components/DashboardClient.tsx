"use client";
// src/components/DashboardClient.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Court, Member, Booking, Tournament } from "@/types";
import { formatDate, formatTime, surfaceLabels } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "./ToastProvider";
import BookingModal from "./BookingModal";

interface Props {
  courts: Court[];
  member: Member | null;
  myBookings: Booking[];
  todayBookings: { court_id: string; start_time: string; end_time: string; member_id: string }[];
  tournaments: Tournament[];
  membersCount: number;
}

function isCourtAvailableNow(courtId: string, todayBookings: Props["todayBookings"]) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return !todayBookings.some(
    (b) => b.court_id === courtId && b.start_time <= currentTime && b.end_time > currentTime
  );
}

function getNextSlot(courtId: string, todayBookings: Props["todayBookings"]) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const courtBookings = todayBookings
    .filter((b) => b.court_id === courtId && b.start_time > currentTime)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  return courtBookings[0]?.start_time ?? null;
}

function CourtStatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: "#4ade80",
    occupied: "#fb923c",
    maintenance: "#fbbf24",
    inactive: "#94a3b8",
  };
  return (
    <div
      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{
        background: colors[status] ?? "#94a3b8",
        boxShadow: status === "available" ? `0 0 0 3px rgba(74,222,128,0.2), 0 0 8px rgba(74,222,128,0.4)` : "none",
      }}
    />
  );
}

export default function DashboardClient({
  courts,
  member,
  myBookings,
  todayBookings,
  tournaments,
  membersCount,
}: Props) {
  const router = useRouter();
  const [bookingModal, setBookingModal] = useState<{ open: boolean; court?: Court }>({ open: false });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const availableNow = courts.filter(
    (c) => c.status === "available" && isCourtAvailableNow(c.id, todayBookings)
  ).length;

  async function cancelBooking(bookingId: string) {
    setCancellingId(bookingId);
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);
    setCancellingId(null);
    if (error) {
      showToast("Erro ao cancelar reserva.", "error");
    } else {
      showToast("Reserva cancelada.", "success");
      router.refresh();
    }
  }

  const surfaceBg: Record<string, string> = {
    clay: "court-bg-clay",
    hard: "court-bg-hard",
    grass: "court-bg-grass",
    synthetic: "court-bg-synthetic",
    maintenance: "court-bg-maintenance",
    inactive: "court-bg-inactive",
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0038A9 0%, #1a4fc4 55%, #2060d8 100%)" }}>
        <div className="tennis-pattern absolute inset-0 opacity-50" />
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-10"
          style={{ background: "#F9DD17" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" style={{ boxShadow: "0 0 6px rgba(74,222,128,0.8)" }} />
                <span className="text-xs font-semibold text-white/60 tracking-widest uppercase">
                  {availableNow} quadra{availableNow !== 1 ? "s" : ""} disponível{availableNow !== 1 ? "s" : ""} agora
                </span>
              </div>
              <h1
                className="text-white leading-none mb-3"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(36px, 6vw, 60px)", letterSpacing: "2px" }}
              >
                Olá, <span style={{ color: "#F9DD17" }}>{member?.full_name?.split(" ")[0] ?? "Associado"}</span>!
              </h1>
              <p className="text-white/70 text-base font-light">
                Bem-vindo ao sistema de reservas da AABB Tênis.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setBookingModal({ open: true })}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5"
                style={{ background: "#F9DD17", color: "#002880", boxShadow: "0 4px 16px rgba(249,221,23,0.3)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Nova Reserva
              </button>
              <Link
                href="/torneios"
                className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
                style={{ background: "rgba(255,255,255,0.12)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Torneios
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: "#F9DD17" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 -mt-5 relative z-10 stagger-children">
          {[
            { label: "Quadras Livres", value: availableNow, sub: `de ${courts.length} quadras`, accent: "#0038A9" },
            { label: "Minhas Reservas", value: myBookings.length, sub: "confirmadas", accent: "#d4b800" },
            { label: "Torneios Ativos", value: tournaments.filter(t => t.status === "in_progress").length, sub: "em andamento", accent: "#16a34a" },
            { label: "Associados", value: membersCount, sub: "ativos no clube", accent: "#7c3aed" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 sm:p-5"
              style={{ boxShadow: "0 4px 16px rgba(0,56,169,0.08)", borderLeft: `4px solid ${stat.accent}` }}
            >
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{stat.label}</div>
              <div
                className="mt-1 leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "38px", color: "#1e293b" }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courts grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-slate-800"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "26px", letterSpacing: "1px" }}
              >
                Quadras <span style={{ color: "#0038A9" }}>Agora</span>
              </h2>
              <Link href="/reservas" className="text-sm font-medium" style={{ color: "#0038A9" }}>
                Ver agenda →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
              {courts.map((court) => {
                const isAvailableNow = court.status === "available" && isCourtAvailableNow(court.id, todayBookings);
                const nextSlot = getNextSlot(court.id, todayBookings);
                const bgClass = court.status !== "available" ? surfaceBg[court.status] : surfaceBg[court.surface] ?? "court-bg-clay";

                return (
                  <div
                    key={court.id}
                    className="bg-white rounded-2xl overflow-hidden border border-slate-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                    style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}
                    onClick={() => isAvailableNow && setBookingModal({ open: true, court })}
                  >
                    {/* Visual */}
                    <div className={`h-28 ${bgClass} relative overflow-hidden flex items-center justify-center`}>
                      <div className="tennis-pattern absolute inset-0 opacity-40" />
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1">
                        <rect x="2" y="4" width="20" height="16" rx="1"/>
                        <line x1="12" y1="4" x2="12" y2="20"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <ellipse cx="12" cy="12" rx="4" ry="6"/>
                      </svg>
                      {/* Status dot */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <CourtStatusDot status={isAvailableNow ? "available" : court.status === "maintenance" ? "maintenance" : "occupied"} />
                      </div>
                      {/* Court number */}
                      <div
                        className="absolute top-1 right-3 opacity-20 text-white leading-none"
                        style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "52px" }}
                      >
                        {court.name.match(/\d+/)?.[0] ?? ""}
                      </div>
                      {court.has_lighting && (
                        <div className="absolute bottom-2 right-3">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2">
                            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="font-semibold text-slate-800 text-sm">{court.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {surfaceLabels[court.surface]}
                        {court.has_lighting ? " · Iluminação" : ""}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          {isAvailableNow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              Disponível agora
                            </span>
                          ) : court.status === "maintenance" ? (
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: "#fefbe8", color: "#8a7000" }}>
                              Em manutenção
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: "#fff7ed", color: "#c2410c" }}>
                              Em uso
                            </span>
                          )}
                          {nextSlot && (
                            <div className="text-xs text-slate-400 mt-1">
                              Próximo livre: <strong className="text-slate-600">{formatTime(nextSlot)}</strong>
                            </div>
                          )}
                        </div>
                        {isAvailableNow && (
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                            style={{ background: "#0038A9" }}
                            onClick={(e) => { e.stopPropagation(); setBookingModal({ open: true, court }); }}
                          >
                            Reservar
                          </button>
                        )}
                        {!isAvailableNow && court.status === "available" && (
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: "#e8eef8", color: "#0038A9" }}
                            onClick={(e) => { e.stopPropagation(); setBookingModal({ open: true, court }); }}
                          >
                            Agendar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">
            {/* My bookings */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Minhas Próximas Reservas</h3>
                <Link href="/reservas" className="text-xs font-medium" style={{ color: "#0038A9" }}>
                  Ver todas
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {myBookings.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <p className="text-sm text-slate-400">Nenhuma reserva futura</p>
                    <button
                      onClick={() => setBookingModal({ open: true })}
                      className="mt-3 text-xs font-medium"
                      style={{ color: "#0038A9" }}
                    >
                      + Fazer primeira reserva
                    </button>
                  </div>
                ) : (
                  myBookings.map((b) => (
                    <div key={b.id} className="px-4 py-3 flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: "#e8eef8" }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0038A9" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {(b as unknown as { court: Court }).court?.name ?? "Quadra"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(b.booking_date)} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                        </div>
                      </div>
                      <button
                        onClick={() => cancelBooking(b.id)}
                        disabled={cancellingId === b.id}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Cancelar"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Active tournaments */}
            {tournaments.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}>
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800 text-sm">Torneios</h3>
                  <Link href="/torneios" className="text-xs font-medium" style={{ color: "#0038A9" }}>
                    Ver todos
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {tournaments.slice(0, 3).map((t) => (
                    <Link key={t.id} href="/torneios" className="block px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className="text-sm font-medium text-slate-800">{t.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={
                            t.status === "in_progress"
                              ? { background: "#f0fdf4", color: "#16a34a" }
                              : { background: "#fefbe8", color: "#8a7000" }
                          }
                        >
                          {t.status === "in_progress" ? "Em andamento" : "Inscrições abertas"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* Booking modal */}
      <BookingModal
        open={bookingModal.open}
        court={bookingModal.court}
        courts={courts}
        member={member}
        onClose={() => setBookingModal({ open: false })}
        onSuccess={() => {
          setBookingModal({ open: false });
          showToast("Reserva confirmada com sucesso!", "success");
          router.refresh();
        }}
      />
    </div>
  );
}
