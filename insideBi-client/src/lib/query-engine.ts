import { QueryConfig, QueryResult } from "@/types/query";
import { apiFetch } from "@/lib/api-client";
import { getRegistryEntry } from "@/lib/dataset-registry";
import { isCustomDataset, getCustomDatasetRows } from "@/lib/custom-dataset-runtime";

export async function executeQuery<T = Record<string, unknown>>(
  config: QueryConfig
): Promise<QueryResult<T>> {
  const entry = getRegistryEntry(config.datasetId);

  // 커스텀 데이터셋(Excel / SQL) 처리
  if (!entry && isCustomDataset(config.datasetId)) {
    const customRows = getCustomDatasetRows(config.datasetId) ?? [];
    return {
      data: customRows as unknown as T[],
      meta: {
        total: customRows.length,
        datasetId: config.datasetId,
        executedAt: new Date().toISOString(),
        params: config,
      },
    };
  }

  if (!entry) {
    // 등록된 데이터셋이 없으면 실제 DB 테이블로 조회
    const activeFilters = (config.filters ?? []).filter(
      (f) => String(f.value).trim() !== "" || f.operator === "empty" || f.operator === "not_empty"
    );
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    for (const f of activeFilters) {
      const col = f.column;
      const fv = f.value;
      switch (f.operator) {
        case "eq":           conditions.push(`${col} = $${idx++}`); params.push(fv); break;
        case "neq":          conditions.push(`${col} != $${idx++}`); params.push(fv); break;
        case "contains":     conditions.push(`${col}::text ILIKE $${idx++}`); params.push(`%${fv}%`); break;
        case "not_contains": conditions.push(`${col}::text NOT ILIKE $${idx++}`); params.push(`%${fv}%`); break;
        case "starts":       conditions.push(`${col}::text ILIKE $${idx++}`); params.push(`${fv}%`); break;
        case "ends":         conditions.push(`${col}::text ILIKE $${idx++}`); params.push(`%${fv}`); break;
        case "empty":        conditions.push(`(${col} IS NULL OR ${col}::text = '')`); break;
        case "not_empty":    conditions.push(`(${col} IS NOT NULL AND ${col}::text != '')`); break;
        case "gte":          conditions.push(`${col} >= $${idx++}`); params.push(fv); break;
        case "lte":          conditions.push(`${col} <= $${idx++}`); params.push(fv); break;
        case "between":      conditions.push(`${col} BETWEEN $${idx++} AND $${idx++}`); params.push(fv); params.push(f.value2 ?? fv); break;
      }
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const lim = config.limit && config.limit > 0 ? `LIMIT ${config.limit}` : "";
    const sql = `SELECT * FROM ${config.datasetId} ${where} ${lim}`.trim();

    try {
      // Vite React 앱 = 브라우저 전용, 항상 API 호출
      const res = await apiFetch("/api/db-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, params }),
      });
      const json = await res.json();
      const rows: Record<string, unknown>[] = json.rows ?? [];
      return {
        data: rows as unknown as T[],
        meta: { total: rows.length, datasetId: config.datasetId, executedAt: new Date().toISOString(), params: config },
      };
    } catch {
      return {
        data: [],
        meta: { total: 0, datasetId: config.datasetId, executedAt: new Date().toISOString(), params: config },
      };
    }
  }

  const { schema, queryFn } = entry;
  const rawRows = queryFn();
  const total = rawRows.length;
  let rows = rawRows;

  // Date range filter — skip for scalar datasets (no defaultDateColumn)
  if (config.dateRange && schema.defaultDateColumn) {
    const { from, to } = config.dateRange;
    const dateCol = schema.defaultDateColumn;
    rows = rows.filter((row) => {
      const rowDate = row[dateCol] as string | undefined;
      if (!rowDate) return true;
      const len = rowDate.length;
      return rowDate >= from.slice(0, len) && rowDate <= to.slice(0, len);
    });
  }

  // Column filters
  if (config.filters?.length) {
    for (const f of config.filters) {
      rows = rows.filter((row) => {
        const val = row[f.column];
        const sv = String(val ?? "");
        const fv = String(f.value ?? "");
        switch (f.operator) {
          case "eq":           return sv === fv;
          case "neq":          return sv !== fv;
          case "contains":     return sv.toLowerCase().includes(fv.toLowerCase());
          case "not_contains": return !sv.toLowerCase().includes(fv.toLowerCase());
          case "starts":       return sv.toLowerCase().startsWith(fv.toLowerCase());
          case "ends":         return sv.toLowerCase().endsWith(fv.toLowerCase());
          case "empty":        return sv === "" || val == null;
          case "not_empty":    return sv !== "" && val != null;
          case "gte":          return Number(val) >= Number(f.value);
          case "lte":          return Number(val) <= Number(f.value);
          default:             return true;
        }
      });
    }
  }

  // Limit
  if (config.limit && config.limit > 0) {
    rows = rows.slice(0, config.limit);
  }

  // groupBy is accepted but deferred to Phase 3
  return {
    data: rows as unknown as T[],
    meta: {
      total,
      datasetId: config.datasetId,
      executedAt: new Date().toISOString(),
      params: config,
    },
  };
}
