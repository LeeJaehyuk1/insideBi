/**
 * Next.js API proxy → AI 백엔드
 * 브라우저에서 같은 origin으로 요청 → CORS 우회
 * /api/ai/api/ask → https://insidebiaiback.up.railway.app/api/ask
 */
import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

async function proxy(req: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const url = `${BACKEND}/${path}`;

  const init: RequestInit = { method: req.method };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
    init.headers = { "Content-Type": "application/json" };
  }

  try {
    const res = await fetch(url, init);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { detail: "AI 백엔드에 연결할 수 없습니다." },
      { status: 503 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params);
}
