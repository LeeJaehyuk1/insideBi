"use client";

import * as React from "react";
import {
  BarChart2, TrendingUp, PieChart, Table2, Activity,
  AreaChartIcon, Hash, Settings2, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChartType } from "@/types/builder";

/* ── 차트 정의 ── */
export const CHART_DEFS: {
  type: ChartType;
  label: string;
  icon: React.ElementType;
}[] = [
  { type: "bar",    label: "막대",  icon: BarChart2 },
  { type: "line",   label: "선",    icon: TrendingUp },
  { type: "area",   label: "영역",  icon: AreaChartIcon },
  { type: "pie",    label: "파이",  icon: PieChart },
  { type: "table",  label: "표",    icon: Table2 },
  { type: "kpi",    label: "KPI",   icon: Hash },
  { type: "scatter",label: "분산",  icon: Activity },
];

/* ── 데이터 shape 기반 추천 ── */
export function getSensibleCharts(
  data: Record<string, unknown>[],
  xKey: string,
): ChartType[] {
  if (!data.length) return ["table"];
  const keys = Object.keys(data[0]);
  const numCount = keys.filter((k) => typeof data[0][k] === "number").length;
  const strCount = keys.filter((k) => typeof data[0][k] === "string").length;
  const uniqueX = new Set(data.map((r) => r[xKey])).size;
  const hasDateLike = xKey.toLowerCase().includes("date") || xKey.toLowerCase().includes("time") ||
    (typeof data[0][xKey] === "string" && /^\d{4}[-/]/.test(String(data[0][xKey])));

  const sensible: ChartType[] = [];

  if (numCount >= 1 && strCount >= 1) {
    sensible.push("bar");
    if (hasDateLike) sensible.push("line", "area");
    if (uniqueX <= 15) sensible.push("pie");
  }
  if (data.length === 1 && numCount === 1) sensible.unshift("kpi");
  sensible.push("table");

  return Array.from(new Set(sensible));
}

/* ── 개별 차트 버튼 (Metabase ChartTypeOption 스타일) ── */
function ChartTypeOption({
  def, selected, onSelect, onOpenSettings,
}: {
  def: typeof CHART_DEFS[0];
  selected: boolean;
  onSelect: () => void;
  onOpenSettings?: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);
  const Icon = def.icon;

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        role="option"
        aria-selected={selected}
        onClick={selected ? onOpenSettings : onSelect}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 transition-all duration-150",
          "w-[3.5rem] h-[3.5rem]",
          selected
            ? "border-primary bg-primary text-white shadow-md shadow-primary/30"
            : "border-transparent bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
      </button>
      <span className={cn(
        "mt-1 text-[10px] font-medium text-center leading-none transition-colors",
        selected ? "text-primary" : "text-muted-foreground"
      )}>
        {def.label}
      </span>

      {/* 기어 아이콘 - 선택된 상태에서 호버 시 */}
      {selected && hovered && onOpenSettings && (
        <button
          onClick={(e) => { e.stopPropagation(); onOpenSettings(); }}
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary border-2 border-background shadow-sm hover:bg-primary/80 transition-colors"
        >
          <Settings2 className="h-2.5 w-2.5 text-white" />
        </button>
      )}
    </div>
  );
}

/* ── Props ── */
interface ChartTypeSelectorProps {
  selected: ChartType;
  data: Record<string, unknown>[];
  xKey: string;
  onChange: (type: ChartType) => void;
  onOpenSettings?: () => void;
}

export function ChartTypeSelector({
  selected, data, xKey, onChange, onOpenSettings,
}: ChartTypeSelectorProps) {
  const [showMore, setShowMore] = React.useState(false);
  const sensible = getSensibleCharts(data, xKey);
  const sensibleDefs = CHART_DEFS.filter((d) => sensible.includes(d.type))
    .sort((a, b) => sensible.indexOf(a.type) - sensible.indexOf(b.type));
  const otherDefs = CHART_DEFS.filter((d) => !sensible.includes(d.type));

  // 현재 선택이 others에 있으면 자동 펼치기
  React.useEffect(() => {
    if (otherDefs.some((d) => d.type === selected)) setShowMore(true);
  }, [selected]); // eslint-disable-line

  return (
    <div className="space-y-3">
      {/* 추천 */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">추천</p>
        <div className="grid grid-cols-4 gap-2">
          {sensibleDefs.map((d) => (
            <ChartTypeOption
              key={d.type} def={d}
              selected={selected === d.type}
              onSelect={() => onChange(d.type)}
              onOpenSettings={onOpenSettings}
            />
          ))}
        </div>
      </div>

      {/* 더보기 */}
      {otherDefs.length > 0 && (
        <div>
          <button
            onClick={() => setShowMore((p) => !p)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest hover:text-foreground transition-colors mb-2"
          >
            {showMore ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            더보기
          </button>
          {showMore && (
            <div className="grid grid-cols-4 gap-2">
              {otherDefs.map((d) => (
                <ChartTypeOption
                  key={d.type} def={d}
                  selected={selected === d.type}
                  onSelect={() => onChange(d.type)}
                  onOpenSettings={onOpenSettings}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
