"use client";
// src/components/ReservasClient.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Court, Member, Booking } from "@/types";
import { formatDate, formatTime, getWeekDays, getToday, surfaceLabels, BOOKING_HOURS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "./ToastProvider";
import BookingModal from "./BookingModal";

interface Props {
  courts: Court[];
  member: Member | null;
  myBookings: Booking[];
  allBookings: (Booking & { member?: { full_name: string } })[];
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const fullDayNames = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];

export default function ReservasClient({ courts, member, myBookings, allBookings }: Props) {
  const router = useRouter();
  const today = getToday();
  const weekDays = getWeekDays(today, 7);
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookingModal, setBookingModal] = useState<{ open: boolean; court?: Court }>({ open: false });
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const availableCourts = courts.filter((c) => c.status === "available");

  // Bookings for selected date
  const dayBookings = allBookings.filter((b) => b.booking_date === selectedDate);

  function getSlotStatus(courtId: string, hour: string) {
    const b = dayBookings.find(
      (bk) => bk.court_id === courtId && bk.start_time <= hour && bk.end_time > hour
    );
    if (!b) return { status: "free" as const, booking: null };
    if (b.member_id === member?.id) return { status: "mine" as const, booking: b };
    return { status: "booked" as const, booking: b };
  }

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

  const selectedDateObj = (() => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Date(y, m - 1, d);
  })();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1
                className="text-slate-800 leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", letterSpacing: "1px" }}
              >
                Reservas de <span style={{ color: "#0038A9" }}>Quadras</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Selecione um dia e horário para reservar
              </p>
            </div>
            <button
              onClick={() => setBookingModal({ open: true })}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 self-start sm:self-auto"
              style={{ background: "#0038A9", color: "white", boxShadow: "0 4px 12px rgba(0,56,169,0.2)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Nova Reserva
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main: time grid */}
          <div className="xl:col-span-3">
            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-hide">
              {weekDays.map((d) => {
                const [y, m, day] = d.split("-").map(Number);
                const dateObj = new Date(y, m - 1, day);
                const isActive = d === selectedDate;
                const isToday = d === today;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className="flex-shrink-0 w-14 flex flex-col items-center py-2.5 rounded-xl border transition-all"
                    style={
                      isActive
                        ? { background: "#0038A9", borderColor: "#0038A9", color: "white" }
                        : isToday
                        ? { background: "white", borderColor: "#F9DD17", color: "#1e293b" }
                        : { background: "white", borderColor: "#e2e8f0", color: "#64748b" }
                    }
                  >
                    <span className="text-xs font-semibold opacity-70 uppercase tracking-wide">
                      {dayNames[dateObj.getDay()]}
                    </span>
                    <span
                      className="leading-none mt-0.5"
                      style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px" }}
                    >
                      {dateObj.getDate()}
                    </span>
                    <span className="text-xs opacity-60">{monthNames[m - 1]}</span>
                  </button>
                );
              })}
            </div>

            {/* Time grid card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}>
              <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">
                      {fullDayNames[selectedDateObj.getDay()]}, {selectedDateObj.getDate()} de{" "}
                      {["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"][selectedDateObj.getMonth()]}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Horários das 07h às 21h · {availableCourts.length} quadras disponíveis
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }} />
                      Livre
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "#eff6ff", border: "1px solid #93c5fd" }} />
                      Reservado
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-sm" style={{ background: "linear-gradient(135deg,#0038A9,#1a4fc4)", border: "1px solid #0038A9" }} />
                      Meu
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div style={{ minWidth: `${50 + availableCourts.length * 130}px` }}>
                  {/* Column headers */}
                  <div
                    className="grid sticky top-0 bg-white z-10 border-b border-slate-100"
                    style={{ gridTemplateColumns: `50px repeat(${availableCourts.length}, 1fr)` }}
                  >
                    <div />
                    {availableCourts.map((c) => (
                      <div key={c.id} className="py-3 px-2 text-center text-xs font-semibold text-slate-600 border-l border-slate-100">
                        {c.name.replace(" – ", "\n")}
                      </div>
                    ))}
                  </div>

                  {/* Time rows */}
                  <div className="divide-y divide-slate-100">
                    {BOOKING_HOURS.filter((_, i) => i % 2 === 0).map((hour) => (
                      <div
                        key={hour}
                        className="grid"
                        style={{ gridTemplateColumns: `50px repeat(${availableCourts.length}, 1fr)` }}
                      >
                        <div className="py-2 px-2 text-right text-xs text-slate-400 font-medium self-center pr-3">
                          {hour.replace(":", "h")}
                        </div>
                        {availableCourts.map((court) => {
                          const { status, booking } = getSlotStatus(court.id, hour);
                          return (
                            <div key={court.id} className="p-1 border-l border-slate-100">
                              <div
                                className={`h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                                  status === "free" ? "slot-free" :
                                  status === "mine" ? "slot-mine" :
                                  "slot-booked"
                                }`}
                                onClick={() => {
                                  if (status === "free") {
                                    setBookingModal({ open: true, court });
                                  }
                                }}
                              >
                                {status === "free" && (
                                  <span className="opacity-70">Livre</span>
                                )}
                                {status === "mine" && (
                                  <span className="text-xs px-1 text-center leading-tight">Meu</span>
                                )}
                                {status === "booked" && (
                                  <span className="text-xs px-1 text-center leading-tight truncate">
                                    {booking?.member?.full_name?.split(" ")[0] ?? "Ocupado"}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* My bookings */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}>
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Minhas Reservas</h3>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "#e8eef8", color: "#0038A9" }}
                >
                  {myBookings.length}
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {myBookings.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <p className="text-sm text-slate-400">Sem reservas confirmadas</p>
                  </div>
                ) : (
                  myBookings.map((b) => (
                    <div key={b.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-800 truncate">
                            {(b as unknown as { court: Court }).court?.name ?? "Quadra"}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {formatDate(b.booking_date)}
                          </div>
                          <div className="text-xs font-medium mt-0.5" style={{ color: "#0038A9" }}>
                            {formatTime(b.start_time)} – {formatTime(b.end_time)}
                          </div>
                          {b.partner_name && (
                            <div className="text-xs text-slate-400 mt-0.5">com {b.partner_name}</div>
                          )}
                        </div>
                        <button
                          onClick={() => cancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5"
                          title="Cancelar reserva"
                        >
                          {cancellingId === b.id ? (
                            <svg className="animate-spin-custom" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 11-6.219-8.56"/>
                            </svg>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-5 py-3 border-t border-slate-100">
                <button
                  onClick={() => setBookingModal({ open: true })}
                  className="w-full py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "#e8eef8", color: "#0038A9" }}
                >
                  + Nova Reserva
                </button>
              </div>
            </div>

            {/* Rules */}
            <div
              className="rounded-2xl p-4"
              style={{ background: "#e8eef8", border: "1px solid rgba(0,56,169,0.1)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0038A9" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Regras de Reserva</span>
              </div>
              <ul className="flex flex-col gap-2">
                {[
                  "Máximo 2 reservas por semana",
                  "Cancelamento até 2h antes sem cobrança",
                  "Reservas até 7 dias antecipados",
                  "Funcionamento: 07h às 22h",
                  "Somente associados ativos",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-xs text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ background: "#0038A9" }} />
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        open={bookingModal.open}
        court={bookingModal.court}
        courts={courts}
        member={member}
        onClose={() => setBookingModal({ open: false })}
        onSuccess={() => {
          setBookingModal({ open: false });
          showToast("Reserva confirmada!", "success");
          router.refresh();
        }}
      />
    </div>
  );
}
