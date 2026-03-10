import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

// ── 간단한 슬라이딩 윈도우 Rate Limiter (단일 인스턴스용) ──────────
const WINDOW_MS = 60_000; // 1분
const MAX_REQUESTS = 10;  // IP당 분당 최대 요청 수
const _counts = new Map<string, { n: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = _counts.get(ip);
  if (!rec || now > rec.reset) {
    _counts.set(ip, { n: 1, reset: now + WINDOW_MS });
    return false; // 허용
  }
  if (rec.n >= MAX_REQUESTS) return true; // 차단
  rec.n++;
  return false; // 허용
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (checkRateLimit(ip)) {
    return NextResponse.json(
      { detail: "요청이 너무 많습니다. 1분 후 다시 시도하세요." },
      {
        status: 429,
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": String(MAX_REQUESTS),
        },
      }
    );
  }

  try {
    const body = await req.text();
    const res = await fetch(`${BACKEND}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "AI 백엔드에 연결할 수 없습니다." },
      { status: 503 }
    );
  }
}
