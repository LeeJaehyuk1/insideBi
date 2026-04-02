import type { ColumnMeta } from "@/types/dataset";
import { DB_TABLES } from "@/lib/db-catalog";
import { apiFetch } from "@/lib/api-client";

/** API를 통해 DB information_schema에서 컬럼 조회 */
export async function getColumnsForTableAsync(tableId: string): Promise<ColumnMeta[]> {
  try {
    const res = await apiFetch(`/api/db-columns?table=${encodeURIComponent(tableId)}`);
    const json = await res.json();
    return json.columns ?? [];
  } catch {
    return [];
  }
}

/** tableId → 표시용 레이블 (Pascal Case) */
export function getTableLabel(tableId: string, dbId = "railway"): string {
  return (
    DB_TABLES[dbId]?.find((t) => t.tableId === tableId)?.label ??
    tableId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
  );
}

/** @deprecated mock 데이터 기반 - 실제 DB가 있으면 getColumnsForTableAsync 사용 */
export function getColumnsForTable(_tableId: string, _dbId = "railway"): ColumnMeta[] {
  return [];
}
