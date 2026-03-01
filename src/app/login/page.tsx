"use client";
// src/app/login/page.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
      } else {
        // Register
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) throw signUpError;

        // Create member profile
        if (data.user) {
          const memberNumber = `AABB-${Math.floor(1000 + Math.random() * 9000)}`;
          await supabase.from("members").insert({
            user_id: data.user.id,
            full_name: name,
            member_number: memberNumber,
            email,
            phone: phone || null,
            status: "active",
          });
        }

        setSuccess(
          "Conta criada! Verifique seu e-mail para confirmar o cadastro. Se não encontrar, confira a pasta de spam.",
        );
        setMode("login");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(
        msg.includes("Invalid login credentials")
          ? "E-mail ou senha incorretos."
          : msg.includes("User already registered")
            ? "Este e-mail já está cadastrado. Faça login."
            : msg.includes("Password should be at least")
              ? "A senha deve ter no mínimo 6 caracteres."
              : msg,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0038A9 0%, #1a4fc4 60%, #2060d8 100%)",
        }}
      >
        {/* Tennis court pattern */}
        <div className="tennis-pattern absolute inset-0 opacity-60" />

        {/* Decorative circle */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background: "#F9DD17" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-5"
          style={{ background: "white" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3C8 7 8 17 12 21" />
              <path d="M12 3C16 7 16 17 12 21" />
            </svg>
            <div
              className="absolute bottom-0 left-0 right-0 h-1.5"
              style={{ background: "#F9DD17" }}
            />
          </div>
          <div>
            <div
              className="text-white text-xl tracking-widest"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              AABB Tênis
            </div>
            <div className="text-xs text-white/60 tracking-wider uppercase">
              Associação Atlética
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          <h1
            className="text-white mb-4 leading-none"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "clamp(48px, 5vw, 72px)",
              letterSpacing: "2px",
            }}
          >
            Reserve sua
            <br />
            <span style={{ color: "#F9DD17" }}>quadra</span> agora
          </h1>
          <p className="text-white/70 text-lg font-light max-w-sm">
            Agende horários, gerencie reservas e participe dos melhores torneios
            de tênis da AABB.
          </p>

          {/* Feature pills */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: "📅", text: "Reservas em tempo real" },
              { icon: "🏆", text: "Chaveamento automático de torneios" },
              { icon: "📱", text: "Acesso pelo celular ou computador" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(4px)",
                }}
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-white/90 text-sm font-medium">
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs">
          <div className="w-8 h-px" style={{ background: "#F9DD17" }} />
          AABB — Associação Atlética Banco do Brasil
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{ background: "#F9DD17" }}
        />
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "#0038A9" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3C8 7 8 17 12 21" />
                <path d="M12 3C16 7 16 17 12 21" />
              </svg>
            </div>
            <span
              className="text-lg tracking-widest"
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                color: "#0038A9",
              }}
            >
              AABB Tênis
            </span>
          </div>

          <h2 className="text-2xl font-semibold text-slate-800 mb-1">
            {mode === "login" ? "Bem-vindo de volta!" : "Criar conta"}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {mode === "login"
              ? "Entre com suas credenciais para acessar o sistema."
              : "Preencha os dados para se cadastrar como associado."}
          </p>

          {/* Toggle tabs */}
          <div
            className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: "#f1f5f9" }}
          >
            {(
              ["login" /*"register" // Removido seção de cadastro */] as const
            ).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                  setSuccess("");
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-150"
                style={
                  mode === m
                    ? {
                        background: "white",
                        color: "#0038A9",
                        boxShadow: "0 1px 3px rgba(0,56,169,0.1)",
                      }
                    : { color: "#64748b" }
                }
              >
                {m === "login" ? "Entrar" : "Cadastrar"}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-fade-in"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-0.5 flex-shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div
              className="mb-4 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-fade-in"
              style={{
                background: "#f0fdf4",
                color: "#16a34a",
                border: "1px solid #bbf7d0",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="mt-0.5 flex-shrink-0"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="form-input w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none transition-all"
                  style={{ fontFamily: "inherit" }}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="form-input w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none transition-all"
                style={{ fontFamily: "inherit" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "register" ? "Mínimo 6 caracteres" : "••••••••"
                }
                className="form-input w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none transition-all"
                style={{ fontFamily: "inherit" }}
              />
            </div>

            {mode === "register" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Telefone{" "}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="form-input w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none transition-all"
                  style={{ fontFamily: "inherit" }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm mt-2 transition-all duration-150 flex items-center justify-center gap-2"
              style={{
                background: loading ? "#e2e8f0" : "#F9DD17",
                color: loading ? "#94a3b8" : "#002880",
                boxShadow: loading
                  ? "none"
                  : "0 4px 16px rgba(249,221,23,0.35)",
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin-custom"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Aguarde...
                </>
              ) : mode === "login" ? (
                "Entrar no Sistema"
              ) : (
                "Criar Minha Conta"
              )}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-center text-xs text-slate-400 mt-6">
              Acesso restrito a associados da AABB.{" "}
              {/*<button
                onClick={() => setMode("register")}
                className="font-medium"
                style={{ color: "#0038A9" }}
              >
                Cadastre-se aqui.
              </button>*/}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
