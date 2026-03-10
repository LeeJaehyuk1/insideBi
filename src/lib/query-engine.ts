import { QueryConfig, QueryResult } from "@/types/query";
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
    let rawTableRows: Record<string, unknown>[] | undefined;
    const { getTableData } = await import("@/lib/db-catalog");
    
    // Attempt to load from railway or sample mock tables
    const railwayData = getTableData("railway", config.datasetId);
    if (railwayData && railwayData.length > 0) rawTableRows = railwayData;
    else {
      const sampleData = getTableData("sample", config.datasetId);
      if (sampleData && sampleData.length > 0) rawTableRows = sampleData;
    }

    if (!rawTableRows) {
      return {
        data: [],
        meta: {
          total: 0,
          datasetId: config.datasetId,
          executedAt: new Date().toISOString(),
          params: config,
        },
      };
    }

    // Apply generic column filters for raw tables
    let filteredRows = rawTableRows;
    if (config.filters?.length) {
      for (const f of config.filters) {
        filteredRows = filteredRows.filter((row) => {
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
    
    if (config.limit && config.limit > 0) {
      filteredRows = filteredRows.slice(0, config.limit);
    }

    return {
      data: filteredRows as unknown as T[],
      meta: {
        total: rawTableRows.length,
        datasetId: config.datasetId,
        executedAt: new Date().toISOString(),
        params: config,
      },
    };
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
