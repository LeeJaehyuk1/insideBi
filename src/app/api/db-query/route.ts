import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { sql, params } = await req.json() as { sql: string; params?: unknown[] };

    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "sql 필드가 필요합니다." }, { status: 400 });
    }

    // 허용된 구문만 실행 (SELECT만 허용)
    const normalized = sql.trim().toUpperCase();
    if (!normalized.startsWith("SELECT")) {
      return NextResponse.json({ error: "SELECT 쿼리만 허용됩니다." }, { status: 403 });
    }

    const pool = getPool();
    const result = await pool.query(sql, params ?? []);
    return NextResponse.json({ rows: result.rows, rowCount: result.rowCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "쿼리 실행 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
