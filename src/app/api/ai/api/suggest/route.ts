import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

export async function GET(_req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND}/api/suggest`);
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 503 });
  }
}
