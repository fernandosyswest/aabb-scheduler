"use client";
// src/components/ToastProvider.tsx

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Global event system
export function showToast(message: string, type: ToastType = "info") {
  window.dispatchEvent(
    new CustomEvent("aabb-toast", { detail: { message, type } })
  );
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent).detail;
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
    window.addEventListener("aabb-toast", handler);
    return () => window.removeEventListener("aabb-toast", handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[1000] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium max-w-xs"
          style={{
            background: t.type === "success" ? "#1a3a1a" : t.type === "error" ? "#3a1a1a" : "#1a2a3a",
            color: "white",
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            borderLeft: `4px solid ${t.type === "success" ? "#4ade80" : t.type === "error" ? "#f87171" : "#F9DD17"}`,
          }}
        >
          {t.type === "success" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" className="flex-shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          {t.type === "error" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {t.type === "info" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F9DD17" strokeWidth="2.5" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="8" /><line x1="12" y1="12" x2="12" y2="16" />
            </svg>
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
