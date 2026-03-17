"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronUp, ChevronDown,
  BarChart2, BarChart3, Table2,
  Save, RefreshCw, Key, Check, X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import { SummarySidebar, type AggItem, type AggFunc } from "@/components/browse/SummarySidebar";
import { FilterSidebar } from "@/components/browse/FilterSidebar";
import { FilterPanel } from "@/components/questions/FilterPanel";
import { VizPickerPanel, VizSettingsPanel } from "@/components/questions/NoCodeBuilder";
import { DEFAULT_VIZ_SETTINGS } from "@/components/questions/ChartSettingsSidebar";
import { SaveQuestionModal } from "@/components/questions/SaveQuestionModal";
import type { VizSettings } from "@/components/questions/ChartSettingsSidebar";
import type { ColumnMeta } from "@/types/dataset";
import type { FilterParam } from "@/types/query";
import type { ChartType } from "@/types/builder";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import type { FolderEntry } from "@/lib/mock-data/collection-folders";

/* ═══════════════════════════════════════════════
   타입
═══════════════════════════════════════════════ */
type SortDir = "asc" | "desc" | null;
interface SortState { col: string; dir: SortDir }
type VizPanelMode = "none" | "picker" | "settings";
type ResultDisplayMode = "table" | "chart";

/* ═══════════════════════════════════════════════
   유틸리티
═══════════════════════════════════════════════ */
function colLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function deriveColMetas(rows: Record<string, unknown>[]): ColumnMeta[] {
  if (rows.length === 0) return [];
  return Object.keys(rows[0]).map((key): ColumnMeta => {
    const sample = rows.slice(0, 10).map((r) => r[key]).filter((v) => v != null);
    let type: ColumnMeta["type"] = "string";
    if (sample.every((v) => !isNaN(Number(v)) && String(v).trim() !== "")) {
      type = "number";
    } else if (
      sample.some(
        (v) =>
          typeof v === "string" &&
          (/^\d{4}-\d{2}-\d{2}/.test(v as string) || /^\d{8}$/.test(v as string))
      )
    ) {
      type = "date";
    }
    return {
      key,
      label: colLabel(key),
      type,
      role: type === "number" ? "measure" : "dimension",
      aggregatable: type === "number",
      filterable: true,
    };
  });
}

function testFilter(row: Record<string, unknown>, f: FilterParam): boolean {
  const raw = row[f.column];
  const val = String(raw ?? "").toLowerCase();
  const fv = String(f.value).toLowerCase();
  switch (f.operator) {
    case "eq":          return val === fv;
    case "neq":         return val !== fv;
    case "contains":    return val.includes(fv);
    case "not_contains":return !val.includes(fv);
    case "starts":      return val.startsWith(fv);
    case "ends":        return val.endsWith(fv);
    case "empty":       return val === "" || val === "null" || val === "undefined";
    case "not_empty":   return val !== "" && val !== "null" && val !== "undefined";
    case "gte":         return Number(raw) >= Number(f.value);
    case "lte":         return Number(raw) <= Number(f.value);
    case "between":     return Number(raw) >= Number(f.value) && Number(raw) <= Number(f.value2 ?? "");
    default:            return true;
  }
}

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

function applyAggregations(
  rows: Record<string, unknown>[],
  aggs: AggItem[],
  breakouts: string[]
): Record<string, unknown>[] {
  const aggKey = (a: AggItem) =>
    a.func === "count" ? "카운트" : `${a.func}(${a.column})`;
  if (!aggs.length && !breakouts.length) return rows;
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
  return Array.from(groups.values()).map((arr) => {
    const result: Record<string, unknown> = {};
    for (const b of breakouts) result[b] = arr[0][b];
    for (const a of aggs) result[aggKey(a)] = computeAgg(arr, a.func, a.column);
    return result;
  });
}

/* ═══════════════════════════════════════════════
   셀 렌더러
═══════════════════════════════════════════════ */
function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined)
    return <span className="text-muted-foreground/40 italic text-[11px]">—</span>;
  return <span className="text-[11px] text-foreground">{String(value)}</span>;
}

/* ═══════════════════════════════════════════════
   결과 테이블
═══════════════════════════════════════════════ */
function ResultTable({
  data,
  colMetas,
  sort,
  onSort,
}: {
  data: Record<string, unknown>[];
  colMetas: ColumnMeta[];
  sort: SortState;
  onSort: (col: string) => void;
}) {
  if (!data.length)
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        데이터가 없습니다.
      </div>
    );
  const colKeys = Object.keys(data[0]);
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs border-collapse" style={{ minWidth: colKeys.length * 130 }}>
        <thead className="sticky top-0 z-10 bg-white dark:bg-background">
          <tr className="border-b border-border">
            <th className="px-3 py-3 text-center text-[11px] font-medium text-muted-foreground/60 border-r border-border/50 w-10 select-none bg-muted/10">
              #
            </th>
            {colKeys.map((col) => {
              const meta = colMetas.find((c) => c.key === col);
              const isPk = meta?.role === "identifier";
              return (
                <th
                  key={col}
                  onClick={() => onSort(col)}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-bold cursor-pointer hover:bg-muted/50 whitespace-nowrap select-none transition-colors border-r border-border/50",
                    isPk ? "text-primary/80" : "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {isPk && <Key className="h-3 w-3 text-primary" />}
                    {meta?.label ?? colLabel(col)}
                    {sort.col === col &&
                      (sort.dir === "asc" ? (
                        <ChevronUp className="h-3 w-3 text-primary" />
                      ) : (
                        <ChevronDown className="h-3 w-3 text-primary" />
                      ))}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={cn(
                "border-b border-border/40 hover:bg-blue-50/40 dark:hover:bg-muted/20 transition-colors",
                i % 2 === 0 ? "bg-white dark:bg-background" : "bg-[#FBFCFD] dark:bg-muted/5"
              )}
            >
              <td className="px-3 py-2.5 text-center text-[10px] text-muted-foreground/50 border-r border-border/30 bg-muted/5">
                {i + 1}
              </td>
              {colKeys.map((col) => (
                <td key={col} className="px-4 py-2.5 whitespace-nowrap border-r border-border/30">
                  <CellValue value={row[col]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   결과 차트
═══════════════════════════════════════════════ */
const CHART_COLORS = ["#509EE3", "#9CC177", "#F9CF48", "#F2A86F", "#98D9D9", "#7172AD"];

function ResultChart({
  data,
  chartType,
  xKey,
  yKey,
  settings,
}: {
  data: Record<string, unknown>[];
  chartType: ChartType;
  xKey: string;
  yKey: string;
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
        <PieChart>
          <Pie data={data} dataKey={ry} nameKey={rx} cx="50%" cy="50%" outerRadius={120}>
            {data.map((_, i) => (
              <Cell key={i} fill={i === 0 ? color : CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {settings.showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={rx} tick={tick} />
          <YAxis tick={tick} />
          <Tooltip />
          {settings.showLegend && <Legend />}
          <Line dataKey={ry} stroke={color} strokeWidth={2} dot={settings.showLabels} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  // bar (default)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={rx} tick={tick} />
        <YAxis tick={tick} />
        <Tooltip />
        {settings.showLegend && <Legend />}
        <Bar
          dataKey={ry}
          fill={color}
          radius={[4, 4, 0, 0]}
          label={settings.showLabels ? { position: "top", fontSize: 10 } : false}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ═══════════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════════ */
interface TableDetailClientProps {
  dbId: string;
  dbLabel: string;
  tableId: string;
  tableLabel: string;
  rows: Record<string, unknown>[];
}

export function TableDetailClient({
  dbId,
  dbLabel,
  tableId,
  tableLabel,
  rows,
}: TableDetailClientProps) {
  const { saveQuestion } = useSavedQuestions();
  const { addEntry } = useCollectionFolders();
  const [savedDest, setSavedDest] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!savedDest) return;
    const t = setTimeout(() => setSavedDest(null), 5000);
    return () => clearTimeout(t);
  }, [savedDest]);

  /* ── 저장 모달 ── */
  const [saveModalOpen, setSaveModalOpen] = React.useState(false);

  const handleConfirmSave = (title: string, _desc: string, targetColId: string) => {
    const savedChartType = resultDisplayMode === "table" ? "table" : chartType;
    const saved = saveQuestion({
      title,
      datasetId: tableId,
      filters,
      aggregations: aggregations.map((a) => ({ func: a.func, column: a.column })),
      breakouts,
      mode: (aggregations.length > 0 || breakouts.length > 0) ? "summarize" : "raw",
      chartType: savedChartType,
      vizSettings,
    });
    const finalColId = targetColId || "our-analytics";
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

  /* ── 컬럼 메타 ── */
  const colMetas = React.useMemo(() => deriveColMetas(rows), [rows]);

  /* ── 필터 ── */
  const [filters, setFilters] = React.useState<FilterParam[]>([]);
  const [filterSidebarOpen, setFilterSidebarOpen] = React.useState(false);
  const [filterPanelExpanded, setFilterPanelExpanded] = React.useState(true);

  /* ── 정렬 ── */
  const [sort, setSort] = React.useState<SortState>({ col: "", dir: null });
  const toggleSort = (col: string) =>
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: "", dir: null };
    });

  /* ── 요약 ── */
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [aggregations, setAggregations] = React.useState<AggItem[]>([]);
  const [breakouts, setBreakouts] = React.useState<string[]>([]);
  const numericCols = colMetas.filter((c) => c.type === "number").map((c) => c.key);

  /* ── 시각화 ── */
  const [vizPanelMode, setVizPanelMode] = React.useState<VizPanelMode>("none");
  const [resultDisplayMode, setResultDisplayMode] = React.useState<ResultDisplayMode>("table");
  const [chartType, setChartType] = React.useState<ChartType>("bar");
  const [vizSettings, setVizSettings] = React.useState<VizSettings>(DEFAULT_VIZ_SETTINGS);

  /* ── 새로고침 카운터 ── */
  const [refreshKey, setRefreshKey] = React.useState(0);

  /* ── 데이터 파이프라인 ── */
  const filtered = React.useMemo(
    () => rows.filter((row) => filters.every((f) => testFilter(row, f))),
    [rows, filters, refreshKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const aggregated = React.useMemo(
    () => applyAggregations(filtered, aggregations, breakouts),
    [filtered, aggregations, breakouts]
  );

  const sorted = React.useMemo(() => {
    if (!sort.col || !sort.dir) return aggregated;
    return [...aggregated].sort((a, b) => {
      const av = a[sort.col],
        bv = b[sort.col];
      const cmp =
        String(av ?? "") < String(bv ?? "")
          ? -1
          : String(av ?? "") > String(bv ?? "")
          ? 1
          : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [aggregated, sort]);

  /* ── 차트 키 계산 ── */
  const resultKeys = sorted.length > 0 ? Object.keys(sorted[0]) : colMetas.map((c) => c.key);
  const xKey =
    resultKeys.find((k) => {
      const col = colMetas.find((c) => c.key === k);
      return col?.type === "string" || col?.type === "date";
    }) ??
    resultKeys[0] ??
    "";
  const yKey = resultKeys.find((k) => k !== xKey) ?? resultKeys[1] ?? resultKeys[0] ?? "";

  const isSummaryActive = aggregations.length > 0 || breakouts.length > 0;

  return (
    <div
      className="flex flex-col -mt-6 -mx-6 bg-background overflow-hidden"
      style={{ height: "calc(100vh - 56px)" }}
    >
      <SaveQuestionModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleConfirmSave}
        tableLabel={tableLabel}
        filters={filters}
        columnLabels={Object.fromEntries(colMetas.map((c) => [c.key, c.label]))}
      />

      {/* ══ 상단 툴바 ══ */}
      <div className="flex items-center justify-between h-12 px-4 border-b bg-background shrink-0">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link
            href={`/browse/${dbId}`}
            className="hover:text-foreground transition-colors"
          >
            {dbLabel}
          </Link>
          <span className="mx-0.5">/</span>
          <span className="font-semibold text-foreground">{tableLabel}</span>
        </div>

        {/* 툴바 액션 */}
        <div className="flex items-center gap-1">
          {/* 필터 버튼 */}
          <button
            onClick={() => {
              if (filters.length > 0) {
                setFilterPanelExpanded((p) => !p);
              } else {
                setFilterSidebarOpen((p) => !p);
              }
              setSummaryOpen(false);
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

          {/* 요약 버튼 */}
          <button
            onClick={() => {
              setSummaryOpen((p) => !p);
              setFilterSidebarOpen(false);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors",
              summaryOpen || isSummaryActive
                ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <span className="font-bold text-sm leading-none">Σ</span>
            요약
          </button>

          <div className="w-px h-4 bg-border mx-1" />

          {/* 새로고침 */}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* 질문 만들기 */}
          <Link
            href={`/questions/nocode?dataset=${tableId}`}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            질문 만들기
          </Link>

          {/* 저장 */}
          <button
            onClick={() => setSaveModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            저장
          </button>
        </div>
      </div>

      {/* ══ 활성 필터 Pills 행 ══ */}
      {filters.length > 0 && filterPanelExpanded && (
        <FilterPanel
          filters={filters}
          columns={colMetas}
          tableLabel={tableLabel}
          onUpdate={(idx, updated) =>
            setFilters((p) => p.map((f, i) => (i === idx ? updated : f)))
          }
          onRemove={(idx) => setFilters((p) => p.filter((_, i) => i !== idx))}
          onAdd={(f) => { setFilters((p) => [...p, f]); setFilterPanelExpanded(true); }}
        />
      )}

      {/* ══ 본문 ══ */}
      <div className="flex flex-1 min-h-0">

        {/* 좌측 시각화 패널 */}
        {vizPanelMode !== "none" && (
          <div className="w-[260px] shrink-0 border-r bg-background flex flex-col overflow-hidden">
            {vizPanelMode === "picker" && (
              <VizPickerPanel
                selected={chartType}
                onSelect={(type) => {
                  setChartType(type);
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
                columns={colMetas}
                data={sorted}
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
          {resultDisplayMode === "table" || chartType === "table" ? (
            <ResultTable
              data={sorted}
              colMetas={colMetas}
              sort={sort}
              onSort={toggleSort}
            />
          ) : (
            <div className="p-6">
              <ResultChart
                data={sorted}
                chartType={chartType}
                xKey={xKey}
                yKey={yKey}
                settings={vizSettings}
              />
            </div>
          )}
        </div>

        {/* 우측 요약 사이드바 */}
        {summaryOpen && (
          <div className="z-20 border-l bg-background shadow-xl">
            <SummarySidebar
              tableLabel={tableLabel}
              columns={colMetas.map((c) => c.key)}
              columnLabels={Object.fromEntries(colMetas.map((c) => [c.key, c.label]))}
              numericColumns={numericCols}
              aggregations={aggregations}
              breakouts={breakouts}
              onAggChange={setAggregations}
              onBreakoutChange={setBreakouts}
              onClose={() => setSummaryOpen(false)}
            />
          </div>
        )}

        {/* 우측 필터 사이드바 */}
        {filterSidebarOpen && (
          <div className="z-20 border-l bg-background shadow-xl">
            <FilterSidebar
              tableLabel={tableLabel}
              columns={colMetas}
              onAdd={(f) => setFilters((p) => [...p, f])}
              onClose={() => setFilterSidebarOpen(false)}
            />
          </div>
        )}
      </div>

      {/* ══ 하단 바 ══ */}
      <div className="flex items-center h-11 px-4 border-t bg-background shrink-0">
        {/* 시각화 버튼 */}
        <button
          onClick={() => setVizPanelMode((p) => (p === "none" ? "picker" : "none"))}
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
              onClick={() => {
                setResultDisplayMode("table");
                setChartType("table");
              }}
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
            {sorted.length.toLocaleString()}행
            {filters.length > 0 ? ` / 전체 ${rows.length.toLocaleString()}` : ""}
          </span>
        </div>
      </div>

      {/* 저장 완료 토스트 */}
      {savedDest && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
          <Check className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>저장됐습니다</span>
          <Link href={savedDest} className="font-semibold text-emerald-300 hover:text-emerald-200 underline underline-offset-2 ml-1">컬렉션에서 보기</Link>
          <button onClick={() => setSavedDest(null)} className="ml-2 text-white/40 hover:text-white transition-colors"><XIcon className="h-3.5 w-3.5" /></button>
        </div>
      )}
    </div>
  );
}
