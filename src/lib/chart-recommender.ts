import { DatasetSchema } from "@/types/dataset";
import { ChartType } from "@/types/builder";

/**
 * Recommends suitable chart types based on a dataset's column schema.
 * Returned types are ordered by suitability (best first).
 */
export function recommendCharts(schema: DatasetSchema): ChartType[] {
  const hasDateCol = !!schema.defaultDateColumn;
  const dimensions = schema.columns.filter((c) => c.role === "dimension");
  const measures = schema.columns.filter((c) => c.role === "measure");
  const isScalar = !hasDateCol && dimensions.length === 0;

  // Scalar datasets (single-row KPI snapshots)
  if (isScalar) {
    return ["kpi", "table", "bullet"];
  }

  // Time-series datasets
  if (hasDateCol && measures.length >= 1) {
    return ["line", "area", "bar"];
  }

  // Categorical datasets with many measures → waterfall makes sense
  if (dimensions.length > 0 && measures.length >= 3) {
    return ["bar", "waterfall", "pie"];
  }

  // Categorical datasets
  if (dimensions.length > 0) {
    return ["bar", "pie"];
  }

  return ["bar"];
}
