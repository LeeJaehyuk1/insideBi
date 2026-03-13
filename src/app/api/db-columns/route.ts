import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const schema = searchParams.get("schema") ?? "public";

  if (!table) {
    return NextResponse.json({ error: "table 파라미터가 필요합니다." }, { status: 400 });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table]
    );

    const columns = result.rows.map((row) => {
      const dt = row.data_type as string;
      const isNum = ["integer","bigint","smallint","numeric","decimal","real","double precision","float"].some((t) => dt.includes(t));
      const isDate = ["date","timestamp","time"].some((t) => dt.includes(t));
      const type = isNum ? "number" : isDate ? "date" : "string";
      return {
        key: row.column_name as string,
        label: (row.column_name as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        type,
        role: isNum ? "measure" : "dimension",
        aggregatable: isNum,
        filterable: true,
      };
    });

    return NextResponse.json({ columns });
  } catch (err) {
    const message = err instanceof Error ? err.message : "컬럼 조회 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
