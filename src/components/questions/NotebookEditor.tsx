"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Database, Filter, BarChart3, Play, Save, ChevronDown, ChevronRight,
  Plus, X, Check, AlertCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, categoryMeta, chartTypeLabels, CATEGORY_ORDER } from "@/lib/data-catalog";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { executeQuery } from "@/lib/query-engine";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import type { FilterParam, FilterOperator } from "@/types/query";
import type { ChartType } from "@/types/builder";
import type { SavedQuestion } from "@/types/question";
import { Button } from "@/components/ui/button";
import { AddToCollectionDialog } from "@/components/collections/AddToCollectionDialog";
import type { CollectionItem } from "@/types/collection";

/* ── 차트 타입별 아이콘/라벨 ── */
const CHART_ICON_MAP: Record<string, string> = {
  line: "📈", area: "📊", bar: "📊", pie: "🥧",
  scatter: "⚬", radar: "🕸", gauge: "🎯",
  table: "📋", kpi: "🔢", waterfall: "🌊", bullet: "🎯",
};

/* ── 연산자 목록 (컬럼 타입별) ── */
function getOperators(type: string): { value: FilterOperator; label: string }[] {
  if (type === "string") {
    return [
      { value: "eq", label: "=" },
      { value: "contains", label: "포함" },
    ];
  }
  return [
    { value: "eq", label: "=" },
    { value: "gte", label: "≥" },
    { value: "lte", label: "≤" },
  ];
}

/* ── 스텝 헤더 ── */
function StepHeader({
  step, icon: Icon, title, summary, open, onToggle, completed,
}: {
  step: number; icon: React.ElementType; title: string; summary?: string;
  open: boolean; onToggle: () => void; completed: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors",
        open ? "bg-muted/30" : "hover:bg-muted/20"
      )}
    >
      <div className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0",
        completed
          ? "bg-primary text-primary-foreground"
          : open
            ? "bg-primary/20 text-primary"
            : "bg-muted text-muted-foreground"
      )}>
        {completed ? <Check className="h-3.5 w-3.5" /> : step}
      </div>
      <Icon className={cn("h-4 w-4 shrink-0", completed ? "text-primary" : "text-muted-foreground")} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", completed || open ? "text-foreground" : "text-muted-foreground")}>
          {title}
        </p>
        {summary && !open && (
          <p className="text-xs text-muted-foreground truncate">{summary}</p>
        )}
      </div>
      {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
    </button>
  );
}

/* ── 메인 에디터 ── */
interface NotebookEditorProps {
  initialQuestion?: SavedQuestion;
}

export function NotebookEditor({ initialQuestion }: NotebookEditorProps) {
  const router = useRouter();
  const { saveQuestion } = useSavedQuestions();

  const [openStep, setOpenStep] = React.useState<1 | 2 | 3>(initialQuestion ? 3 : 1);
  const [datasetId, setDatasetId] = React.useState<string>(initialQuestion?.datasetId ?? "");
  const [filters, setFilters] = React.useState<FilterParam[]>(initialQuestion?.filters ?? []);
  const [chartType, setChartType] = React.useState<ChartType>(initialQuestion?.chartType ?? "bar");
  const [questionTitle, setQuestionTitle] = React.useState(initialQuestion?.title ?? "");
  const [previewData, setPreviewData] = React.useState<Record<string, unknown>[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [hasResult, setHasResult] = React.useState(!!initialQuestion);
  const [collectionDialogOpen, setCollectionDialogOpen] = React.useState(false);
  const [pendingItem, setPendingItem] = React.useState<Omit<CollectionItem, "pinned"> | null>(null);
  const [saveToast, setSaveToast] = React.useState(false);

  const selectedDataset = dataCatalog.find((d) => d.id === datasetId);
  const schema = datasetId ? getDatasetSchema(datasetId) : null;
  const filterableColumns = schema?.columns.filter((c) => c.filterable) ?? [];

  /* 초기 로드 (초기 질문 있는 경우) */
  React.useEffect(() => {
    if (initialQuestion) {
      runQuery(initialQuestion.datasetId, initialQuestion.filters, initialQuestion.chartType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runQuery(
    dsId: string = datasetId,
    flt: FilterParam[] = filters,
    ct: ChartType = chartType
  ) {
    if (!dsId) return;
    setIsRunning(true);
    setRunError(null);
    try {
      const result = await executeQuery({ datasetId: dsId, filters: flt });
      setPreviewData(result.data as Record<string, unknown>[]);
      setHasResult(true);
      setChartType(ct);
    } catch (e) {
      setRunError("데이터를 불러오지 못했습니다.");
    } finally {
      setIsRunning(false);
    }
  }

  const handleSelectDataset = (id: string) => {
    setDatasetId(id);
    setFilters([]);
    const ds = dataCatalog.find((d) => d.id === id);
    if (ds) setChartType(ds.defaultChart as ChartType);
    setHasResult(false);
    setPreviewData([]);
    setOpenStep(2);
  };

  const addFilter = () => {
    const firstCol = filterableColumns[0];
    if (!firstCol) return;
    setFilters((prev) => [
      ...prev,
      { column: firstCol.key, operator: "eq", value: "" },
    ]);
  };

  const updateFilter = (idx: number, updates: Partial<FilterParam>) => {
    setFilters((prev) => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const removeFilter = (idx: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (!datasetId) return;
    const title = questionTitle.trim() || `${selectedDataset?.label ?? "질문"} 분석`;
    const saved = saveQuestion({ title, datasetId, filters, chartType });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    // 컬렉션 추가 다이얼로그 열기
    const item: Omit<CollectionItem, "pinned"> = {
      id: saved.id,
      title: saved.title,
      type: "question",
      href: `/questions/${saved.id}`,
      description: `${selectedDataset?.label ?? ""} 데이터셋 분석`,
      createdAt: saved.savedAt.split("T")[0],
      updatedAt: saved.savedAt.split("T")[0],
      author: "나",
    };
    setPendingItem(item);
    setCollectionDialogOpen(true);
  };

  /* ── 차트 미리보기: WidgetRenderer 대신 인라인 테이블 + 간단 메시지 ── */
  function PreviewPanel() {
    if (isRunning) {
      return (
        <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          데이터 조회 중...
        </div>
      );
    }
    if (runError) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 p-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {runError}
        </div>
      );
    }
    if (!hasResult) {
      return (
        <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground text-sm">
          <Play className="h-8 w-8 opacity-30" />
          <p>실행 버튼을 눌러 데이터를 조회하세요</p>
        </div>
      );
    }
    if (previewData.length === 0) {
      return (
        <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
          조건에 맞는 데이터가 없습니다.
        </div>
      );
    }

    /* 인라인 위젯 렌더링: WidgetConfig + WidgetRenderer */
    // WidgetRenderer는 별도 import 필요 → 여기서는 데이터 테이블로 대체
    const columns = Object.keys(previewData[0]);
    const displayRows = previewData.slice(0, 10);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b">
              {columns.map((col) => (
                <th key={col} className="text-left px-3 py-2 font-semibold text-muted-foreground">
                  {schema?.columns.find((c) => c.key === col)?.label ?? col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                {columns.map((col) => (
                  <td key={col} className="px-3 py-2 text-foreground">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {previewData.length > 10 && (
          <p className="text-[10px] text-muted-foreground text-center py-2">
            전체 {previewData.length}행 중 10행 표시
          </p>
        )}
      </div>
    );
  }

  const toggleStep = (s: 1 | 2 | 3) => setOpenStep((prev) => (prev === s ? s : s));

  return (
    <>
    <div className="max-w-3xl mx-auto space-y-4 pb-12">
      {/* 저장 토스트 */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background shadow-lg px-4 py-2.5 animate-in slide-in-from-top-2 duration-200 text-sm font-medium">
          <Check className="h-4 w-4 text-green-500" />
          질문이 저장되었습니다
        </div>
      )}

      {/* 제목 입력 */}
      <div className="flex items-center gap-3">
        <input
          value={questionTitle}
          onChange={(e) => setQuestionTitle(e.target.value)}
          placeholder="질문 제목 (선택)"
          className="flex-1 rounded-lg border bg-card px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <Button
          size="sm"
          onClick={() => runQuery()}
          disabled={!datasetId || isRunning}
          className="gap-1.5 shrink-0"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          실행
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={!datasetId || !hasResult}
          className="gap-1.5 shrink-0"
        >
          <Save className="h-4 w-4" />
          저장
        </Button>
      </div>

      {/* ── Notebook Steps ── */}
      <div className="mb-card overflow-hidden divide-y divide-border">

        {/* STEP 1: 데이터 선택 */}
        <div>
          <StepHeader
            step={1} icon={Database}
            title="데이터"
            summary={selectedDataset ? `${selectedDataset.categoryLabel} › ${selectedDataset.label}` : undefined}
            open={openStep === 1}
            onToggle={() => setOpenStep(1)}
            completed={!!datasetId}
          />
          {openStep === 1 && (
            <div className="px-5 pb-5 pt-3 space-y-4">
              {CATEGORY_ORDER.map((cat) => {
                const catDs = dataCatalog.filter((d) => d.category === cat);
                const meta = categoryMeta[cat];
                return (
                  <div key={cat}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", meta.color)}>
                      {meta.label}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {catDs.map((ds) => (
                        <button
                          key={ds.id}
                          onClick={() => handleSelectDataset(ds.id)}
                          className={cn(
                            "text-left rounded-lg border px-3 py-2.5 text-sm transition-all",
                            "hover:border-primary/50 hover:bg-primary/5",
                            datasetId === ds.id
                              ? "border-primary bg-primary/10 font-semibold text-primary"
                              : "bg-background text-foreground"
                          )}
                        >
                          <p className="font-medium truncate">{ds.label}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{ds.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* STEP 2: 필터 */}
        <div>
          <StepHeader
            step={2} icon={Filter}
            title="필터"
            summary={filters.length > 0 ? `${filters.length}개 조건` : "조건 없음"}
            open={openStep === 2}
            onToggle={() => setOpenStep(2)}
            completed={openStep > 2 && !!datasetId}
          />
          {openStep === 2 && (
            <div className="px-5 pb-5 pt-3 space-y-3">
              {!datasetId ? (
                <p className="text-sm text-muted-foreground">먼저 데이터를 선택하세요.</p>
              ) : (
                <>
                  {filters.length === 0 && (
                    <p className="text-sm text-muted-foreground">필터 없음 — 전체 데이터를 표시합니다.</p>
                  )}
                  {filters.map((f, idx) => {
                    const col = filterableColumns.find((c) => c.key === f.column);
                    const ops = getOperators(col?.type ?? "string");
                    return (
                      <div key={idx} className="flex items-center gap-2 flex-wrap">
                        {/* 컬럼 선택 */}
                        <select
                          value={f.column}
                          onChange={(e) => updateFilter(idx, { column: e.target.value, value: "" })}
                          className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {filterableColumns.map((c) => (
                            <option key={c.key} value={c.key}>{c.label}</option>
                          ))}
                        </select>
                        {/* 연산자 */}
                        <select
                          value={f.operator}
                          onChange={(e) => updateFilter(idx, { operator: e.target.value as FilterOperator })}
                          className="rounded-md border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {ops.map((op) => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                        {/* 값 입력 */}
                        <input
                          value={String(f.value)}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const num = Number(raw);
                            updateFilter(idx, { value: col?.type === "string" ? raw : (isNaN(num) ? raw : num) });
                          }}
                          placeholder="값 입력"
                          className="rounded-md border bg-background px-2 py-1.5 text-sm w-28 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button onClick={() => removeFilter(idx)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    onClick={addFilter}
                    disabled={filterableColumns.length === 0}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline disabled:opacity-40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    필터 추가
                  </button>
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setOpenStep(3); runQuery(); }}
                      disabled={!datasetId}
                    >
                      다음: 시각화 →
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* STEP 3: 시각화 */}
        <div>
          <StepHeader
            step={3} icon={BarChart3}
            title="시각화"
            summary={selectedDataset ? `${CHART_ICON_MAP[chartType] ?? ""} ${chartTypeLabels[chartType] ?? chartType}` : undefined}
            open={openStep === 3}
            onToggle={() => setOpenStep(3)}
            completed={hasResult}
          />
          {openStep === 3 && (
            <div className="px-5 pb-5 pt-3 space-y-3">
              {!selectedDataset ? (
                <p className="text-sm text-muted-foreground">먼저 데이터를 선택하세요.</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-2">차트 타입 선택</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDataset.compatibleCharts.map((ct) => (
                      <button
                        key={ct}
                        onClick={() => setChartType(ct as ChartType)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all",
                          chartType === ct
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "bg-background hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <span>{CHART_ICON_MAP[ct] ?? "📊"}</span>
                        {chartTypeLabels[ct] ?? ct}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── 결과 미리보기 ── */}
      <div className="mb-card">
        <div className="mb-card-header">
          <div className="flex items-center gap-2">
            <span className="mb-card-title">결과 미리보기</span>
            {hasResult && previewData.length > 0 && (
              <span className="text-xs text-muted-foreground">({previewData.length}행)</span>
            )}
          </div>
          {hasResult && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              {chartTypeLabels[chartType] ?? chartType} 형식
            </span>
          )}
        </div>
        <div className="p-4">
          <PreviewPanel />
        </div>
      </div>
    </div>

    {pendingItem && (
      <AddToCollectionDialog
        open={collectionDialogOpen}
        onOpenChange={(open) => {
          setCollectionDialogOpen(open);
          if (!open) setPendingItem(null);
        }}
        item={pendingItem}
      />
    )}
    </>
  );
}
