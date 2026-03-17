import type { FilterParam } from "./query";
import type { ChartType } from "./builder";
import type { VizSettings } from "@/components/questions/ChartSettingsSidebar";

export interface SavedQuestion {
  id: string;
  title: string;
  datasetId: string;
  sql?: string;           // SQL 에디터에서 작성된 쿼리 텍스트
  filters: FilterParam[];
  aggregations?: { func: string; column: string }[];
  breakouts?: string[];
  mode?: "raw" | "summarize";
  chartType: ChartType;
  vizSettings?: VizSettings;
  savedAt: string;
}
