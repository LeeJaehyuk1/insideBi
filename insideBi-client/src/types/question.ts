import type { ChartType } from "./builder";

export type QueryParamType = "text" | "number" | "date";

export interface QueryParamDefinition {
  key: string;
  label?: string;
  type: QueryParamType;
  required?: boolean;
  defaultValue?: string;
}

export interface VisualizationConfig {
  type: Extract<ChartType, "table" | "line" | "bar" | "pie" | "kpi">;
  xField?: string;
  yField?: string;
  categoryField?: string;
  showLegend?: boolean;
}

export interface SavedQuestion {
  id: string;
  title: string;
  description?: string;
  sql: string;
  params: QueryParamDefinition[];
  visualization: VisualizationConfig;
  savedAt: string;
  updatedAt: string;
  datasetId?: string;
}
