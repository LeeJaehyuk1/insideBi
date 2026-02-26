import { DateRangeParam, FilterParam, QueryConfig } from "@/types/query";
import { GlobalFilter } from "@/types/builder";
import { DatasetSchema } from "@/types/dataset";

/** Convert a dateRange label (e.g. "1m", "3m", "ytd") to a DateRangeParam. */
export function dateRangeLabelToParam(label: string): DateRangeParam {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const to = fmt(today);

  let from: Date;
  if (label === "ytd") {
    from = new Date(today.getFullYear(), 0, 1);
  } else if (label === "1m") {
    from = new Date(today);
    from.setMonth(from.getMonth() - 1);
  } else if (label === "3m") {
    from = new Date(today);
    from.setMonth(from.getMonth() - 3);
  } else if (label === "6m") {
    from = new Date(today);
    from.setMonth(from.getMonth() - 6);
  } else {
    // "12m" or any unknown label → full year back (default)
    from = new Date(today);
    from.setFullYear(from.getFullYear() - 1);
  }

  return { from: fmt(from), to };
}

/**
 * Merge a GlobalFilter into a widget's queryParams, respecting widget-level overrides.
 *
 * Priority rules:
 * - queryParams.dateRange (widget-level) beats globalFilter.dateRange
 * - queryParams.filters and globalFilter-derived filters are merged by column;
 *   widget-level filter wins when the same column appears in both.
 */
export function mergeGlobalFilter(
  globalFilter: GlobalFilter | undefined,
  queryParams: Omit<QueryConfig, "datasetId"> | undefined,
  schema: DatasetSchema | undefined
): Omit<QueryConfig, "datasetId"> {
  const base: Omit<QueryConfig, "datasetId"> = { ...(queryParams ?? {}) };

  if (!globalFilter) return base;

  // ── dateRange ──────────────────────────────────────────────────
  if (!base.dateRange && globalFilter.dateRange) {
    base.dateRange = dateRangeLabelToParam(globalFilter.dateRange);
  }

  // ── department filter (future-proof: only when schema has the column) ──
  if (
    globalFilter.department &&
    globalFilter.department !== "all" &&
    schema
  ) {
    const hasDeptCol = schema.columns.some(
      (col) => col.key === "department" && col.filterable
    );
    if (hasDeptCol) {
      const widgetFilters: FilterParam[] = base.filters ?? [];
      const widgetHasDept = widgetFilters.some((f) => f.column === "department");
      if (!widgetHasDept) {
        base.filters = [
          ...widgetFilters,
          { column: "department", operator: "eq", value: globalFilter.department },
        ];
      }
    }
  }

  return base;
}
