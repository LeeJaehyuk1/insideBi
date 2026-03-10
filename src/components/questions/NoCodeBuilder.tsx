"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Play, ChevronDown, Plus, X, ArrowUpDown, Rows3,
  BarChart3, LineChart, PieChart, Table2, Save, Check,
  Layers, AlignJustify, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, categoryMeta } from "@/lib/data-catalog";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { executeQuery } from "@/lib/query-engine";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { AddToCollectionDialog } from "@/components/collections/AddToCollectionDialog";
import { DatasetPickerGrid } from "./DatasetPickerGrid";
import type { FilterParam, FilterOperator } from "@/types/query";
import type { ChartType } from "@/types/builder";
import type { CollectionItem } from "@/types/collection";
import {
  ResponsiveContainer, BarChart, Bar, LineChart as ReLineChart, Line,
  AreaChart, Area, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

/* ── 타입 ── */
type AggFunc = "count" | "sum" | "avg" | "min" | "max";
type ViewMode = "raw" | "summarize";
type SortDir = "asc" | "desc";

const AGG_FUNCS: { value: AggFunc; label: string }[] = [
  { value: "count", label: "개수 (COUNT)" },
  { value: "sum",   label: "합계 (SUM)" },
  { value: "avg",   label: "평균 (AVG)" },
  { value: "min",   label: "최솟값 (MIN)" },
  { value: "max",   label: "최댓값 (MAX)" },
];

const CHART_COLORS = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"];

function getOperators(type: string): { value: FilterOperator; label: string }[] {
  if (type === "string") return [{ value: "eq", label: "=" }, { value: "contains", label: "포함" }];
  return [{ value: "eq", label: "=" }, { value: "gte", label: "≥" }, { value: "lte", label: "≤" }];
}

/* ── 클라이언트 집계 ── */
function applyAggregation(
  rows: Record<string, unknown>[],
  func: AggFunc,
  column: string,
  groupBy: string | null
): Record<string, unknown>[] {
  const compute = (arr: Record<string, unknown>[]) => {
    if (func === "count") return arr.length;
    const nums = arr.map((r) => Number(r[column])).filter((v) => !isNaN(v));
    if (!nums.length) return 0;
    if (func === "sum") return nums.reduce((a, b) => a + b, 0);
    if (func === "avg") return nums.reduce((a, b) => a + b, 0) / nums.length;
    if (func === "min") return Math.min(...nums);
    if (func === "max") return Math.max(...nums);
    return 0;
  };

  if (!groupBy) {
    const label = func === "count" ? "count" : column;
    return [{ [label]: compute(rows) }];
  }

  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = String(row[groupBy] ?? "");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const label = func === "count" ? "count" : column;
  return Array.from(groups.entries()).map(([key, arr]) => ({
    [groupBy]: key,
    [label]: compute(arr),
  }));
}

/* ── 결과 차트 ── */
function ResultChart({
  data, chartType, xKey, yKey,
}: { data: Record<string, unknown>[]; chartType: ChartType; xKey: string; yKey: string }) {
  const h = 280;
  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <RePieChart>
          <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </RePieChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <ReLineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Line dataKey={yKey} stroke="#3b82f6" dot={false} /></ReLineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={xKey} tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey={yKey} fill="#3b82f6" radius={[4,4,0,0]} /></BarChart>
    </ResponsiveContainer>
  );
}

/* ── 결과 테이블 ── */
function ResultTable({ data }: { data: Record<string, unknown>[] }) {
  if (!data.length) return null;
  const cols = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead><tr className="border-b bg-muted/50">
          {cols.map((c) => <th key={c} className="px-3 py-2 text-left font-semibold text-muted-foreground">{c}</th>)}
        </tr></thead>
        <tbody>
          {data.slice(0, 100).map((row, i) => (
            <tr key={i} className="border-b hover:bg-muted/30">
              {cols.map((c) => <td key={c} className="px-3 py-1.5 text-foreground">{String(row[c] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 100 && <p className="text-center text-xs text-muted-foreground py-2">전체 {data.length}행 중 100행 표시</p>}
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
interface NoCodeBuilderProps {
  initialDatasetId?: string;
}

export function NoCodeBuilder({ initialDatasetId }: NoCodeBuilderProps) {
  const router = useRouter();
  const { saveQuestion } = useSavedQuestions();

  const [datasetId, setDatasetId] = React.useState(initialDatasetId ?? "");
  const [showPicker, setShowPicker] = React.useState(!initialDatasetId);
  const [mode, setMode] = React.useState<ViewMode>("raw");
  const [filters, setFilters] = React.useState<FilterParam[]>([]);
  const [aggFunc, setAggFunc] = React.useState<AggFunc>("count");
  const [aggColumn, setAggColumn] = React.useState("");
  const [groupBy, setGroupBy] = React.useState<string>("");
  const [sortColumn, setSortColumn] = React.useState("");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [showSort, setShowSort] = React.useState(false);
  const [limit, setLimit] = React.useState(0);
  const [showLimit, setShowLimit] = React.useState(false);
  const [result, setResult] = React.useState<Record<string, unknown>[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [hasResult, setHasResult] = React.useState(false);
  const [chartType, setChartType] = React.useState<ChartType>("bar");
  const [showTable, setShowTable] = React.useState(false);
  const [saveToast, setSaveToast] = React.useState(false);
  const [collectionOpen, setCollectionOpen] = React.useState(false);
  const [pendingItem, setPendingItem] = React.useState<Omit<CollectionItem,"pinned"> | null>(null);

  const dataset = dataCatalog.find((d) => d.id === datasetId);
  const schema = datasetId ? getDatasetSchema(datasetId) : null;
  const catMeta = dataset ? categoryMeta[dataset.category as keyof typeof categoryMeta] : null;

  const filterableCols = schema?.columns.filter((c) => c.filterable) ?? [];
  const measureCols = schema?.columns.filter((c) => c.role === "measure") ?? [];
  const dimensionCols = schema?.columns.filter((c) => c.role === "dimension") ?? [];
  const allCols = schema?.columns ?? [];

  // aggColumn 기본값 설정
  React.useEffect(() => {
    if (measureCols.length && !aggColumn) setAggColumn(measureCols[0].key);
  }, [datasetId, measureCols.length]);

  const handleSelectDataset = (id: string) => {
    setDatasetId(id);
    setShowPicker(false);
    setFilters([]);
    setHasResult(false);
    setResult([]);
    setAggColumn("");
    setGroupBy("");
    setMode("raw");
    router.replace(`/questions/nocode?dataset=${id}`);
  };

  const addFilter = () => {
    const col = filterableCols[0];
    if (!col) return;
    setFilters((p) => [...p, { column: col.key, operator: "eq", value: "" }]);
  };

  const updateFilter = (idx: number, patch: Partial<FilterParam>) =>
    setFilters((p) => p.map((f, i) => i === idx ? { ...f, ...patch } : f));

  const removeFilter = (idx: number) =>
    setFilters((p) => p.filter((_, i) => i !== idx));

  const handleRun = async () => {
    if (!datasetId) return;
    setIsRunning(true);
    try {
      const activeFilters = filters.filter((f) => f.value !== "");
      const res = await executeQuery({ datasetId, filters: activeFilters, limit: limit || undefined });
      let rows = res.data as Record<string, unknown>[];

      if (mode === "summarize" && aggColumn) {
        rows = applyAggregation(rows, aggFunc, aggColumn, groupBy || null);
      }

      if (sortColumn) {
        rows = [...rows].sort((a, b) => {
          const av = String(a[sortColumn] ?? ""), bv = String(b[sortColumn] ?? "");
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sortDir === "asc" ? cmp : -cmp;
        });
      }

      setResult(rows);
      setHasResult(true);
      // 차트 타입 자동 선택
      if (dataset) setChartType(dataset.defaultChart as ChartType);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = () => {
    if (!datasetId) return;
    const title = `${dataset?.label ?? "질문"} 분석`;
    const saved = saveQuestion({ title, datasetId, filters, chartType });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    const now = new Date().toISOString().split("T")[0];
    setPendingItem({ id: saved.id, title: saved.title, type: "question", href: `/questions/${saved.id}`, description: dataset?.description, createdAt: now, updatedAt: now, author: "나" });
    setCollectionOpen(true);
  };

  // 결과에서 x/y 키 추론
  const resultKeys = result.length ? Object.keys(result[0]) : [];
  const xKey = resultKeys.find((k) => {
    const col = schema?.columns.find((c) => c.key === k);
    return col?.role === "dimension" || col?.type === "date" || col?.type === "string";
  }) ?? resultKeys[0] ?? "";
  const yKey = resultKeys.find((k) => k !== xKey) ?? resultKeys[1] ?? resultKeys[0] ?? "";

  /* ── Render ── */
  return (
    <>
    {saveToast && (
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background shadow-lg px-4 py-2.5 text-sm font-medium animate-in slide-in-from-top-2">
        <Check className="h-4 w-4 text-green-500" />질문이 저장되었습니다
      </div>
    )}

    <div className="max-w-3xl mx-auto space-y-4 pb-12">

      {/* ── 데이터 섹션 ── */}
      <div className="rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 overflow-hidden">
        <div className="px-4 py-2 border-b border-blue-200 dark:border-blue-800">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">데이터</span>
        </div>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {/* 테이블 선택 칩 */}
          {datasetId && !showPicker ? (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Layers className="h-4 w-4" />
              {dataset?.label ?? datasetId}
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          ) : (
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
            >
              <Plus className="h-4 w-4" />테이블 선택
            </button>
          )}

          {/* 카테고리 레이블 */}
          {catMeta && !showPicker && (
            <span className="text-xs text-muted-foreground">{catMeta.label}</span>
          )}

          {/* 실행 버튼 */}
          <button
            onClick={handleRun}
            disabled={!datasetId || isRunning}
            className={cn(
              "ml-auto flex items-center justify-center h-9 w-9 rounded-full transition-colors shrink-0",
              datasetId ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground"
            )}
          >
            {isRunning
              ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Play className="h-4 w-4 fill-current" />
            }
          </button>
        </div>

        {/* 테이블 피커 펼침 */}
        {showPicker && (
          <div className="border-t border-blue-200 dark:border-blue-800 bg-background px-4 py-4">
            <DatasetPickerGrid onSelect={handleSelectDataset} selected={datasetId} />
          </div>
        )}

        {/* 모드 토글 */}
        {datasetId && !showPicker && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <button
              onClick={() => setMode("raw")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "raw" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <AlignJustify className="h-3.5 w-3.5" />원시 데이터
            </button>
            <button
              onClick={() => setMode("summarize")}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "summarize" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />요약
            </button>
          </div>
        )}
      </div>

      {datasetId && !showPicker && (
        <>
          {/* ── 필터 섹션 ── */}
          <div className="rounded-xl border-2 border-muted bg-muted/30 overflow-hidden">
            <div className="px-4 py-2 border-b border-muted">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">필터</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {filters.map((f, idx) => {
                const col = schema?.columns.find((c) => c.key === f.column);
                const operators = getOperators(col?.type ?? "string");
                return (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <select
                      value={f.column}
                      onChange={(e) => {
                        const nc = schema?.columns.find((c) => c.key === e.target.value);
                        const ops = getOperators(nc?.type ?? "string");
                        updateFilter(idx, { column: e.target.value, operator: ops[0].value, value: "" });
                      }}
                      className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {filterableCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                    <select
                      value={f.operator}
                      onChange={(e) => updateFilter(idx, { operator: e.target.value as FilterOperator })}
                      className="rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {operators.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
                    </select>
                    <input
                      value={f.value}
                      onChange={(e) => updateFilter(idx, { value: e.target.value })}
                      placeholder="값 입력"
                      className="flex-1 min-w-[120px] rounded-lg border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button onClick={() => removeFilter(idx)} className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={addFilter}
                disabled={filterableCols.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground hover:bg-background hover:text-foreground transition-colors w-full justify-center"
              >
                <Plus className="h-4 w-4" />답변을 좁히기 위해 필터 더하기
              </button>
            </div>
          </div>

          {/* ── 요약 섹션 ── */}
          {mode === "summarize" && (
            <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden">
              <div className="px-4 py-2 border-b border-emerald-200 dark:border-emerald-800">
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">요약</span>
              </div>
              <div className="px-4 py-4 flex flex-wrap items-center gap-3">
                {/* 함수 */}
                <select
                  value={aggFunc}
                  onChange={(e) => setAggFunc(e.target.value as AggFunc)}
                  className="rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  {AGG_FUNCS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>

                {/* 메트릭 컬럼 (count 제외) */}
                {aggFunc !== "count" && (
                  <select
                    value={aggColumn}
                    onChange={(e) => setAggColumn(e.target.value)}
                    className="rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                  >
                    {measureCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                )}

                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 px-1">(으)로</span>

                {/* 그룹화 */}
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  className="rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  <option value="">그룹화 없음</option>
                  {dimensionCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  {schema?.defaultDateColumn && !dimensionCols.find(c=>c.key===schema.defaultDateColumn) && (
                    <option value={schema.defaultDateColumn}>{schema.defaultDateColumn} (날짜)</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* ── 정렬 / 행수 ── */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSort((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                showSort ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />정렬
            </button>
            <button
              onClick={() => setShowLimit((p) => !p)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                showLimit ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Rows3 className="h-3.5 w-3.5" />행수 제한
            </button>
          </div>

          {showSort && (
            <div className="rounded-lg border bg-card px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-muted-foreground font-medium">정렬 기준</span>
              <select value={sortColumn} onChange={(e) => setSortColumn(e.target.value)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <option value="">선택</option>
                {allCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
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
              <input
                type="number" value={limit || ""} min={1}
                onChange={(e) => setLimit(Number(e.target.value))}
                placeholder="제한 없음"
                className="w-32 rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}

          {/* ── 시각화 버튼 ── */}
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

          {/* ── 결과 ── */}
          {hasResult && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">결과</span>
                  <span className="text-xs text-muted-foreground">{result.length}행</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* 차트 타입 토글 */}
                  {[
                    { type: "bar" as ChartType, icon: BarChart3, label: "막대" },
                    { type: "line" as ChartType, icon: LineChart, label: "선" },
                    { type: "pie" as ChartType, icon: PieChart, label: "파이" },
                    { type: "table" as ChartType, icon: Table2, label: "표" },
                  ].map(({ type, icon: Icon, label }) => (
                    <button
                      key={type}
                      onClick={() => { setChartType(type); setShowTable(type === "table"); }}
                      title={label}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                        chartType === type
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                  {/* 저장 */}
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors ml-2"
                  >
                    <Save className="h-3.5 w-3.5" />저장
                  </button>
                </div>
              </div>
              <div className="p-4">
                {chartType === "table" || showTable ? (
                  <ResultTable data={result} />
                ) : (
                  <ResultChart data={result} chartType={chartType} xKey={xKey} yKey={yKey} />
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>

    {pendingItem && (
      <AddToCollectionDialog
        open={collectionOpen}
        onOpenChange={(o) => { setCollectionOpen(o); if (!o) setPendingItem(null); }}
        item={pendingItem}
      />
    )}
    </>
  );
}
