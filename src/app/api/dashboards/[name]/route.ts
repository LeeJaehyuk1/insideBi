import { NextResponse } from "next/server";

const BACKEND = process.env.AI_BACKEND_URL ?? "http://localhost:8000";

export async function DELETE(
  _req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const res = await fetch(
      `${BACKEND}/api/dashboards/${encodeURIComponent(params.name)}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
