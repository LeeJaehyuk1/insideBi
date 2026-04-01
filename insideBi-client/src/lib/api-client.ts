import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * fetch() 대체 함수 - VITE_API_URL을 prefix로 자동 추가
 * 기존 fetch("/api/...") → apiFetch("/api/...")로 교체하면 됨
 */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${BASE_URL}${path}`;
  return fetch(url, init);
}

/**
 * 절대 URL로 변환 (직접 fetch 사용 시)
 */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}

