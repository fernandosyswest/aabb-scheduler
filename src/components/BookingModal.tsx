"use client";
// src/components/BookingModal.tsx

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Court, Member } from "@/types";
import { BOOKING_HOURS, addMinutesToTime, durationToMinutes, surfaceLabels } from "@/lib/utils";

interface BookingModalProps {
  open: boolean;
  court?: Court;
  courts: Court[];
  member: Member | null;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATIONS = ["30 min", "1 hora", "1h30", "2 horas"];

export default function BookingModal({ open, court: initialCourt, courts, member, onClose, onSuccess }: BookingModalProps) {
  const [selectedCourtId, setSelectedCourtId] = useState(initialCourt?.id ?? "");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("1 hora");
  const [partnerName, setPartnerName] = useState("");
  const [type, setType] = useState<"casual" | "doubles" | "training">("casual");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [weeklyCount, setWeeklyCount] = useState(0);

  const availableCourts = courts.filter((c) => c.status === "available");
  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setSelectedCourtId(initialCourt?.id ?? (availableCourts[0]?.id ?? ""));
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setDuration("1 hora");
      setPartnerName("");
      setType("casual");
      setNotes("");
      setError("");
      if (member) checkWeeklyCount();
    }
  }, [open, initialCourt]);

  async function checkWeeklyCount() {
    if (!member) return;
    const supabase = createClient();
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("member_id", member.id)
      .eq("status", "confirmed")
      .gte("booking_date", startOfWeek.toISOString().split("T")[0])
      .lte("booking_date", endOfWeek.toISOString().split("T")[0]);

    setWeeklyCount(count ?? 0);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) { setError("Perfil de associado não encontrado."); return; }
    if (!selectedCourtId) { setError("Selecione uma quadra."); return; }
    if (weeklyCount >= 2) { setError("Você já atingiu o limite de 2 reservas por semana."); return; }

    setLoading(true);
    setError("");

    const endTime = addMinutesToTime(startTime, durationToMinutes(duration));
    const supabase = createClient();

    // Check availability
    const { data: conflict } = await supabase
      .from("bookings")
      .select("id")
      .eq("court_id", selectedCourtId)
      .eq("booking_date", date)
      .eq("status", "confirmed")
      .lt("start_time", endTime)
      .gt("end_time", startTime)
      .limit(1);

    if (conflict && conflict.length > 0) {
      setError("Este horário já está reservado. Escolha outro horário.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      court_id: selectedCourtId,
      member_id: member.id,
      booking_date: date,
      start_time: startTime,
      end_time: endTime,
      type,
      status: "confirmed",
      partner_name: partnerName || null,
      notes: notes || null,
    });

    setLoading(false);
    if (insertError) {
      setError("Erro ao criar reserva: " + insertError.message);
    } else {
      onSuccess();
    }
  }

  if (!open) return null;

  const endTime = addMinutesToTime(startTime, durationToMinutes(duration));
  const today = new Date().toISOString().split("T")[0];
  const maxDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  })();

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden animate-modal"
        style={{ boxShadow: "0 20px 60px rgba(0,56,169,0.2)", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Nova Reserva</h3>
            <p className="text-xs text-slate-400 mt-0.5">Preencha os dados para confirmar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Weekly limit notice */}
          {weeklyCount >= 1 && (
            <div
              className="px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
              style={{
                background: weeklyCount >= 2 ? "#fef2f2" : "#fefbe8",
                color: weeklyCount >= 2 ? "#dc2626" : "#8a7000",
                border: `1px solid ${weeklyCount >= 2 ? "#fecaca" : "#fde68a"}`,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {weeklyCount >= 2
                ? "Limite de 2 reservas por semana atingido."
                : `Você tem ${weeklyCount}/2 reservas esta semana.`}
            </div>
          )}

          {/* Selected court preview */}
          {selectedCourt && (
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#e8eef8" }}
            >
              <div
                className={`w-10 h-10 rounded-lg flex-shrink-0 ${
                  selectedCourt.status !== "available" ? "court-bg-maintenance" : `court-bg-${selectedCourt.surface}`
                }`}
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="1"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="2" y1="12" x2="22" y2="12"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800">{selectedCourt.name}</div>
                <div className="text-xs text-slate-500">
                  {surfaceLabels[selectedCourt.surface]}{selectedCourt.has_lighting ? " · Iluminação inclusa" : ""}
                </div>
              </div>
            </div>
          )}

          {/* Court selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Quadra
            </label>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none"
              style={{ fontFamily: "inherit" }}
            >
              <option value="">Selecionar quadra...</option>
              {availableCourts.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {surfaceLabels[c.surface]}</option>
              ))}
            </select>
          </div>

          {/* Date & time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Data</label>
              <input
                type="date"
                value={date}
                min={today}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none"
                style={{ fontFamily: "inherit" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Duração</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none"
                style={{ fontFamily: "inherit" }}
              >
                {DURATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Time picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Horário: <span style={{ color: "#0038A9" }}>{startTime.replace(":", "h")} – {endTime.replace(":", "h")}</span>
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
              {BOOKING_HOURS.filter((_, i) => i % 2 === 0).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setStartTime(h)}
                  className="py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={
                    startTime === h
                      ? { background: "#0038A9", color: "white" }
                      : { background: "#f1f5f9", color: "#475569" }
                  }
                >
                  {h.replace(":", "h")}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Tipo</label>
            <div className="flex gap-2">
              {(["casual", "doubles", "training"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={
                    type === t
                      ? { background: "#0038A9", color: "white" }
                      : { background: "#f1f5f9", color: "#475569" }
                  }
                >
                  {t === "casual" ? "Simples" : t === "doubles" ? "Duplas" : "Treino"}
                </button>
              ))}
            </div>
          </div>

          {/* Partner */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Adversário / Parceiro <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Nome do parceiro..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none"
              style={{ fontFamily: "inherit" }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Observações <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex.: precisamos de bolas..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none"
              style={{ fontFamily: "inherit" }}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm flex items-start gap-2" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || weeklyCount >= 2}
            className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading || weeklyCount >= 2 ? "#e2e8f0" : "#F9DD17",
              color: loading || weeklyCount >= 2 ? "#94a3b8" : "#002880",
              boxShadow: loading || weeklyCount >= 2 ? "none" : "0 4px 16px rgba(249,221,23,0.3)",
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin-custom" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Confirmando...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Confirmar Reserva
              </>
            )}
          </button>

          <p className="text-center text-xs text-slate-400">
            Cancelamento gratuito até 2h antes do horário.
          </p>
        </form>
      </div>
    </div>
  );
}
