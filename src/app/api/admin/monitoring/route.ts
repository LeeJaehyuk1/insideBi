import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const pw = req.headers.get("x-admin-password") ?? "";
  try {
    const res = await fetch(`${BACKEND}/admin/monitoring`, {
      cache: "no-store",
      headers: { "x-admin-password": pw },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "연결 실패" }, { status: 503 });
  }
}
