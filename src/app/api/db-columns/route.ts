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
    
    // 1. 컬럼 정보 조회
    const colResult = await pool.query(
      `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table]
    );

    // 2. 기본키(PK) 컬럼 조회
    const pkResult = await pool.query(
      `SELECT kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = $1
         AND tc.table_name = $2`,
      [schema, table]
    );

    const pkColumns = new Set(pkResult.rows.map(r => r.column_name));

    const columns = colResult.rows.map((row) => {
      const colName = row.column_name as string;
      const dt = row.data_type as string;
      const isPk = pkColumns.has(colName);
      
      const isNum = ["integer","bigint","smallint","numeric","decimal","real","double precision","float"].some((t) => dt.includes(t));
      const isDate = ["date","timestamp","time"].some((t) => dt.includes(t));
      const type = isNum ? "number" : isDate ? "date" : "string";
      
      return {
        key: colName,
        label: colName.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
        type,
        role: isPk ? "identifier" : (isNum ? "measure" : "dimension"),
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
