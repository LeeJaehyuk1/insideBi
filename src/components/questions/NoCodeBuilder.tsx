"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Play, Plus, X, BarChart3, LineChart, PieChart, Table2,
  Save, Check, ChevronDown, Eye, LayoutGrid, Terminal,
  ArrowUpDown, Rows3, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, categoryMeta } from "@/lib/data-catalog";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { executeQuery } from "@/lib/query-engine";
import { getTableData } from "@/lib/db-catalog";
import { getColumnsForTable, getTableLabel } from "@/lib/table-columns";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import type { FolderEntry } from "@/lib/mock-data/collection-folders";
import { TablePickerModal } from "./TablePickerModal";
import { FilterPicker } from "./FilterPicker";
import { SaveQuestionModal } from "./SaveQuestionModal";
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

const AGG_FUNCS: { value: AggFunc; label: string }[] = [
  { value: "count", label: "개수 (COUNT)" },
  { value: "sum",   label: "합계 (SUM)" },
  { value: "avg",   label: "평균 (AVG)" },
  { value: "min",   label: "최솟값 (MIN)" },
  { value: "max",   label: "최댓값 (MAX)" },
];

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const OPERATOR_LABEL: Record<FilterOperator, string> = {
  eq: "=", neq: "≠", contains: "포함", not_contains: "미포함",
  starts: "시작", ends: "끝남", empty: "비어있음", not_empty: "비어있지않음",
  gte: "≥", lte: "≤",
};

/* ── 집계 ── */
function applyAggregation(rows: Record<string, unknown>[], func: AggFunc, column: string, groupBy: string | null) {
  const compute = (arr: Record<string, unknown>[]) => {
    if (func === "count") return arr.length;
    const nums = arr.map((r) => Number(r[column])).filter((v) => !isNaN(v));
    if (!nums.length) return 0;
    if (func === "sum") return nums.reduce((a, b) => a + b, 0);
    if (func === "avg") return +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(4);
    if (func === "min") return Math.min(...nums);
    if (func === "max") return Math.max(...nums);
    return 0;
  };
  if (!groupBy) return [{ [func === "count" ? "count" : column]: compute(rows) }];
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const key = String(row[groupBy] ?? "");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const label = func === "count" ? "count" : column;
  return Array.from(groups.entries()).map(([key, arr]) => ({ [groupBy]: key, [label]: compute(arr) }));
}

/* ── 결과 차트 ── */
function ResultChart({ data, chartType, xKey, yKey }: {
  data: Record<string, unknown>[]; chartType: ChartType; xKey: string; yKey: string;
}) {
  const h = 260;
  const tick = { fontSize: 11, fill: "var(--muted-foreground)" };
  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <RePieChart>
          <Pie data={data} dataKey={yKey} nameKey={xKey} cx="50%" cy="50%" outerRadius={100} label>
            {data.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip /><Legend />
        </RePieChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "line" || chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={h}>
        <AreaChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} tick={tick} /><YAxis tick={tick} /><Tooltip />
          <Area dataKey={yKey} stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={xKey} tick={tick} /><YAxis tick={tick} /><Tooltip />
        <Bar dataKey={yKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 결과 테이블 ── */
function ResultTable({ data }: { data: Record<string, unknown>[] }) {
  if (!data.length) return <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">결과가 없습니다</div>;
  const cols = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead><tr className="border-b bg-muted/50">
          {cols.map((c) => <th key={c} className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">{c}</th>)}
        </tr></thead>
        <tbody>
          {data.slice(0, 2000).map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              {cols.map((c) => (
                <td key={c} className="px-3 py-2 text-foreground whitespace-nowrap">
                  {row[c] === null || row[c] === undefined ? <span className="text-muted-foreground/40 italic">—</span> : String(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 2000 && <p className="text-center text-xs text-muted-foreground py-2">전체 {data.length}행 중 2,000행 표시</p>}
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
  const router = useRouter();
  const { saveQuestion } = useSavedQuestions();
  const { addEntry } = useCollectionFolders();

  // initialDatasetId가 DB 테이블 ID인지 확인 (dataCatalog에 없으면 DB 테이블로 처리)
  const isDbTableId = (id: string) =>
    !!id && !dataCatalog.find((d) => d.id === id);

  const resolvedTableId = initialTableId ?? (isDbTableId(initialDatasetId ?? "") ? (initialDatasetId ?? "") : "");
  const resolvedDatasetId = !resolvedTableId ? (initialDatasetId ?? "") : "";

  /* 테이블 / 데이터셋 상태 */
  const [tableId, setTableId] = React.useState(resolvedTableId);
  const [dbId, setDbId] = React.useState(initialDbId);
  const [datasetId, setDatasetId] = React.useState(resolvedDatasetId);
  const [showTablePicker, setShowTablePicker] = React.useState(!resolvedTableId && !resolvedDatasetId);

  /* 테이블 정보 */
  const tableLabel = tableId ? getTableLabel(tableId, dbId) : (dataCatalog.find((d) => d.id === datasetId)?.label ?? "");
  const columns: ColumnMeta[] = React.useMemo(() => {
    if (tableId) return getColumnsForTable(tableId, dbId);
    if (datasetId) {
      const schema = getDatasetSchema(datasetId);
      return schema?.columns ?? [];
    }
    return [];
  }, [tableId, dbId, datasetId]);

  /* 쿼리 상태 */
  const [mode, setMode] = React.useState<ViewMode>("raw");
  const [filters, setFilters] = React.useState<FilterParam[]>([]);
  const [filterPickerOpen, setFilterPickerOpen] = React.useState(false);
  const filterBtnRef = React.useRef<HTMLButtonElement>(null);
  const [aggFunc, setAggFunc] = React.useState<AggFunc>("count");
  const [aggColumn, setAggColumn] = React.useState("");
  const [groupBy, setGroupBy] = React.useState("");
  const [sortColumn, setSortColumn] = React.useState("");
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [showSort, setShowSort] = React.useState(false);
  const [limit, setLimit] = React.useState(0);
  const [showLimit, setShowLimit] = React.useState(false);

  /* 결과 상태 */
  const [result, setResult] = React.useState<Record<string, unknown>[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [hasResult, setHasResult] = React.useState(false);
  const [chartType, setChartType] = React.useState<ChartType>("bar");
  const [showTable, setShowTable] = React.useState(false);
  const [saveToast, setSaveToast] = React.useState(false);
  const [saveModalOpen, setSaveModalOpen] = React.useState(false);

  const dataset = dataCatalog.find((d) => d.id === datasetId);
  const measureCols = columns.filter((c) => c.role === "measure");
  const dimensionCols = columns.filter((c) => c.role === "dimension");

  React.useEffect(() => {
    if (measureCols.length && !aggColumn) setAggColumn(measureCols[0].key);
  }, [tableId, datasetId, measureCols.length]); // eslint-disable-line

  /* 테이블 선택 */
  const handleSelectTable = (tid: string, did: string) => {
    setTableId(tid);
    setDbId(did);
    setDatasetId("");
    setFilters([]);
    setHasResult(false);
    setResult([]);
    setAggColumn("");
    setGroupBy("");
    setMode("raw");
    setShowTable(false);
    setFilterPickerOpen(false);
    setShowTablePicker(false);
    router.replace(`/questions/nocode?dataset=${tid}${collectionId ? `&collection=${collectionId}` : ""}`);
  };

  /* 실행 */
  const handleRun = async () => {
    const id = tableId || datasetId;
    if (!id) return;
    setIsRunning(true);
    try {
      let rows: Record<string, unknown>[];
      if (tableId) {
        // DB 테이블 직접 조회
        rows = getTableData(dbId, tableId);
      } else {
        const activeFilters = filters.filter((f) => String(f.value).trim() !== "" || f.operator === "empty" || f.operator === "not_empty");
        const res = await executeQuery({ datasetId, filters: activeFilters, limit: limit || undefined });
        rows = res.data as Record<string, unknown>[];
      }

      // 필터 적용 (DB 테이블)
      if (tableId && filters.length) {
        rows = rows.filter((row) => filters.every((f) => {
          const val = String(row[f.column] ?? "");
          const fv = String(f.value ?? "");
          switch (f.operator) {
            case "eq":          return val === fv;
            case "neq":         return val !== fv;
            case "contains":    return val.toLowerCase().includes(fv.toLowerCase());
            case "not_contains":return !val.toLowerCase().includes(fv.toLowerCase());
            case "starts":      return val.toLowerCase().startsWith(fv.toLowerCase());
            case "ends":        return val.toLowerCase().endsWith(fv.toLowerCase());
            case "empty":       return val === "" || row[f.column] == null;
            case "not_empty":   return val !== "" && row[f.column] != null;
            case "gte":         return Number(val) >= Number(fv);
            case "lte":         return Number(val) <= Number(fv);
            default:            return true;
          }
        }));
      }

      if (mode === "summarize" && aggColumn) {
        rows = applyAggregation(rows, aggFunc, aggColumn, groupBy || null);
      }
      if (sortColumn) {
        rows = [...rows].sort((a, b) => {
          const cmp = String(a[sortColumn] ?? "") < String(b[sortColumn] ?? "") ? -1 : 1;
          return sortDir === "asc" ? cmp : -cmp;
        });
      }
      if (limit > 0) rows = rows.slice(0, limit);

      setResult(rows);
      setHasResult(true);
      if (mode === "raw") { setChartType("table"); setShowTable(true); }
      else {
        const def = (dataset?.defaultChart as ChartType) ?? "bar";
        setChartType(["kpi","gauge","scatter"].includes(def) ? "bar" : def);
        setShowTable(false);
      }
    } finally {
      setIsRunning(false);
    }
  };

  /* 저장 버튼 → 모달 열기 */
  const handleSave = () => {
    const id = tableId || datasetId;
    if (!id) return;
    setSaveModalOpen(true);
  };

  /* 모달에서 실제 저장 */
  const handleConfirmSave = (title: string, _desc: string, targetColId: string) => {
    const id = tableId || datasetId;
    if (!id) return;
    const saved = saveQuestion({ title, datasetId: id, filters, chartType });

    // 모달에서 선택한 컬렉션 우선, 없으면 URL 파라미터, 그것도 없으면 우리의 분석(루트)
    const finalColId = targetColId || collectionId || "our-analytics";
    const entry: FolderEntry = {
      id: `q-${saved.id}`, type: "question", name: title,
      lastEditor: "나",
      lastModified: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
      href: `/questions/${saved.id}`,
    };
    addEntry(finalColId, entry);

    setSaveModalOpen(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const resultKeys = result.length ? Object.keys(result[0]) : [];
  const xKey = resultKeys.find((k) => {
    const col = columns.find((c) => c.key === k);
    return col?.role === "dimension" || col?.type === "date" || col?.type === "string";
  }) ?? resultKeys[0] ?? "";
  const yKey = resultKeys.find((k) => k !== xKey) ?? resultKeys[1] ?? resultKeys[0] ?? "";

  const hasTable = !!(tableId || datasetId);

  /* ── 테이블 피커 ── */
  if (showTablePicker && !hasTable) {
    return (
      <>
        <TablePickerModal onSelect={handleSelectTable} onClose={() => setShowTablePicker(false)} />
      </>
    );
  }

  /* ── 메인 UI ── */
  return (
    <>
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background shadow-lg px-4 py-2.5 text-sm font-medium animate-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-green-500" />질문이 저장되었습니다
        </div>
      )}

      {/* 테이블 피커 모달 (변경 시) */}
      {showTablePicker && hasTable && (
        <TablePickerModal
          onSelect={handleSelectTable}
          onClose={() => setShowTablePicker(false)}
        />
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
            <button
              onClick={() => router.push(`/questions/new`)}
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
              {/* 테이블 이름 pill 버튼 */}
              <button
                onClick={() => setShowTablePicker(true)}
                className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
                <span>{tableLabel || "테이블 선택"}</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              <div className="flex-1" />

              {/* 실행 버튼 */}
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

            {/* 모드 토글 아이콘 */}
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
                {/* 추가된 필터 태그 */}
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
                {/* 필터 추가 버튼 + 팝오버 */}
                <div className="relative inline-block">
                  <button
                    ref={filterBtnRef}
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
          {hasTable && mode === "summarize" && (
            <div>
              <p className="text-sm font-semibold text-primary mb-2">요약</p>
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-4 flex-wrap">
                  {/* 집계 함수 + 컬럼 */}
                  <div className="flex-1 min-w-48 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-background px-3 py-2.5">
                    {aggFunc === "count" ? (
                      <button
                        onClick={() => {
                          const next = AGG_FUNCS.find((f) => f.value !== "count")?.value ?? "sum";
                          setAggFunc(next as AggFunc);
                        }}
                        className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
                      >
                        함수 또는 메트릭 선택
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select value={aggFunc} onChange={(e) => setAggFunc(e.target.value as AggFunc)}
                          className="text-sm bg-transparent border-none outline-none text-emerald-700 dark:text-emerald-400 font-medium cursor-pointer">
                          {AGG_FUNCS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                        {(aggFunc as string) !== "count" && (
                          <select value={aggColumn} onChange={(e) => setAggColumn(e.target.value)}
                            className="text-sm bg-transparent border-none outline-none text-foreground cursor-pointer">
                            {measureCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                          </select>
                        )}
                      </div>
                    )}
                  </div>

                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 shrink-0">(으)로</span>

                  {/* 그룹화 */}
                  <div className="flex-1 min-w-48 rounded-lg border-2 border-emerald-300 dark:border-emerald-700 bg-background px-3 py-2.5">
                    {groupBy ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{columns.find((c) => c.key === groupBy)?.label ?? groupBy}</span>
                        <button onClick={() => setGroupBy("")} className="text-muted-foreground hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}
                        className="w-full text-sm bg-transparent border-none outline-none text-emerald-700 dark:text-emerald-400 cursor-pointer">
                        <option value="">그룹화할 열 선택</option>
                        {dimensionCols.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              </div>
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

          {/* ── 시각화 버튼 ── */}
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

          {/* ── 결과 ── */}
          {hasResult && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">결과</span>
                  <span className="text-xs text-muted-foreground">{result.length.toLocaleString()}행</span>
                </div>
                <div className="flex items-center gap-2">
                  {([
                    { type: "bar" as ChartType, icon: BarChart3, label: "막대" },
                    { type: "line" as ChartType, icon: LineChart, label: "선" },
                    { type: "pie" as ChartType, icon: PieChart, label: "파이" },
                    { type: "table" as ChartType, icon: Table2, label: "표" },
                  ]).map(({ type, icon: Icon, label }) => (
                    <button key={type} onClick={() => { setChartType(type); setShowTable(type === "table"); }} title={label}
                      className={cn("flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                        chartType === type ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"
                      )}>
                      <Icon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                  <button onClick={handleSave}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors ml-2">
                    <Save className="h-3.5 w-3.5" />저장
                  </button>
                </div>
              </div>
              <div className="p-4">
                {chartType === "table" || showTable
                  ? <ResultTable data={result} />
                  : <ResultChart data={result} chartType={chartType} xKey={xKey} yKey={yKey} />
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 새 질문 저장 모달 */}
      <SaveQuestionModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleConfirmSave}
        tableLabel={tableLabel || dataset?.label || "질문"}
        filters={filters}
        columnLabels={Object.fromEntries(columns.map((c) => [c.key, c.label]))}
        defaultCollectionId={collectionId}
      />

    </>
  );
}
