"use client";

import * as React from "react";
import { Plus, X as XIcon } from "lucide-react";
import { WidgetConfig, ChartType, AxisMapping, ThresholdConfig } from "@/types/builder";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { recommendCharts } from "@/lib/chart-recommender";
import { getDataset, chartTypeLabels } from "@/lib/data-catalog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ── Colour palette for threshold lines ──────────────────────── */
const THRESHOLD_COLORS = [
  { label: "빨강", value: "#ef4444" },
  { label: "주황", value: "#f97316" },
  { label: "노랑", value: "#eab308" },
  { label: "초록", value: "#22c55e" },
  { label: "파랑", value: "#3b82f6" },
  { label: "보라", value: "#a855f7" },
];

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

/* ── Section heading ─────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-foreground mb-1.5">{children}</p>
  );
}

/* ── Main component ──────────────────────────────────────────── */
interface MappingPanelProps {
  widget: WidgetConfig;
  onUpdate: (updates: Partial<WidgetConfig>) => void;
  trigger: React.ReactNode;
}

export function MappingPanel({ widget, onUpdate, trigger }: MappingPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [chartType, setChartType] = React.useState<ChartType>(widget.chartType);
  const [mapping, setMapping] = React.useState<AxisMapping>(
    widget.axisMapping ?? { y: [] }
  );
  const [thresholds, setThresholds] = React.useState<ThresholdConfig[]>(
    widget.thresholds ?? []
  );

  // Re-sync local state whenever the panel opens
  React.useEffect(() => {
    if (open) {
      setChartType(widget.chartType);
      setMapping(widget.axisMapping ?? { y: [] });
      setThresholds(widget.thresholds ?? []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const schema = getDatasetSchema(widget.datasetId);

  /* Chart type tab ------------------------------------------------ */
  const recommended = schema ? recommendCharts(schema) : [];

  // 모든 차트 타입 (추천 / 기타 구분)
  const ALL_CHART_TYPES: ChartType[] = [
    "line", "area", "bar", "pie", "scatter", "radar",
    "gauge", "table", "kpi", "waterfall", "bullet",
  ];
  const otherTypes = ALL_CHART_TYPES.filter((ct) => !recommended.includes(ct));

  /* Axis tab ------------------------------------------------------ */
  const dateCols = schema?.columns.filter((c) => c.type === "date") ?? [];
  const dimensionCols = schema?.columns.filter((c) => c.role === "dimension") ?? [];
  // X options: date columns first, then string dimensions (dedup by key)
  const xOptions = [...dateCols, ...dimensionCols].filter(
    (c, i, arr) => arr.findIndex((x) => x.key === c.key) === i
  );
  const measureCols = schema?.columns.filter((c) => c.role === "measure") ?? [];
  const addableYCols = measureCols.filter((c) => !mapping.y.includes(c.key));

  /* Handlers ------------------------------------------------------ */
  const handleApply = () => {
    onUpdate({
      chartType,
      axisMapping: mapping.y.length > 0 ? mapping : undefined,
      thresholds: thresholds.length > 0 ? thresholds : undefined,
    });
    setOpen(false);
  };

  const handleReset = () => {
    onUpdate({ chartType: widget.chartType, axisMapping: undefined, thresholds: undefined });
    setOpen(false);
  };

  const removeYKey = (key: string) =>
    setMapping((prev) => ({ ...prev, y: prev.y.filter((k) => k !== key) }));

  const addYKey = (key: string) =>
    setMapping((prev) => ({ ...prev, y: [...prev.y, key] }));

  const updateThreshold = (id: string, patch: Partial<ThresholdConfig>) =>
    setThresholds((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const removeThreshold = (id: string) =>
    setThresholds((prev) => prev.filter((t) => t.id !== id));

  const addThreshold = () =>
    setThresholds((prev) => [
      ...prev,
      { id: genId(), value: 0, color: "#ef4444" },
    ]);

  /* ── JSX ─────────────────────────────────────────────────────── */
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>

      <SheetContent className="flex flex-col overflow-hidden w-80 sm:max-w-xs">
        <SheetHeader className="mb-4 pr-6">
          <SheetTitle className="text-sm leading-none">위젯 설정</SheetTitle>
          <p className="text-xs text-muted-foreground truncate">{widget.title}</p>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-1">
          <Tabs defaultValue="chart">
            <TabsList className="w-full grid grid-cols-3 sticky top-0 z-10">
              <TabsTrigger value="chart" className="text-xs">차트 타입</TabsTrigger>
              <TabsTrigger value="axis" className="text-xs">축 설정</TabsTrigger>
              <TabsTrigger value="threshold" className="text-xs">임계치</TabsTrigger>
            </TabsList>

            {/* ── 차트 타입 ────────────────────────────────────── */}
            <TabsContent value="chart" className="pt-3 space-y-3">
              {/* 추천 차트 타입 */}
              {recommended.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">추천</p>
                  <div className="flex flex-wrap gap-2">
                    {recommended.map((ct) => (
                      <button
                        key={ct}
                        onClick={() => setChartType(ct)}
                        className={cn(
                          "relative rounded-md border px-3 py-1.5 text-xs transition-colors",
                          chartType === ct
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-primary/40"
                        )}
                      >
                        {chartTypeLabels[ct] ?? ct}
                        {chartType !== ct && (
                          <span className="ml-1 text-[9px] opacity-50">추천</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 기타 전체 차트 타입 */}
              <div>
                {recommended.length > 0 && (
                  <p className="text-[10px] font-medium text-muted-foreground mb-1.5 uppercase tracking-wider">기타</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {otherTypes.map((ct) => (
                    <button
                      key={ct}
                      onClick={() => setChartType(ct)}
                      className={cn(
                        "relative rounded-md border px-3 py-1.5 text-xs transition-colors",
                        chartType === ct
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-input"
                      )}
                    >
                      {chartTypeLabels[ct] ?? ct}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* ── 축 설정 ─────────────────────────────────────── */}
            <TabsContent value="axis" className="space-y-4 pt-3">

              {/* X axis */}
              <div>
                <SectionLabel>X축 (Dimension)</SectionLabel>
                <Select
                  value={mapping.x ?? "__none__"}
                  onValueChange={(v) =>
                    setMapping((prev) => ({
                      ...prev,
                      x: v === "__none__" ? undefined : v,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="없음" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">없음</SelectItem>
                    {xOptions.map((c) => (
                      <SelectItem key={c.key} value={c.key}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Y axes */}
              <div>
                <SectionLabel>Y축 (Measure)</SectionLabel>
                <div className="space-y-1.5">
                  {mapping.y.map((key) => {
                    const col = measureCols.find((c) => c.key === key);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <span className="flex-1 truncate rounded-md border bg-muted/50 px-3 py-1.5 text-xs">
                          {col?.label ?? key}
                        </span>
                        <button
                          onClick={() => removeYKey(key)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {addableYCols.length > 0 && (
                    <Select onValueChange={addYKey}>
                      <SelectTrigger className="h-8 text-xs text-muted-foreground">
                        <SelectValue placeholder="+ 계열 추가" />
                      </SelectTrigger>
                      <SelectContent>
                        {addableYCols.map((c) => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Group By */}
              {dimensionCols.length > 0 && (
                <div>
                  <SectionLabel>범례 (Group By)</SectionLabel>
                  <Select
                    value={mapping.groupBy ?? "__none__"}
                    onValueChange={(v) =>
                      setMapping((prev) => ({
                        ...prev,
                        groupBy: v === "__none__" ? undefined : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="없음" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">없음</SelectItem>
                      {dimensionCols.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>

            {/* ── 임계치 ──────────────────────────────────────── */}
            <TabsContent value="threshold" className="space-y-3 pt-3">
              {thresholds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  임계치 라인이 없습니다.
                </p>
              )}

              {thresholds.map((t) => (
                <div key={t.id} className="flex items-center gap-2">
                  {/* Color dot indicator */}
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />

                  {/* Numeric value */}
                  <input
                    type="number"
                    step="0.01"
                    value={t.value}
                    onChange={(e) =>
                      updateThreshold(t.id, {
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-7 w-20 rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="값"
                  />

                  {/* Label */}
                  <input
                    type="text"
                    value={t.label ?? ""}
                    onChange={(e) =>
                      updateThreshold(t.id, { label: e.target.value })
                    }
                    className="h-7 flex-1 rounded-md border bg-transparent px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="레이블"
                  />

                  {/* Color picker */}
                  <Select
                    value={t.color}
                    onValueChange={(v) => updateThreshold(t.id, { color: v })}
                  >
                    <SelectTrigger className="h-7 w-14 px-2 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {THRESHOLD_COLORS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-3 w-3 shrink-0 rounded-full"
                              style={{ backgroundColor: c.value }}
                            />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Remove */}
                  <button
                    onClick={() => removeThreshold(t.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="h-8 w-full text-xs"
                onClick={addThreshold}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                임계치 추가
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={handleReset}
          >
            초기화
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button size="sm" className="text-xs" onClick={handleApply}>
              적용
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
