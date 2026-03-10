import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${BACKEND}/api/reports/${params.id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ report: null }, { status: 503 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.text();
    const res = await fetch(`${BACKEND}/api/reports/${params.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const res = await fetch(`${BACKEND}/api/reports/${params.id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
