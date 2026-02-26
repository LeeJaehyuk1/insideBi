import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKRW(value: number, unit: "억" | "조" | "원" = "억"): string {
  if (unit === "조") return `${(value / 10000).toFixed(1)}조`;
  if (unit === "억") return `${value.toLocaleString("ko-KR")}억`;
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatPct(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export function formatBps(value: number): string {
  return `${value.toFixed(0)}bp`;
}
