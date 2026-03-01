"use client";
// src/components/TorneiosClient.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Member, Tournament, TournamentRegistration, TournamentMatch } from "@/types";
import { modalityLabels, formatLabels, roundLabels } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "./ToastProvider";

interface Props {
  member: Member | null;
  tournaments: Tournament[];
  allRegistrations: (TournamentRegistration & { member?: { full_name: string; member_number: string } })[];
  matches: TournamentMatch[];
}

type TabView = "list" | "bracket";

function StatusBadge({ status }: { status: Tournament["status"] }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    draft: { bg: "#f8fafc", color: "#64748b", label: "Rascunho" },
    registration: { bg: "#fefbe8", color: "#8a7000", label: "Inscrições Abertas" },
    in_progress: { bg: "#f0fdf4", color: "#16a34a", label: "Em Andamento" },
    completed: { bg: "#f1f5f9", color: "#64748b", label: "Encerrado" },
    cancelled: { bg: "#fef2f2", color: "#dc2626", label: "Cancelado" },
  };
  const s = styles[status] ?? styles.draft;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function BracketView({ tournament, matches, registrations }: {
  tournament: Tournament;
  matches: TournamentMatch[];
  registrations: (TournamentRegistration & { member?: { full_name: string } })[];
}) {
  // Group by round
  const rounds = ["R64", "R32", "R16", "QF", "SF", "F"];
  const presentRounds = rounds.filter((r) => matches.some((m) => m.round === r));

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-3">
          <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
          <path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/>
        </svg>
        <p className="font-medium">Chave ainda não gerada</p>
        <p className="text-sm mt-1">As inscrições precisam ser encerradas para gerar o bracket.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-2 min-w-max">
        {presentRounds.map((round) => {
          const roundMatches = matches.filter((m) => m.round === round);
          return (
            <div key={round} className="flex flex-col" style={{ minWidth: "170px" }}>
              {/* Round title */}
              <div
                className="text-center text-xs font-semibold uppercase tracking-widest py-2 px-4 rounded-lg mb-3"
                style={{ background: "#e8eef8", color: "#0038A9" }}
              >
                {roundLabels[round] ?? round}
              </div>

              {/* Matches */}
              <div className="flex flex-col" style={{ gap: "8px" }}>
                {roundMatches.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-xl overflow-hidden border transition-all hover:shadow-md"
                    style={{ borderColor: "#e2e8f0", boxShadow: "0 1px 3px rgba(0,56,169,0.05)" }}
                  >
                    {[
                      { id: match.player1_id, name: match.player1_name, isWinner: match.winner_id === match.player1_id },
                      { id: match.player2_id, name: match.player2_name, isWinner: match.winner_id === match.player2_id },
                    ].map((player, idx) => (
                      <div
                        key={idx}
                        className="px-3 py-2 flex items-center justify-between gap-2"
                        style={
                          player.isWinner && match.winner_id
                            ? { background: "#e8eef8", borderBottom: idx === 0 ? "1px solid #e2e8f0" : "none" }
                            : { background: "white", borderBottom: idx === 0 ? "1px solid #f1f5f9" : "none" }
                        }
                      >
                        <span
                          className="text-xs font-medium truncate"
                          style={{
                            color: player.isWinner && match.winner_id ? "#0038A9" : player.name ? "#334155" : "#cbd5e1",
                            maxWidth: "110px",
                          }}
                        >
                          {player.name ?? (match.status === "pending" ? "A definir" : "BYE")}
                        </span>
                        {player.isWinner && match.winner_id && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0038A9" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                    ))}
                    {match.score && (
                      <div className="px-3 py-1 text-xs text-slate-400 text-center" style={{ background: "#f8fafc" }}>
                        {match.score}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function TorneiosClient({ member, tournaments, allRegistrations, matches }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabView>("list");
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(
    tournaments.find((t) => t.status === "in_progress")?.id ?? null
  );
  const [createModal, setCreateModal] = useState(false);
  const [registering, setRegistering] = useState<string | null>(null);

  // Create tournament form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    modality: "singles_men" as Tournament["modality"],
    format: "single_elimination" as Tournament["format"],
    max_participants: 16,
    start_date: "",
    end_date: "",
    registration_deadline: "",
  });
  const [creating, setCreating] = useState(false);

  const selectedTournament = tournaments.find((t) => t.id === selectedTournamentId);
  const tournamentRegistrations = allRegistrations.filter((r) => r.tournament_id === selectedTournamentId);
  const tournamentMatches = matches.filter((m) => m.tournament_id === selectedTournamentId);

  const myRegistration = member
    ? allRegistrations.find((r) => r.member_id === member.id && r.tournament_id === selectedTournamentId)
    : null;

  async function registerForTournament(tournamentId: string) {
    if (!member) return;
    setRegistering(tournamentId);
    const supabase = createClient();
    const { error } = await supabase.from("tournament_registrations").insert({
      tournament_id: tournamentId,
      member_id: member.id,
      status: "registered",
    });
    setRegistering(null);
    if (error) {
      showToast(
        error.message.includes("duplicate") ? "Você já está inscrito neste torneio." : "Erro ao se inscrever.",
        "error"
      );
    } else {
      showToast("Inscrição realizada com sucesso!", "success");
      router.refresh();
    }
  }

  async function createTournament(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tournaments")
      .insert({ ...form, status: "registration", created_by: member?.id })
      .select()
      .single();
    setCreating(false);
    if (error) {
      showToast("Erro ao criar torneio: " + error.message, "error");
    } else {
      showToast("Torneio criado com sucesso!", "success");
      setCreateModal(false);
      setSelectedTournamentId(data.id);
      router.refresh();
    }
  }

  const bannerColors = [
    "linear-gradient(135deg, #0038A9 0%, #1a4fc4 100%)",
    "linear-gradient(135deg, #7c3f00 0%, #c2410c 100%)",
    "linear-gradient(135deg, #166534 0%, #15803d 100%)",
    "linear-gradient(135deg, #374151 0%, #4b5563 100%)",
    "linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)",
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1
                className="text-slate-800 leading-none"
                style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "32px", letterSpacing: "1px" }}
              >
                Torneios <span style={{ color: "#0038A9" }}>AABB</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">Gerencie torneios, inscrições e chaveamentos</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "#f1f5f9" }}>
                {(["list", "bracket"] as TabView[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={
                      tab === t
                        ? { background: "white", color: "#0038A9", boxShadow: "0 1px 3px rgba(0,56,169,0.1)" }
                        : { color: "#64748b" }
                    }
                  >
                    {t === "list" ? "Lista" : "Chave"}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ background: "#F9DD17", color: "#002880", boxShadow: "0 4px 12px rgba(249,221,23,0.25)" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Novo Torneio
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* LIST TAB */}
        {tab === "list" && (
          <div className="space-y-6 animate-fade-up">
            {/* Tournament cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {tournaments.length === 0 ? (
                <div className="col-span-full text-center py-16 text-slate-400">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="mx-auto mb-3">
                    <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
                    <path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/>
                  </svg>
                  <p className="font-medium">Nenhum torneio cadastrado</p>
                  <button onClick={() => setCreateModal(true)} className="mt-3 text-sm font-medium" style={{ color: "#0038A9" }}>
                    + Criar primeiro torneio
                  </button>
                </div>
              ) : (
                tournaments.map((t, idx) => {
                  const regs = allRegistrations.filter((r) => r.tournament_id === t.id);
                  const pct = Math.round((regs.length / t.max_participants) * 100);
                  const isRegistered = member ? regs.some((r) => r.member_id === member.id) : false;

                  return (
                    <div
                      key={t.id}
                      className="bg-white rounded-2xl overflow-hidden border border-slate-200 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                      style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}
                      onClick={() => { setSelectedTournamentId(t.id); setTab("bracket"); }}
                    >
                      {/* Banner */}
                      <div
                        className="h-24 relative overflow-hidden flex items-end p-4"
                        style={{ background: bannerColors[idx % bannerColors.length] }}
                      >
                        <div className="tennis-pattern absolute inset-0 opacity-40" />
                        <div
                          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-15"
                          style={{ background: "#F9DD17" }}
                        />
                        <div className="relative z-10">
                          <div
                            className="text-white leading-tight"
                            style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "22px", letterSpacing: "1px" }}
                          >
                            {t.name}
                          </div>
                          <div className="text-white/70 text-xs">{modalityLabels[t.modality]}</div>
                        </div>
                      </div>

                      <div className="p-4">
                        {/* Meta */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <StatusBadge status={t.status} />
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#f8fafc", color: "#64748b" }}>
                            {formatLabels[t.format]}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {t.start_date} → {t.end_date}
                        </div>

                        {/* Progress */}
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Inscrições</span>
                            <span className="font-medium">{regs.length}/{t.max_participants}</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "#e2e8f0" }}>
                            <div
                              className="h-full rounded-full progress-bar-fill"
                              style={{
                                width: `${pct}%`,
                                background: "linear-gradient(90deg, #0038A9, #F9DD17)",
                              }}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          {t.status === "registration" && !isRegistered && member && (
                            <button
                              onClick={(e) => { e.stopPropagation(); registerForTournament(t.id); }}
                              disabled={registering === t.id || regs.length >= t.max_participants}
                              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                              style={{ background: "#0038A9", color: "white" }}
                            >
                              {registering === t.id ? "Inscrevendo..." : "Inscrever-se"}
                            </button>
                          )}
                          {isRegistered && (
                            <span className="flex-1 py-2 rounded-xl text-xs font-medium text-center" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                              ✓ Inscrito
                            </span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedTournamentId(t.id); setTab("bracket"); }}
                            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
                            style={{ background: "#e8eef8", color: "#0038A9" }}
                          >
                            Ver chave →
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Registered players for selected tournament */}
            {selectedTournament && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">{selectedTournament.name} — Jogadores</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {tournamentRegistrations.length} de {selectedTournament.max_participants} inscritos
                    </p>
                  </div>
                  {selectedTournament.status === "registration" && !myRegistration && member && (
                    <button
                      onClick={() => registerForTournament(selectedTournament.id)}
                      disabled={registering === selectedTournament.id}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: "#0038A9", color: "white" }}
                    >
                      {registering === selectedTournament.id ? "Inscrevendo..." : "Inscrever-se"}
                    </button>
                  )}
                </div>
                <div className="p-5">
                  {tournamentRegistrations.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Nenhum jogador inscrito ainda.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {tournamentRegistrations.map((reg) => {
                        const isMe = reg.member_id === member?.id;
                        return (
                          <div
                            key={reg.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                            style={
                              isMe
                                ? { background: "#e8eef8", borderColor: "#0038A9", color: "#0038A9" }
                                : { background: "#f8fafc", borderColor: "#e2e8f0", color: "#334155" }
                            }
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: isMe ? "#0038A9" : "#e2e8f0", color: isMe ? "white" : "#64748b" }}
                            >
                              {reg.member?.full_name?.charAt(0) ?? "?"}
                            </div>
                            <span className="truncate text-xs font-medium">
                              {reg.member?.full_name?.split(" ")[0] ?? "Jogador"}
                            </span>
                            {isMe && <span className="text-xs opacity-60">(eu)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* BRACKET TAB */}
        {tab === "bracket" && (
          <div className="animate-fade-up">
            {/* Tournament selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {tournaments.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTournamentId(t.id)}
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border"
                  style={
                    selectedTournamentId === t.id
                      ? { background: "#0038A9", color: "white", borderColor: "#0038A9" }
                      : { background: "white", color: "#475569", borderColor: "#e2e8f0" }
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>

            {selectedTournament ? (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,56,169,0.06)" }}>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{selectedTournament.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {modalityLabels[selectedTournament.modality]} · {formatLabels[selectedTournament.format]}
                    </p>
                  </div>
                  <StatusBadge status={selectedTournament.status} />
                </div>
                <div className="p-6">
                  <BracketView
                    tournament={selectedTournament}
                    matches={tournamentMatches}
                    registrations={tournamentRegistrations}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <p>Selecione um torneio para ver a chave.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {createModal && (
        <div
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setCreateModal(false); }}
        >
          <div
            className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden animate-modal"
            style={{ boxShadow: "0 20px 60px rgba(0,56,169,0.2)", maxHeight: "92vh", overflowY: "auto" }}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Criar Novo Torneio</h3>
              <button
                onClick={() => setCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={createTournament} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Nome do Torneio *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex.: Copa AABB 2025"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none"
                  style={{ fontFamily: "inherit" }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Modalidade *</label>
                  <select
                    value={form.modality}
                    onChange={(e) => setForm({ ...form, modality: e.target.value as Tournament["modality"] })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
                    style={{ fontFamily: "inherit" }}
                  >
                    {Object.entries(modalityLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Formato *</label>
                  <select
                    value={form.format}
                    onChange={(e) => setForm({ ...form, format: e.target.value as Tournament["format"] })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
                    style={{ fontFamily: "inherit" }}
                  >
                    {Object.entries(formatLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Número de vagas *</label>
                <select
                  value={form.max_participants}
                  onChange={(e) => setForm({ ...form, max_participants: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none"
                  style={{ fontFamily: "inherit" }}
                >
                  {[4, 8, 16, 32, 64].map((n) => (
                    <option key={n} value={n}>{n} jogadores</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Data início *</label>
                  <input
                    type="date"
                    required
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    style={{ fontFamily: "inherit" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Data fim *</label>
                  <input
                    type="date"
                    required
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                    style={{ fontFamily: "inherit" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Prazo de inscrição</label>
                <input
                  type="date"
                  value={form.registration_deadline}
                  onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none"
                  style={{ fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Descrição / Regulamento</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Informações adicionais sobre o torneio..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none resize-none"
                  style={{ fontFamily: "inherit" }}
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mt-2"
                style={{
                  background: creating ? "#e2e8f0" : "#F9DD17",
                  color: creating ? "#94a3b8" : "#002880",
                  boxShadow: creating ? "none" : "0 4px 16px rgba(249,221,23,0.3)",
                }}
              >
                {creating ? (
                  <>
                    <svg className="animate-spin-custom" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Criando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/>
                      <path d="M18 2H6v7a6 6 0 0012 0V2z"/>
                    </svg>
                    Criar Torneio
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
