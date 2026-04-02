
import * as React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  Play, Plus, X, BarChart3, BarChart2,
  Save, ChevronDown, Eye, LayoutGrid, Terminal,
  ArrowUpDown, Rows3, Info, Table2, ChevronLeft, Key, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { dataCatalog } from "@/lib/data-catalog";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { executeQuery } from "@/lib/query-engine";
import { getTableLabel } from "@/lib/table-columns";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import type { FolderEntry } from "@/lib/mock-data/collection-folders";
import { TablePickerModal } from "./TablePickerModal";
import { FilterPicker } from "./FilterPicker";
import { FilterPanel } from "./FilterPanel";
import { CHART_DEFS } from "./ChartTypeSelector";
import { DEFAULT_VIZ_SETTINGS } from "./ChartSettingsSidebar";
import type { VizSettings } from "./ChartSettingsSidebar";
import { SaveQuestionModal } from "./SaveQuestionModal";
import { SummarySidebar } from "../browse/SummarySidebar";
import { FilterSidebar } from "../browse/FilterSidebar";
import type { FilterParam, FilterOperator } from "@/types/query";
import type { ChartType } from "@/types/builder";
import type { ColumnMeta } from "@/types/dataset";
import {
  ResponsiveContainer, BarChart, Bar, LineChart as ReLineChart, Line,
  AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

/* ── 타입 ── */
type AggFunc = "count" | "sum" | "avg" | "min" | "max";
type ViewMode = "raw" | "summarize";
type SortDir = "asc" | "desc";
type AggItem = { func: AggFunc; column: string };
type EditMode = "builder" | "result";
type VizPanelMode = "none" | "picker" | "settings";
type ResultDisplayMode = "table" | "chart";

const AGG_FUNCS: { value: AggFunc; label: string; short: string }[] = [
  { value: "count", label: "개수 (COUNT)", short: "COUNT" },
  { value: "sum",   label: "합계 (SUM)",   short: "SUM" },
  { value: "avg",   label: "평균 (AVG)",   short: "AVG" },
  { value: "min",   label: "최솟값 (MIN)", short: "MIN" },
  { value: "max",   label: "최댓값 (MAX)", short: "MAX" },
];

const CHART_COLORS = ["#509EE3","#9CC177","#F9CF48","#F2A86F","#98D9D9","#7172AD","#EF8C8C","#A989C5"];
const PRESET_COLORS = ["#509EE3","#9CC177","#F9CF48","#F2A86F","#98D9D9","#7172AD","#EF8C8C","#A989C5"];

const OPERATOR_LABEL: Record<FilterOperator, string> = {
  eq: "=", neq: "≠", contains: "포함", not_contains: "미포함",
  starts: "시작", ends: "끝남", empty: "비어있음", not_empty: "비어있지않음",
  gte: "≥", lte: "≤", between: "범위",
};

/* ── DB 조회 ── */
async function fetchTableRows(
  tableId: string,
  filters: FilterParam[],
  sortColumn: string,
  sortDir: string,
  limit: number
): Promise<Record<string, unknown>[]> {
  const activeFilters = filters.filter((f) =>
    String(f.value).trim() !== "" || f.operator === "empty" || f.operator === "not_empty"
  );
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  for (const f of activeFilters) {
    const col = f.column;
    const fv = f.value;
    switch (f.operator) {
      case "eq":           conditions.push(`${col} = $${idx++}`); params.push(fv); break;
      case "neq":          conditions.push(`${col} != $${idx++}`); params.push(fv); break;
      case "contains":     conditions.push(`${col}::text ILIKE $${idx++}`); params.push(`%${fv}%`); break;
      case "not_contains": conditions.push(`${col}::text NOT ILIKE $${idx++}`); params.push(`%${fv}%`); break;
      case "starts":       conditions.push(`${col}::text ILIKE $${idx++}`); params.push(`${fv}%`); break;
      case "ends":         conditions.push(`${col}::text ILIKE $${idx++}`); params.push(`%${fv}`); break;
      case "empty":        conditions.push(`(${col} IS NULL OR ${col}::text = '')`); break;
      case "not_empty":    conditions.push(`(${col} IS NOT NULL AND ${col}::text != '')`); break;
      case "gte":          conditions.push(`${col} >= $${idx++}`); params.push(fv); break;
      case "lte":          conditions.push(`${col} <= $${idx++}`); params.push(fv); break;
      case "between":      conditions.push(`${col} BETWEEN $${idx++} AND $${idx++}`); params.push(fv); params.push(f.value2 ?? fv); break;
    }
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = sortColumn ? `ORDER BY ${sortColumn} ${sortDir.toUpperCase()}` : "";
  const lim = limit > 0 ? `LIMIT ${limit}` : "";
  const sql = [`SELECT *`, `FROM ${tableId}`, where, order, lim].filter(Boolean).join(" ");
  const res = await apiFetch("/api/db-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "DB 조회 오류");
  return json.rows as Record<string, unknown>[];
}

/* ── 집계 ── */
function computeAgg(arr: Record<string, unknown>[], func: AggFunc, column: string): number {
  if (func === "count") return arr.length;
  const nums = arr.map((r) => Number(r[column])).filter((v) => !isNaN(v));
  if (!nums.length) return 0;
  if (func === "sum") return nums.reduce((a, b) => a + b, 0);
  if (func === "avg") return +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4);
  if (func === "min") return Math.min(...nums);
  if (func === "max") return Math.max(...nums);
  return 0;
}

function applyAggregations(rows: Record<string, unknown>[], aggs: AggItem[], breakouts: string[]) {
  const aggKey = (a: AggItem) => a.func === "count" ? "count" : `${a.func}_${a.column}`;
  if (!breakouts.length) {
    const result: Record<string, unknown> = {};
    for (const a of aggs) result[aggKey(a)] = computeAgg(rows, a.func, a.column);
    return [result];
  }
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = breakouts.map((b) => String(row[b] ?? "")).join("||");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return Array.from(groups.entries()).map(([, arr]) => {
    const result: Record<string, unknown> = {};
    for (const b of breakouts) result[b] = arr[0][b];
    for (const a of aggs) result[aggKey(a)] = computeAgg(arr, a.func, a.column);
    return result;
  });
}

/* ── 결과 차트 ── */
function ResultChart({ data, chartType, xKey, yKey, settings }: {
  data: Record<string, unknown>[];
  chartType: ChartType;
  xKey: string; yKey: string;
  settings: VizSettings;
}) {
  const h = 320;
  const tick = { fontSize: 11, fill: "var(--muted-foreground)" };
  const color = settings.color || "#509EE3";
  const rx = settings.xKey || xKey;
  const ry = settings.yKey || yKey;

  if (chartType === "kpi") {
    const val = data[0]?.[ry] ?? data[0]?.[Object.keys(data[0] ?? {})[0]];
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2">
        <p className="text-4xl font-bold" style={{ color }}>
          {typeof val === "number" ? val.toLocaleString() : String(val ?? "—")}
        </p>
        <p className="text-sm text-muted-foreground">{ry}</p>
      </div>
    );
  }
  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <RePieChart>
          <Pie data={data} dataKey={ry} nameKey={rx} cx="50%" cy="50%" outerRadius={120}
            label={settings.showLabels ? undefined : false}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? color : CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip />
          {settings.showLegend && <Legend />}
        </RePieChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ReLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={rx} tick={tick} label={settings.xLabel ? { value: settings.xLabel, position: "insideBottom", offset: -4, fontSize: 11 } : undefined} />
          <YAxis tick={tick} label={settings.yLabel ? { value: settings.yLabel, angle: -90, position: "insideLeft", fontSize: 11 } : undefined} />
          <Tooltip />
          {settings.showLegend && <Legend />}
          <Line dataKey={ry} stroke={color} strokeWidth={2} dot={settings.showLabels} />
        </ReLineChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={rx} tick={tick} label={settings.xLabel ? { value: settings.xLabel, position: "insideBottom", offset: -4, fontSize: 11 } : undefined} />
          <YAxis tick={tick} label={settings.yLabel ? { value: settings.yLabel, angle: -90, position: "insideLeft", fontSize: 11 } : undefined} />
          <Tooltip />
          {settings.showLegend && <Legend />}
          <Area dataKey={ry} stroke={color} fill={`${color}20`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  // bar (default)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={rx} tick={tick} label={settings.xLabel ? { value: settings.xLabel, position: "insideBottom", offset: -4, fontSize: 11 } : undefined} />
        <YAxis tick={tick} label={settings.yLabel ? { value: settings.yLabel, angle: -90, position: "insideLeft", fontSize: 11 } : undefined} />
        <Tooltip />
        {settings.showLegend && <Legend />}
        <Bar dataKey={ry} fill={color} radius={[4, 4, 0, 0]}
          label={settings.showLabels ? { position: "top", fontSize: 10 } : false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 결과 테이블 ── */
function ResultTable({ data, columns }: { data: Record<string, unknown>[], columns: ColumnMeta[] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">결과가 없습니다</div>
  );
  const colKeys = Object.keys(data[0]);
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
            {colKeys.map((k) => {
              const meta = columns.find((c) => c.key === k);
              const isPk = meta?.role === "identifier";
              return (
                <th key={k} className={cn(
                  "px-3 py-2.5 text-left font-bold whitespace-nowrap border-r border-border/50",
                  isPk ? "text-primary bg-primary/5" : "text-muted-foreground"
                )}>
                  <div className="flex items-center gap-1.5">
                    {isPk && <Key className="h-3 w-3 text-primary" />}
                    {meta?.label || k}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 2000).map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
              {colKeys.map((k) => {
                const meta = columns.find((c) => c.key === k);
                const isPk = meta?.role === "identifier";
                return (
                  <td key={k} className={cn(
                    "px-3 py-2 whitespace-nowrap border-r border-border/30",
                    isPk ? "font-bold text-primary bg-primary/[0.02] group-hover:bg-primary/[0.05]" : "text-foreground"
                  )}>
                    {row[k] === null || row[k] === undefined
                      ? <span className="text-muted-foreground/40 italic">—</span>
                      : String(row[k])}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 2000 && (
        <p className="text-center text-xs text-muted-foreground py-2">전체 {data.length}행 중 2,000행 표시</p>
      )}
    </div>
  );
}

/* ── 차트 타입 피커 패널 ── */
export function VizPickerPanel({
  selected, onSelect, onDone,
}: {
  selected: ChartType;
  onSelect: (t: ChartType) => void;
  onDone: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-3 border-b">
        <span className="text-sm font-bold text-foreground">차트 선택</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-2">
          {CHART_DEFS.map((d) => {
            const Icon = d.icon;
            const isSelected = selected === d.type;
            return (
              <div key={d.type} className="flex flex-col items-center gap-1">
                <button
                  onClick={() => onSelect(d.type)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-xl border-2 w-14 h-14 transition-all duration-150",
                    isSelected
                      ? "border-primary bg-primary text-white shadow-md shadow-primary/30"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </button>
                <span className={cn(
                  "text-[10px] font-medium text-center leading-none",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-4 border-t">
        <button
          onClick={onDone}
          className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  );
}

/* ── 차트 설정 패널 ── */
type SettingsTab = "display" | "axis" | "data";

export function VizSettingsPanel({
  chartType, settings, onSettingsChange, columns, data, xKey, yKey, onBack, onDone,
}: {
  chartType: ChartType;
  settings: VizSettings;
  onSettingsChange: (s: Partial<VizSettings>) => void;
  columns: ColumnMeta[];
  data: Record<string, unknown>[];
  xKey: string; yKey: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [tab, setTab] = React.useState<SettingsTab>("data");
  const chartLabel = CHART_DEFS.find((d) => d.type === chartType)?.label ?? chartType;
  const isTable = chartType === "table";
  const isKpi = chartType === "kpi";
  const isPie = chartType === "pie";
  const isNoAxis = isTable || isKpi;

  const resultKeys = data.length ? Object.keys(data[0]) : [];
  const colOptions = resultKeys.map((k) => ({
    value: k,
    label: columns.find((c) => c.key === k)?.label ?? k,
  }));

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold text-foreground">{chartLabel} 옵션</span>
      </div>

      {/* 탭 */}
      <div className="flex border-b px-2 shrink-0">
        {(["display", "axis", "data"] as SettingsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t === "display" ? "표시" : t === "axis" ? "축" : "데이터"}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* 데이터 탭 */}
        {tab === "data" && !isNoAxis && colOptions.length > 0 && (
          <div className="space-y-3">
            {!isPie && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">X축 (가로)</label>
                <select
                  value={settings.xKey || xKey}
                  onChange={(e) => onSettingsChange({ xKey: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {colOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">{isPie ? "값" : "Y축 (세로)"}</label>
              <select
                value={settings.yKey || yKey}
                onChange={(e) => onSettingsChange({ yKey: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {colOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        )}
        {tab === "data" && isNoAxis && (
          <p className="text-xs text-muted-foreground text-center py-4">이 차트 타입에는 축 설정이 없습니다</p>
        )}

        {/* 축 탭 */}
        {tab === "axis" && !isNoAxis && !isPie && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">X축 레이블</label>
              <input
                value={settings.xLabel}
                onChange={(e) => onSettingsChange({ xLabel: e.target.value })}
                placeholder="자동"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground/80">Y축 레이블</label>
              <input
                value={settings.yLabel}
                onChange={(e) => onSettingsChange({ yLabel: e.target.value })}
                placeholder="자동"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        )}
        {tab === "axis" && (isNoAxis || isPie) && (
          <p className="text-xs text-muted-foreground text-center py-4">이 차트 타입에는 축 설정이 없습니다</p>
        )}

        {/* 표시 탭 */}
        {tab === "display" && (
          <div className="space-y-4">
            {!isTable && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground/80">색상</p>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => onSettingsChange({ color: c })}
                      className={cn(
                        "h-8 w-full rounded-lg border-2 transition-all hover:scale-105",
                        settings.color === c ? "border-foreground shadow-md" : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => onSettingsChange({ color: e.target.value })}
                    className="h-8 w-8 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                  />
                  <span className="text-xs text-muted-foreground">커스텀</span>
                  <span className="ml-auto text-xs font-mono text-muted-foreground">{settings.color}</span>
                </div>
              </div>
            )}
            {!isNoAxis && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-foreground/80">표시 옵션</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">데이터 레이블</span>
                  <button
                    onClick={() => onSettingsChange({ showLabels: !settings.showLabels })}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                      settings.showLabels ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                      settings.showLabels ? "translate-x-4" : "translate-x-1"
                    )} />
                  </button>
                </div>
                {!isPie && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">범례</span>
                    <button
                      onClick={() => onSettingsChange({ showLegend: !settings.showLegend })}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                        settings.showLegend ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                        settings.showLegend ? "translate-x-4" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t shrink-0">
        <button
          onClick={onDone}
          className="w-full rounded-full bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          완료
        </button>
      </div>
    </div>
  );
}

/* ── 집계 팝오버 ── */
function AggPickerPopover({ agg, measureCols, allCols, onChange, onClose }: {
  agg: AggItem;
  measureCols: ColumnMeta[];
  allCols: ColumnMeta[];
  onChange: (a: AggItem) => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [func, setFunc] = React.useState<AggFunc>(agg.func);
  const [column, setColumn] = React.useState(agg.column);
  const colsForAgg = func === "count" ? [] : (measureCols.length ? measureCols : allCols.filter((c) => c.type === "number"));

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="p-3 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground">집계 함수</p>
        <div className="grid grid-cols-2 gap-1.5">
          {AGG_FUNCS.map((f) => (
            <button key={f.value} onClick={() => { setFunc(f.value); if (f.value === "count") setColumn(""); }}
              className={cn("rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors",
                func === f.value ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "border-border text-foreground hover:bg-muted"
              )}>
              {f.short}
            </button>
          ))}
        </div>
        {func !== "count" && (
          <>
            <p className="text-xs font-semibold text-muted-foreground">대상 컬럼</p>
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {colsForAgg.map((c) => (
                <button key={c.key} onClick={() => setColumn(c.key)}
                  className={cn("w-full text-left rounded-lg px-3 py-2 text-xs transition-colors",
                    column === c.key ? "bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-950 dark:text-emerald-300" : "text-foreground hover:bg-muted"
                  )}>
                  {c.label}
                </button>
              ))}
              {!colsForAgg.length && <p className="text-xs text-muted-foreground text-center py-2">숫자 컬럼이 없습니다</p>}
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg border px-3 py-1.5 text-xs hover:bg-muted transition-colors">취소</button>
          <button onClick={() => { if (func !== "count" && !column) return; onChange({ func, column: func === "count" ? "" : column }); }}
            disabled={func !== "count" && !column}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors">
            적용
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 그룹화 팝오버 ── */
function BreakoutPickerPopover({ columns, selected, onAdd, onClose }: {
  columns: ColumnMeta[];
  selected: string[];
  onAdd: (key: string) => void;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const filtered = search.trim()
    ? columns.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
    : columns;

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 z-50 w-56 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="p-2 border-b border-border">
        <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="컬럼 검색..." className="w-full rounded-lg border border-input bg-muted/30 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>
      <div className="max-h-48 overflow-y-auto py-1">
        {filtered.map((c) => (
          <button key={c.key} onClick={() => onAdd(c.key)} disabled={selected.includes(c.key)}
            className={cn("flex items-center justify-between w-full px-3 py-2 text-xs text-left transition-colors",
              selected.includes(c.key) ? "opacity-40 cursor-not-allowed" : "text-foreground hover:bg-muted"
            )}>
            <span>{c.label}</span>
            {selected.includes(c.key) && <span className="text-primary text-[10px]">선택됨</span>}
          </button>
        ))}
        {!filtered.length && <p className="text-xs text-muted-foreground text-center py-4">컬럼 없음</p>}
      </div>
    </div>
  );
}

/* ── 필터 태그 ── */
function FilterTag({ label, operator, value, onRemove }: {
  label: string; operator: FilterOperator; value: string | number; onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
      {label} {OPERATOR_LABEL[operator]} {operator === "empty" || operator === "not_empty" ? "" : String(value)}
      <button onClick={onRemove} className="hover:text-destructive transition-colors ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/* ── 메인 컴포넌트 ── */
interface NoCodeBuilderProps {
  initialDatasetId?: string;
  initialTableId?: string;
  initialDbId?: string;
  collectionId?: string;
}

export function NoCodeBuilder({
  initialDatasetId,
  initialTableId,
  initialDbId = "railway",
  collectionId,
}: NoCodeBuilderProps) {
  const navigate = useNavigate();
  const { saveQuestion } = useSavedQuestions();
  const { addEntry } = useCollectionFolders();
  const [savedDest, setSavedDest] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!savedDest) return;
    const t = setTimeout(() => setSavedDest(null), 5000);
    return () => clearTimeout(t);
  }, [savedDest]);

  const isDbTableId = (id: string) => !!id && !dataCatalog.find((d) => d.id === id);

  const resolvedTableId = initialTableId ?? (isDbTableId(initialDatasetId ?? "") ? (initialDatasetId ?? "") : "");
  const resolvedDatasetId = !resolvedTableId ? (initialDatasetId ?? "") : "";

  /* 테이블 / 데이터셋 상태 */
  const [tableId, setTableId] = React.useState(resolvedTableId);
  const [dbId, setDbId] = React.useState(initialDbId);
  const [datasetId, setDatasetId] = React.useState(resolvedDatasetId);
  const [showTablePicker, setShowTablePicker] = React.useState(!resolvedTableId && !resolvedDatasetId);

  const tableLabel = tableId ? getTableLabel(tableId, dbId) : (dataCatalog.find((d) => d.id === datasetId)?.label ?? "");
  const [columns, setColumns] = React.useState<ColumnMeta[]>([]);

  React.useEffect(() => {
    if (tableId) {
      apiFetch(`/api/db-columns?table=${encodeURIComponent(tableId)}`)
        .then((r) => r.json())
        .then((json) => { if (json.columns) setColumns(json.columns); })
        .catch(() => setColumns([]));
    } else if (datasetId) {
      const schema = getDatasetSchema(datasetId);
      setColumns(schema?.columns ?? []);
    } else {
      setColumns([]);
    }
  }, [tableId, datasetId]);

  /* 쿼리 상태 */
  const [mode, setMode] = React.useState<ViewMode>("raw");
  const [filters, setFilters] = React.useState<FilterParam[]>([]);
  const [filterPickerOpen, setFilterPickerOpen] = React.useState(false);
  const [aggregations, setAggregations] = React.useState<AggItem[]>([{ func: "count", column: "" }]);
  const [breakouts, setBreakouts] = React.useState<string[]>([]);
  const [aggPickerOpen, setAggPickerOpen] = React.useState<number | null>(null);
  const [breakoutPickerOpen, setBreakoutPickerOpen] = React.useState(false);
  const [sortColumn, setSortColumn] = React.useState("");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [showSort, setShowSort] = React.useState(false);
  const [limit, setLimit] = React.useState(0);
  const [showLimit, setShowLimit] = React.useState(false);

  /* 결과 상태 */
  const [result, setResult] = React.useState<Record<string, unknown>[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [hasResult, setHasResult] = React.useState(false);
  const [chartType, setChartType] = React.useState<ChartType>("bar");
  const [saveModalOpen, setSaveModalOpen] = React.useState(false);
  const [summarySidebarOpen, setSummarySidebarOpen] = React.useState(false);
  const [filterSidebarOpen, setFilterSidebarOpen] = React.useState(false);
  const [filterPanelExpanded, setFilterPanelExpanded] = React.useState(true);
  const [generatedSql, setGeneratedSql] = React.useState<string | null>(null);
  const [vizSettings, setVizSettings] = React.useState<VizSettings>(DEFAULT_VIZ_SETTINGS);

  /* 뷰 상태 */
  const [editMode, setEditMode] = React.useState<EditMode>(initialTableId || initialDatasetId ? "result" : "builder");
  const [vizPanelMode, setVizPanelMode] = React.useState<VizPanelMode>("none");
  const [resultDisplayMode, setResultDisplayMode] = React.useState<ResultDisplayMode>("table");

  const dataset = dataCatalog.find((d) => d.id === datasetId);
  const measureCols = columns.filter((c) => c.role === "measure");
  const dimensionCols = columns.filter((c) => c.role === "dimension");

  /* 테이블 선택 */
  const handleSelectTable = (tid: string, did: string) => {
    setTableId(tid);
    setDbId(did);
    setDatasetId("");
    setFilters([]);
    setHasResult(false);
    setResult([]);
    setAggregations([{ func: "count", column: "" }]);
    setBreakouts([]);
    setMode("raw");
    setEditMode("builder");
    setVizPanelMode("none");
    setShowTablePicker(false);
    navigate(`/questions/nocode?dataset=${tid}${collectionId ? `&collection=${collectionId}` : ""}`, { replace: true });
  };

  /* SQL 생성 */
  const buildSql = () => {
    const tbl = tableId || datasetId;
    if (!tbl) return "";
    const activeFilters = filters.filter((f) =>
      String(f.value).trim() !== "" || f.operator === "empty" || f.operator === "not_empty"
    );
    const whereClause = activeFilters.length
      ? "WHERE " + activeFilters.map((f) => {
          const col = f.column;
          const fv = f.value;
          const isNum = typeof fv === "number" || (typeof fv === "string" && fv !== "" && !isNaN(Number(fv)));
          const quoted = isNum ? String(fv) : `'${String(fv)}'`;
          switch (f.operator) {
            case "eq":           return `${col} = ${quoted}`;
            case "neq":          return `${col} != ${quoted}`;
            case "contains":     return `${col} LIKE '%${String(fv)}%'`;
            case "not_contains":  return `${col} NOT LIKE '%${String(fv)}%'`;
            case "starts":       return `${col} LIKE '${String(fv)}%'`;
            case "ends":         return `${col} LIKE '%${String(fv)}'`;
            case "empty":        return `(${col} IS NULL OR ${col} = '')`;
            case "not_empty":    return `(${col} IS NOT NULL AND ${col} != '')`;
            case "gte":          return `${col} >= ${quoted}`;
            case "lte":          return `${col} <= ${quoted}`;
            case "between": {
              const isNum2 = !isNaN(Number(f.value2));
              const q2 = isNum2 ? String(f.value2) : `'${String(f.value2)}'`;
              return `${col} BETWEEN ${quoted} AND ${q2}`;
            }
            default: return `${col} = ${quoted}`;
          }
        }).join("\n  AND ")
      : "";
    let selectClause = "SELECT *";
    let groupByClause = "";
    if (mode === "summarize" && aggregations.length) {
      const aggParts = aggregations.map((a) => {
        const expr = a.func === "count" ? "COUNT(*)" : `${a.func.toUpperCase()}(${a.column})`;
        const alias = a.func === "count" ? "count" : `${a.func}_${a.column}`;
        return `${expr} AS ${alias}`;
      });
      if (breakouts.length) {
        selectClause = `SELECT ${breakouts.join(", ")}, ${aggParts.join(", ")}`;
        groupByClause = `GROUP BY ${breakouts.join(", ")}`;
      } else {
        selectClause = `SELECT ${aggParts.join(", ")}`;
      }
    }
    const orderByClause = sortColumn ? `ORDER BY ${sortColumn} ${sortDir.toUpperCase()}` : "";
    const limitClause = limit > 0 ? `LIMIT ${limit}` : "";
    return [selectClause, `FROM ${tbl}`, whereClause, groupByClause, orderByClause, limitClause].filter(Boolean).join("\n");
  };

  /* 자동 실행 (필터/요약/정렬 등 변경 시) */
  React.useEffect(() => {
    if ((tableId || datasetId) && columns.length > 0) {
      handleRun();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, aggregations, breakouts, sortColumn, sortDir, limit, mode, columns.length]);

  /* 실행 */
  const handleRun = async () => {
    const id = tableId || datasetId;
    if (!id) return;
    setIsRunning(true);
    setGeneratedSql(buildSql());
    try {
      let rows: Record<string, unknown>[];
      if (tableId) {
        rows = await fetchTableRows(tableId, filters, sortColumn, sortDir, limit);
      } else {
        const activeFilters = filters.filter((f) => String(f.value).trim() !== "" || f.operator === "empty" || f.operator === "not_empty");
        const res = await executeQuery({ datasetId, filters: activeFilters, limit: limit || undefined });
        rows = res.data as Record<string, unknown>[];
        if (sortColumn) {
          rows = [...rows].sort((a, b) => {
            const cmp = String(a[sortColumn] ?? "") < String(b[sortColumn] ?? "") ? -1 : 1;
            return sortDir === "asc" ? cmp : -cmp;
          });
        }
        if (limit > 0) rows = rows.slice(0, limit);
      }
      if (mode === "summarize" && aggregations.length) {
        rows = applyAggregations(rows, aggregations, breakouts);
      }
      setResult(rows);
      // 첫 실행 시에만 displayMode 초기화 (재실행 시 사용자 선택 유지)
      if (!hasResult) {
        setResultDisplayMode(mode === "summarize" ? "chart" : "table");
        setVizPanelMode("none");
        if (mode === "summarize") {
          const def = (dataset?.defaultChart as ChartType) ?? "bar";
          setChartType(["kpi","gauge","scatter"].includes(def) ? "bar" : def);
        } else {
          setChartType("table");
        }
      }
      setHasResult(true);
      setEditMode("result");
    } finally {
      setIsRunning(false);
    }
  };

  /* 차트 타입 변경 */
  const handleChartTypeChange = (type: ChartType) => {
    setChartType(type);
    if (type === "kpi") setVizSettings((s) => ({ ...s, showLabels: false, showLegend: false }));
    if (type === "pie") setVizSettings((s) => ({ ...s, showLegend: true }));
  };

  /* 저장 */
  const handleSave = () => {
    const id = tableId || datasetId;
    if (!id) return;
    setSaveModalOpen(true);
  };

  const handleConfirmSave = (title: string, _desc: string, targetColId: string) => {
    const id = tableId || datasetId;
    if (!id) return;
    // 저장 시점에 표를 보고 있으면 "table"로 저장 (chartType이 bar 등으로 남아있어도 무관)
    const savedChartType = resultDisplayMode === "table" ? "table" : chartType;
    const saved = saveQuestion({
      title,
      datasetId: id,
      filters,
      aggregations,
      breakouts,
      mode,
      chartType: savedChartType,
      vizSettings
    });
    const finalColId = targetColId || collectionId || "our-analytics";
    const entry: FolderEntry = {
      id: `q-${saved.id}`, type: "question", name: title,
      lastEditor: "나",
      lastModified: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
      href: `/questions/${saved.id}`,
    };
    addEntry(finalColId, entry);
    setSaveModalOpen(false);
    const dest = finalColId === "our-analytics" ? "/collections" : `/collections/${finalColId}`;
    setSavedDest(dest);
  };

  const resultKeys = result.length ? Object.keys(result[0]) : [];
  const xKey = resultKeys.find((k) => {
    const col = columns.find((c) => c.key === k);
    return col?.role === "dimension" || col?.type === "date" || col?.type === "string";
  }) ?? resultKeys[0] ?? "";
  const yKey = resultKeys.find((k) => k !== xKey) ?? resultKeys[1] ?? resultKeys[0] ?? "";
  const hasTable = !!(tableId || datasetId);

  /* ── 테이블 피커 (초기) ── */
  if (showTablePicker && !hasTable) {
    return <TablePickerModal onSelect={handleSelectTable} onClose={() => setShowTablePicker(false)} />;
  }

  /* ── 결과 뷰 (Metabase 스타일 풀스크린) ── */
  if (editMode === "result") {
    return (
      <>
        {showTablePicker && (
          <TablePickerModal onSelect={handleSelectTable} onClose={() => setShowTablePicker(false)} />
        )}
        <SaveQuestionModal
          open={saveModalOpen}
          onClose={() => setSaveModalOpen(false)}
          onSave={handleConfirmSave}
          tableLabel={tableLabel || dataset?.label || "질문"}
          filters={filters}
          columnLabels={Object.fromEntries(columns.map((c) => [c.key, c.label]))}
          defaultCollectionId={collectionId}
        />

        {/* 결과 뷰 컨테이너 */}
        <div
          className="flex flex-col -mt-6 -mx-6 bg-background overflow-hidden"
          style={{ height: "calc(100vh - 56px)" }}
        >
          {/* ── 상단 툴바 ── */}
          <div className="flex items-center justify-between h-12 px-4 border-b bg-background shrink-0">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="font-medium">{dbId}</span>
              <span className="mx-0.5">/</span>
              <button
                onClick={() => setShowTablePicker(true)}
                className="font-semibold text-foreground hover:underline"
              >
                {tableLabel || "테이블"}
              </button>
            </div>

            <div className="flex items-center gap-1">
              {/* 필터 */}
              <button
                onClick={() => {
                  if (filters.length > 0) {
                    setFilterPanelExpanded((p) => !p);
                  } else {
                    setFilterSidebarOpen((p) => !p);
                  }
                  setSummarySidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors",
                  filterSidebarOpen || filters.length > 0
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                필터
                {filters.length > 0 && (
                  <span className="flex items-center justify-center h-4 w-4 rounded-full bg-white text-primary text-[9px] font-bold ml-0.5">
                    {filters.length}
                  </span>
                )}
              </button>

              {/* 요약 */}
              <button
                onClick={() => {
                  setSummarySidebarOpen((p) => !p);
                  setFilterSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors",
                  summarySidebarOpen || mode === "summarize"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="font-bold text-sm leading-none">Σ</span>
                요약
              </button>

              {/* 편집기 */}
              <button
                onClick={() => setEditMode("builder")}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Terminal className="h-3.5 w-3.5" />
                편집기
              </button>

              <div className="w-px h-4 bg-border mx-1" />

              {/* 저장 */}
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                저장
              </button>
            </div>
          </div>

          {/* ── 필터 패널 (결과 뷰 상단) ── */}
          {filters.length > 0 && filterPanelExpanded && (
            <FilterPanel
              filters={filters}
              columns={columns}
              tableLabel={tableLabel || "테이블"}
              onUpdate={(idx, updated) => setFilters((p) => p.map((f, i) => (i === idx ? updated : f)))}
              onRemove={(idx) => setFilters((p) => p.filter((_, i) => i !== idx))}
              onAdd={(f) => { setFilters((p) => [...p, f]); setFilterPanelExpanded(true); }}
            />
          )}

          {/* ── 메인 영역: 좌측 패널 + 데이터 ── */}
          <div className="flex flex-1 min-h-0">
            {/* 좌측 시각화 패널 */}
            {vizPanelMode !== "none" && (
              <div className="w-[260px] shrink-0 border-r bg-background flex flex-col overflow-hidden">
                {vizPanelMode === "picker" && (
                  <VizPickerPanel
                    selected={chartType}
                    onSelect={(type) => {
                      handleChartTypeChange(type);
                      if (type === "table") {
                        setResultDisplayMode("table");
                        setVizPanelMode("none");
                      } else {
                        setResultDisplayMode("chart");
                        setVizPanelMode("settings");
                      }
                    }}
                    onDone={() => setVizPanelMode("none")}
                  />
                )}
                {vizPanelMode === "settings" && (
                  <VizSettingsPanel
                    chartType={chartType}
                    settings={vizSettings}
                    onSettingsChange={(s) => setVizSettings((p) => ({ ...p, ...s }))}
                    columns={columns}
                    data={result}
                    xKey={xKey}
                    yKey={yKey}
                    onBack={() => setVizPanelMode("picker")}
                    onDone={() => setVizPanelMode("none")}
                  />
                )}
              </div>
            )}

            {/* 데이터 영역 */}
            <div className="flex-1 min-w-0 overflow-auto relative">
              {(isRunning || !hasResult) ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 bg-background">
                  <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm font-medium text-muted-foreground animate-pulse">데이터를 불러오는 중입니다...</p>
                </div>
              ) : resultDisplayMode === "table" || chartType === "table" ? (
                <ResultTable data={result} columns={columns} />
              ) : (
                <div className="p-6">
                  <ResultChart
                    data={result}
                    chartType={chartType}
                    xKey={xKey}
                    yKey={yKey}
                    settings={vizSettings}
                  />
                </div>
              )}
            </div>

            {/* 요약 사이드바 */}
            {summarySidebarOpen && (
              <div className="z-20 border-l bg-background shadow-xl">
                <SummarySidebar
                  tableLabel={tableLabel || "데이터"}
                  columns={columns.map((c) => c.key)}
                  columnLabels={Object.fromEntries(columns.map((c) => [c.key, c.label]))}
                  numericColumns={columns.filter((c) => c.type === "number" || c.role === "measure").map((c) => c.key)}
                  aggregations={aggregations}
                  breakouts={breakouts}
                  onAggChange={(newAggs) => {
                    setAggregations(newAggs);
                    if (newAggs.length > 0 || breakouts.length > 0) setMode("summarize");
                    else setMode("raw");
                  }}
                  onBreakoutChange={(newBreakouts) => {
                    setBreakouts(newBreakouts);
                    if (newBreakouts.length > 0 || aggregations.length > 0) setMode("summarize");
                    else setMode("raw");
                  }}
                  onClose={() => setSummarySidebarOpen(false)}
                />
              </div>
            )}

            {/* 필터 사이드바 */}
            {filterSidebarOpen && (
              <div className="z-20 border-l bg-background shadow-xl">
                <FilterSidebar
                  tableLabel={tableLabel || "데이터"}
                  columns={columns}
                  onAdd={(f) => setFilters((p) => [...p, f])}
                  onClose={() => setFilterSidebarOpen(false)}
                />
              </div>
            )}
          </div>

          {/* ── 하단 바 ── */}
          <div className="flex items-center h-11 px-4 border-t bg-background shrink-0">
            {/* 시각화 버튼 */}
            <button
              onClick={() => setVizPanelMode((p) => p === "none" ? "picker" : "none")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                vizPanelMode !== "none"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              시각화
            </button>

            <div className="ml-auto flex items-center gap-3">
              {/* 표/차트 토글 */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => { setResultDisplayMode("table"); setChartType("table"); }}
                  title="표"
                  className={cn(
                    "flex items-center justify-center px-2.5 py-1.5 transition-colors",
                    resultDisplayMode === "table"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Table2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    setResultDisplayMode("chart");
                    if (chartType === "table") setChartType("bar");
                  }}
                  title="차트"
                  className={cn(
                    "flex items-center justify-center px-2.5 py-1.5 transition-colors",
                    resultDisplayMode === "chart"
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* 행 수 */}
              <span className="text-xs text-muted-foreground">
                {result.length.toLocaleString()}행
              </span>
            </div>
          </div>
        </div>
        {savedDest && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>저장됐습니다</span>
            <Link to={savedDest} className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2 ml-1">컬렉션에서 보기</Link>
            <button onClick={() => setSavedDest(null)} className="ml-2 text-white/40 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </>
    );
  }

  /* ── 빌더 뷰 ── */
  return (
    <>
      {showTablePicker && hasTable && (
        <TablePickerModal onSelect={handleSelectTable} onClose={() => setShowTablePicker(false)} />
      )}

      <div className="flex flex-col min-h-screen -mt-6 -mx-6 bg-background">

        {/* ── 상단 바 ── */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>{dbId}</span>
            <span>/</span>
            <span className="font-semibold text-foreground">{tableLabel || "테이블 선택"}</span>
            {hasTable && <button title="정보"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button>}
          </div>
          <div className="flex items-center gap-2">
            {hasResult && (
              <button
                onClick={() => setEditMode("result")}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                결과 보기
              </button>
            )}
            <button
              onClick={() => navigate(`/questions/new`)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Terminal className="h-3.5 w-3.5" />
              SQL 보기
            </button>
            <button
              onClick={handleSave}
              disabled={!hasTable}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              저장
            </button>
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6 max-w-3xl">

          {/* ── 데이터 섹션 ── */}
          <div>
            <p className="text-sm font-semibold text-primary mb-2">데이터</p>
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 flex items-center gap-3">
              <button
                onClick={() => setShowTablePicker(true)}
                className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span>{tableLabel || "테이블 선택"}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
              <div className="flex-1" />
              <button
                onClick={handleRun}
                disabled={!hasTable || isRunning}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 disabled:opacity-40 transition-colors shrink-0"
              >
                {isRunning
                  ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Play className="h-4 w-4 fill-current" />
                }
              </button>
            </div>

            {/* 모드 토글 */}
            {hasTable && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setMode("raw")}
                  title="원시 데이터"
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                    mode === "raw" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMode("summarize")}
                  title="요약"
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                    mode === "summarize" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── 필터 섹션 ── */}
          {hasTable && (
            <div>
              <p className="text-sm font-semibold text-primary mb-2">필터</p>
              <div className="rounded-xl border border-muted bg-muted/20 px-4 py-3 space-y-3">
                {filters.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.map((f, idx) => {
                      const col = columns.find((c) => c.key === f.column);
                      return (
                        <FilterTag
                          key={idx}
                          label={col?.label ?? f.column}
                          operator={f.operator}
                          value={f.value}
                          onRemove={() => setFilters((p) => p.filter((_, i) => i !== idx))}
                        />
                      );
                    })}
                  </div>
                )}
                <div className="relative inline-block">
                  <button
                    onClick={() => setFilterPickerOpen((p) => !p)}
                    disabled={columns.length === 0}
                    className="flex items-center gap-1.5 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:border-muted-foreground/70 transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />답변을 좁히기 위해 필터 더하기
                  </button>
                  {filterPickerOpen && (
                    <FilterPicker
                      datasetLabel={tableLabel || "테이블"}
                      columns={columns}
                      onAdd={(f) => { setFilters((p) => [...p, f]); setFilterPickerOpen(false); }}
                      onClose={() => setFilterPickerOpen(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── 요약 섹션 ── */}
          {hasTable && (
            <div>
              <p className="text-sm font-semibold text-primary mb-2">요약</p>
              {mode === "raw" ? (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10 overflow-visible">
                  <div className="flex gap-0 divide-x divide-emerald-200 dark:divide-emerald-800">
                    <div className="flex-1 px-4 py-3">
                      <button
                        onClick={() => setMode("summarize")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-emerald-300 bg-background px-4 py-2 text-sm text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 transition-colors"
                      >
                        함수 또는 메트릭 선택
                      </button>
                    </div>
                    <div className="flex items-center px-3 py-3 text-xs text-emerald-500 font-medium shrink-0">(으)로</div>
                    <div className="flex-1 px-4 py-3">
                      <button
                        onClick={() => setMode("summarize")}
                        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-emerald-300 bg-background px-4 py-2 text-sm text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 transition-colors"
                      >
                        그룹화할 열 선택
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 overflow-visible">
                  <div className="flex gap-0 divide-x divide-emerald-200 dark:divide-emerald-800">
                    <div className="flex-1 px-4 py-3 space-y-2">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">집계</p>
                      <div className="flex flex-wrap gap-2">
                        {aggregations.map((agg, idx) => {
                          const col = columns.find((c) => c.key === agg.column);
                          const label = agg.func === "count" ? "COUNT(*)" : `${agg.func.toUpperCase()}(${col?.label ?? agg.column})`;
                          return (
                            <div key={idx} className="relative">
                              <button
                                onClick={() => setAggPickerOpen(aggPickerOpen === idx ? null : idx)}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                                  aggPickerOpen === idx
                                    ? "border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                    : "border-emerald-300 bg-background text-emerald-700 hover:border-emerald-500 dark:border-emerald-700 dark:text-emerald-300"
                                )}
                              >
                                {label}
                              </button>
                              <button
                                onClick={() => setAggregations((p) => p.filter((_, i) => i !== idx))}
                                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
                              >
                                <X className="h-2.5 w-2.5" />
                              </button>
                              {aggPickerOpen === idx && (
                                <AggPickerPopover
                                  agg={agg}
                                  measureCols={measureCols}
                                  allCols={columns}
                                  onChange={(updated) => {
                                    setAggregations((p) => p.map((a, i) => i === idx ? updated : a));
                                    setAggPickerOpen(null);
                                  }}
                                  onClose={() => setAggPickerOpen(null)}
                                />
                              )}
                            </div>
                          );
                        })}
                        <button
                          onClick={() => setAggregations((p) => [...p, { func: "count", column: "" }])}
                          className="inline-flex items-center gap-1 rounded-full border border-dashed border-emerald-300 px-3 py-1.5 text-xs text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 transition-colors"
                        >
                          <Plus className="h-3 w-3" />집계 추가
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 px-4 py-3 space-y-2">
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">그룹화 기준</p>
                      <div className="flex flex-wrap gap-2 relative">
                        {breakouts.map((b, idx) => {
                          const col = columns.find((c) => c.key === b);
                          return (
                            <span key={idx} className="relative inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-background px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">
                              {col?.label ?? b}
                              <button
                                onClick={() => setBreakouts((p) => p.filter((_, i) => i !== idx))}
                                className="ml-0.5 text-emerald-500 hover:text-destructive transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          );
                        })}
                        <div className="relative">
                          <button
                            onClick={() => setBreakoutPickerOpen((p) => !p)}
                            className="inline-flex items-center gap-1 rounded-full border border-dashed border-emerald-300 px-3 py-1.5 text-xs text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 transition-colors"
                          >
                            <Plus className="h-3 w-3" />그룹화 추가
                          </button>
                          {breakoutPickerOpen && (
                            <BreakoutPickerPopover
                              columns={dimensionCols}
                              selected={breakouts}
                              onAdd={(key) => {
                                if (!breakouts.includes(key)) setBreakouts((p) => [...p, key]);
                                setBreakoutPickerOpen(false);
                              }}
                              onClose={() => setBreakoutPickerOpen(false)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 정렬 / 행수 ── */}
          {hasTable && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSort((p) => !p)}
                title="정렬"
                className={cn("flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  showSort ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowLimit((p) => !p)}
                title="행수 제한"
                className={cn("flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  showLimit ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:bg-muted")}
              >
                <Rows3 className="h-4 w-4" />
              </button>
            </div>
          )}

          {showSort && (
            <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">정렬 기준</span>
              <select value={sortColumn} onChange={(e) => setSortColumn(e.target.value)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">선택</option>
                {columns.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value as SortDir)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="asc">오름차순 ↑</option>
                <option value="desc">내림차순 ↓</option>
              </select>
            </div>
          )}

          {showLimit && (
            <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium">최대 행수</span>
              <input type="number" value={limit || ""} min={1}
                onChange={(e) => setLimit(Number(e.target.value))} placeholder="제한 없음"
                className="w-32 rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" />
            </div>
          )}

          {/* ── 시각화 실행 버튼 ── */}
          {hasTable && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {isRunning
                ? <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />분석 중...</>
                : <><BarChart3 className="h-4 w-4" />시각화</>
              }
            </button>
          )}

          {/* ── 생성된 SQL ── */}
          {generatedSql && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-200 dark:border-amber-800">
                <Terminal className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">실행된 쿼리</span>
              </div>
              <pre className="px-4 py-3 text-xs font-mono text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {generatedSql}
              </pre>
            </div>
          )}
        </div>
      </div>

      <SaveQuestionModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleConfirmSave}
        tableLabel={tableLabel || dataset?.label || "질문"}
        filters={filters}
        columnLabels={Object.fromEntries(columns.map((c) => [c.key, c.label]))}
        defaultCollectionId={collectionId}
      />
      {savedDest && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>저장됐습니다</span>
          <Link to={savedDest} className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2 ml-1">컬렉션에서 보기</Link>
          <button onClick={() => setSavedDest(null)} className="ml-2 text-white/40 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </>
  );
}
