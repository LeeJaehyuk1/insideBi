import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const password = req.headers.get("x-admin-password") ?? "";
    const body = await req.text();
    const res = await fetch(`${BACKEND}/admin/training/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "AI 백엔드에 연결할 수 없습니다." }, { status: 503 });
  }
}
