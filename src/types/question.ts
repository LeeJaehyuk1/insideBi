import type { FilterParam } from "./query";
import type { ChartType } from "./builder";
import type { VizSettings } from "@/components/questions/ChartSettingsSidebar";

export interface SavedQuestion {
  id: string;
  title: string;
  datasetId: string;
  filters: FilterParam[];
  chartType: ChartType;
  vizSettings?: VizSettings;
  savedAt: string;
}
