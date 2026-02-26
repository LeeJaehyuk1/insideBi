import { QueryConfig } from "@/types/query";

export type ChartType =
  | "line" | "area" | "bar" | "pie"
  | "scatter" | "radar" | "gauge" | "table" | "kpi"
  | "waterfall" | "bullet";

export type ColSpan = 1 | 2 | 3;

export interface DatasetMeta {
  id: string;
  label: string;
  category: "credit" | "market" | "liquidity" | "custom";
  categoryLabel: string;
  description: string;
  compatibleCharts: ChartType[];
  defaultChart: ChartType;
}

/** Column → visual axis mapping (set via MappingPanel) */
export interface AxisMapping {
  x?: string;     // column key for X axis / nameKey
  y: string[];    // column keys for Y axes (at least one for GenericChart)
  groupBy?: string;
}

/** Reference line threshold (set via MappingPanel) */
export interface ThresholdConfig {
  id: string;
  value: number;
  label?: string;
  color: string;
}

export interface GlobalFilter {
  dateRange: string;   // e.g. "1m" | "3m" | "6m" | "12m" | "ytd"
  department: string;  // e.g. "all" | "retail" | "corporate" ...
}

export interface WidgetConfig {
  id: string;
  datasetId: string;
  chartType: ChartType;
  title: string;
  colSpan: ColSpan;
  queryParams?: Omit<QueryConfig, "datasetId">;  // Phase 3 FilterBar hook point
  globalFilter?: GlobalFilter;                   // Phase 3: propagated from FilterBar
  axisMapping?: AxisMapping;                     // Phase 2: custom axis mapping
  thresholds?: ThresholdConfig[];                // Phase 2: reference lines
}

export interface SavedDashboard {
  name: string;
  widgets: WidgetConfig[];
  savedAt: string;
}
