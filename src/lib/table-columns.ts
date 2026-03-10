import type { ColumnMeta } from "@/types/dataset";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { DB_TABLES, getTableData } from "@/lib/db-catalog";

/**
 * tableId (snake_case) → ColumnMeta[]
 * 우선순위: dataCatalog schema → 실제 데이터 첫 행에서 동적 추출
 */
export function getColumnsForTable(tableId: string, dbId = "railway"): ColumnMeta[] {
  // 1) registry 연결된 dataset schema 있으면 우선 사용
  const tableInfo = DB_TABLES[dbId]?.find((t) => t.tableId === tableId);
  if (tableInfo?.datasetId) {
    const schema = getDatasetSchema(tableInfo.datasetId);
    if (schema?.columns?.length) return schema.columns;
  }

  // 2) 실제 데이터 첫 행에서 컬럼 동적 추출
  const rows = getTableData(dbId, tableId);
  if (rows.length > 0) {
    return Object.entries(rows[0]).map(([key, val]) => {
      const type: ColumnMeta["type"] =
        typeof val === "number" ? "number" :
        typeof val === "string" && /^\d{4}-?\d{2}-?\d{2}/.test(val) ? "date" :
        "string";
      return {
        key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        type,
        role: type === "number" ? "measure" : "dimension",
        aggregatable: type === "number",
        filterable: true,
      } as ColumnMeta;
    });
  }

  return [];
}

/** tableId → 표시용 레이블 (Pascal Case) */
export function getTableLabel(tableId: string, dbId = "railway"): string {
  return (
    DB_TABLES[dbId]?.find((t) => t.tableId === tableId)?.label ??
    tableId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
