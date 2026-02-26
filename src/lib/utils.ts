import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKRW(value: number | undefined | null, unit: "억" | "조" | "원" = "억"): string {
  if (value === undefined || value === null || !isFinite(value)) return "—";
  if (unit === "조") return `${(value / 10000).toFixed(1)}조`;
  if (unit === "억") return `${value.toLocaleString("ko-KR")}억`;
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatPct(value: number | undefined | null, digits = 2): string {
  if (value === undefined || value === null || !isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export function formatBps(value: number | undefined | null): string {
  if (value === undefined || value === null || !isFinite(value)) return "—";
  return `${value.toFixed(0)}bp`;
}
