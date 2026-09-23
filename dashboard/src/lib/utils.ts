import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number, currency = "COP") {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

/** Acepta 126.448 · 126,448 · 126448 → 126448 */
export function parseMoneyInput(raw: string): number {
  if (!raw || !String(raw).trim()) return 0;
  const digits = String(raw).replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}
