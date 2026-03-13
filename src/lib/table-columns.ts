import type { ColumnMeta } from "@/types/dataset";
import { DB_TABLES } from "@/lib/db-catalog";

/** 서버 환경에서 DB information_schema로 컬럼 조회 */
export async function getColumnsForTableAsync(tableId: string): Promise<ColumnMeta[]> {
  if (typeof window === "undefined") {
    // 서버: 직접 DB 쿼리
    try {
      const { getPool } = await import("@/lib/db");
      const result = await getPool().query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = $1
         ORDER BY ordinal_position`,
        [tableId]
      );
      return result.rows.map((row) => {
        const dt = row.data_type as string;
        const isNum = ["integer","bigint","smallint","numeric","decimal","real","double precision"].some((t) => dt.includes(t));
        const isDate = ["date","timestamp","time"].some((t) => dt.includes(t));
        const type = isNum ? "number" : isDate ? "date" : "string";
        return {
          key: row.column_name,
          label: (row.column_name as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          type,
          role: isNum ? "measure" : "dimension",
          aggregatable: isNum,
          filterable: true,
        } as ColumnMeta;
      });
    } catch {
      return [];
    }
  } else {
    // 클라이언트: API 호출
    try {
      const res = await fetch(`/api/db-columns?table=${encodeURIComponent(tableId)}`);
      const json = await res.json();
      return json.columns ?? [];
    } catch {
      return [];
    }
  }
}

/** tableId → 표시용 레이블 (Pascal Case) */
export function getTableLabel(tableId: string, dbId = "railway"): string {
  return (
    DB_TABLES[dbId]?.find((t) => t.tableId === tableId)?.label ??
    tableId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** @deprecated mock 데이터 기반 - 실제 DB가 있으면 getColumnsForTableAsync 사용 */
export function getColumnsForTable(_tableId: string, _dbId = "railway"): ColumnMeta[] {
  return [];
}
