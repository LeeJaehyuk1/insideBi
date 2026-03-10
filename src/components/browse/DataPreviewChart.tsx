"use client";

import * as React from "react";
import { BarChart3, LineChart, PieChart, AreaChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetRenderer } from "@/components/builder/WidgetRenderer";
import type { ChartType } from "@/types/builder";
import type { FilterParam } from "@/types/query";
import type { DatasetMeta } from "@/types/builder";

const CHART_OPTIONS: { type: ChartType; icon: React.ElementType; label: string }[] = [
  { type: "bar",  icon: BarChart3,   label: "막대" },
  { type: "line", icon: LineChart,   label: "선" },
  { type: "area", icon: AreaChart,   label: "면적" },
  { type: "pie",  icon: PieChart,    label: "파이" },
];

interface DataPreviewChartProps {
  meta: DatasetMeta;
  filters: FilterParam[];
}

export function DataPreviewChart({ meta, filters }: DataPreviewChartProps) {
  const [chartType, setChartType] = React.useState<ChartType>(meta.defaultChart as ChartType);

  const widgetConfig = {
    id: `browse-preview-${meta.id}`,
    datasetId: meta.id,
    chartType,
    title: meta.label,
    colSpan: 3 as const,
    queryParams: {
      filters: filters.filter((f) => f.value !== ""),
      limit: 50,
    },
  };

  return (
    <div className="mb-card overflow-hidden">
      <div className="mb-card-header">
        <span className="mb-card-title">차트 미리보기</span>
        {/* 차트 타입 선택 */}
        <div className="flex items-center gap-1">
          {CHART_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.type}
                onClick={() => setChartType(opt.type)}
                title={opt.label}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                  chartType === opt.type
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-4 h-[300px]">
        <WidgetRenderer widget={widgetConfig} />
      </div>
    </div>
  );
}
