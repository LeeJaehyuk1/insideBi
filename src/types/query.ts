export interface DateRangeParam {
  from: string;
  to: string;
}

export type FilterOperator =
  | "eq" | "neq"
  | "contains" | "not_contains"
  | "starts" | "ends"
  | "empty" | "not_empty"
  | "gte" | "lte";

export interface FilterParam {
  column: string;
  operator: FilterOperator;
  value: string | number;
}

export interface QueryConfig {
  datasetId: string;
  dateRange?: DateRangeParam;
  filters?: FilterParam[];
  groupBy?: string;
  limit?: number;
}

export interface QueryMeta {
  total: number;
  datasetId: string;
  executedAt: string;
  params: QueryConfig;
}

export interface QueryResult<T = Record<string, unknown>> {
  data: T[];
  meta: QueryMeta;
}
