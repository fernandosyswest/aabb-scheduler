// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function formatTime(timeStr: string): string {
  return timeStr.substring(0, 5).replace(":", "h");
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function getWeekDays(startDate: string, count = 7): string[] {
  return Array.from({ length: count }, (_, i) => addDays(startDate, i));
}

export const surfaceLabels: Record<string, string> = {
  clay: "Saibro",
  hard: "Cimento",
  grass: "Grama",
  synthetic: "Grama Sint.",
};

export const modalityLabels: Record<string, string> = {
  singles_men: "Simples Masculino",
  singles_women: "Simples Feminino",
  doubles_men: "Duplas Masculino",
  doubles_women: "Duplas Feminino",
  doubles_mixed: "Duplas Misto",
};

export const formatLabels: Record<string, string> = {
  single_elimination: "Eliminação Simples",
  double_elimination: "Eliminação Dupla",
  round_robin: "Round Robin",
};

export const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  registration: "Inscrições Abertas",
  in_progress: "Em Andamento",
  completed: "Encerrado",
  cancelled: "Cancelado",
  confirmed: "Confirmada",
  cancelled_booking: "Cancelada",
  available: "Disponível",
  maintenance: "Manutenção",
  inactive: "Inativa",
};

export const roundLabels: Record<string, string> = {
  R64: "Fase de 64",
  R32: "Fase de 32",
  R16: "Oitavas",
  QF: "Quartas",
  SF: "Semifinal",
  F: "Final",
};

export const BOOKING_HOURS = [
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
];

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function durationToMinutes(duration: string): number {
  const map: Record<string, number> = {
    "30 min": 30,
    "1 hora": 60,
    "1h30": 90,
    "2 horas": 120,
  };
  return map[duration] ?? 60;
}
