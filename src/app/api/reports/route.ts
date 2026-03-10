import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/reports`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ reports: [] }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const res = await fetch(`${BACKEND}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
