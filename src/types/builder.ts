export type ChartType =
  | "line" | "area" | "bar" | "pie"
  | "scatter" | "radar" | "gauge" | "table" | "kpi";

export type ColSpan = 1 | 2 | 3;

export interface DatasetMeta {
  id: string;
  label: string;
  category: "credit" | "market" | "liquidity";
  categoryLabel: string;
  description: string;
  compatibleCharts: ChartType[];
  defaultChart: ChartType;
}

export interface WidgetConfig {
  id: string;
  datasetId: string;
  chartType: ChartType;
  title: string;
  colSpan: ColSpan;
}

export interface SavedDashboard {
  name: string;
  widgets: WidgetConfig[];
  savedAt: string;
}
