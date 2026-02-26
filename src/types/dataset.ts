export type ColumnType = "number" | "string" | "date" | "percent" | "currency";
export type ColumnRole = "dimension" | "measure" | "identifier";

export interface ColumnMeta {
  key: string;
  label: string;
  type: ColumnType;
  role: ColumnRole;
  unit?: string;
  aggregatable: boolean;
  filterable: boolean;
}

export interface DatasetSchema {
  id: string;
  columns: ColumnMeta[];
  defaultDateColumn?: string;
  defaultMeasure?: string;
  defaultDimension?: string;
}
