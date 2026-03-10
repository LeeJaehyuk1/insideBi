import type { FilterParam } from "./query";
import type { ChartType } from "./builder";

export interface SavedQuestion {
  id: string;
  title: string;
  datasetId: string;
  filters: FilterParam[];
  chartType: ChartType;
  savedAt: string;
}
