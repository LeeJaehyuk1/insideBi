import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  headers: { "Content-Type": "application/json" },
});

// Convenience wrappers matching fetch() usage pattern in existing hooks
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  const body = init?.body as string | undefined;

  const res = await api.request({
    url: path,
    method,
    data: body ? JSON.parse(body) : undefined,
    headers: init?.headers as Record<string, string>,
  });

  // Return a Response-like object so existing hooks can call .json()
  return new Response(JSON.stringify(res.data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
