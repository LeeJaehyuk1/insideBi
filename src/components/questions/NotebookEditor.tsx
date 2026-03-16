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
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import type { FolderEntry } from "@/lib/mock-data/collection-folders";
import { SaveQuestionModal } from "./SaveQuestionModal";
import { DEFAULT_VIZ_SETTINGS } from "./ChartSettingsSidebar";
import type { VizSettings } from "./ChartSettingsSidebar";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const CHART_COLORS = ["#3b82f6", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

function ResultChart({ data, chartType, xKey, yKey, settings }: {
  data: Record<string, unknown>[];
  chartType: ChartType;
  xKey: string;
  yKey: string;
  settings: VizSettings;
}) {
  const tick = { fontSize: 11, fill: "var(--muted-foreground)" };
  const rx = settings.xKey || xKey;
  const ry = settings.yKey || yKey;
  const color = settings.color || "#3b82f6";

  if (chartType === "kpi") {
    const val = data[0]?.[ry];
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
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={data} dataKey={ry} nameKey={rx} cx="50%" cy="50%" outerRadius={110}
            label={settings.showLabels} labelLine={settings.showLabels}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? color : CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip />
          {settings.showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={rx} tick={tick} />
          <YAxis tick={tick} />
          <Tooltip />
          {settings.showLegend && <Legend />}
          <Line type="monotone" dataKey={ry} stroke={color} strokeWidth={2}
            dot={settings.showLabels} label={settings.showLabels ? { fontSize: 10 } : false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={rx} tick={tick} />
          <YAxis tick={tick} />
          <Tooltip />
          {settings.showLegend && <Legend />}
          <Area type="monotone" dataKey={ry} stroke={color} fill={`${color}20`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  // 기본: bar
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={rx} tick={tick} />
        <YAxis tick={tick} />
        <Tooltip />
        {settings.showLegend && <Legend />}
        <Bar dataKey={ry} fill={color} radius={[4, 4, 0, 0]}
          label={settings.showLabels ? { position: "top", fontSize: 10 } : false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

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
  const { addEntry } = useCollectionFolders();

  const [openStep, setOpenStep] = React.useState<1 | 2 | 3>(initialQuestion ? 3 : 1);
  const [datasetId, setDatasetId] = React.useState<string>(initialQuestion?.datasetId ?? "");
  const [filters, setFilters] = React.useState<FilterParam[]>(initialQuestion?.filters ?? []);
  const [chartType, setChartType] = React.useState<ChartType>(initialQuestion?.chartType ?? "bar");
  const [vizSettings, setVizSettings] = React.useState<VizSettings>(
    initialQuestion?.vizSettings ?? DEFAULT_VIZ_SETTINGS
  );
  const [questionTitle, setQuestionTitle] = React.useState(initialQuestion?.title ?? "");
  const [previewData, setPreviewData] = React.useState<Record<string, unknown>[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [hasResult, setHasResult] = React.useState(!!initialQuestion);
  const [saveModalOpen, setSaveModalOpen] = React.useState(false);

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
    setSaveModalOpen(true);
  };

  /* 모달에서 실제 저장 */
  const handleConfirmSave = (title: string, _desc: string, targetColId: string) => {
    if (!datasetId) return;
    const finalTitle = title || questionTitle.trim() || `${selectedDataset?.label ?? "질문"} 분석`;
    const saved = saveQuestion({ title: finalTitle, datasetId, filters, chartType, vizSettings });

    const finalColId = targetColId || "our-analytics";
    const entry: FolderEntry = {
      id: `q-${saved.id}`,
      type: "question",
      name: finalTitle,
      lastEditor: "나",
      lastModified: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }),
      href: `/questions/${saved.id}`,
    };
    addEntry(finalColId, entry);

    setSaveModalOpen(false);
    // 저장 후 해당 컬렉션으로 이동
    const dest = finalColId === "our-analytics" ? "/collections" : `/collections/${finalColId}`;
    router.push(dest);
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

    const resultKeys = Object.keys(previewData[0]);
    const defaultXKey = resultKeys.find((k) => {
      const col = schema?.columns.find((c) => c.key === k);
      return col?.role === "dimension" || col?.type === "date" || col?.type === "string";
    }) ?? resultKeys[0] ?? "";
    const defaultYKey = resultKeys.find((k) => k !== defaultXKey) ?? resultKeys[1] ?? resultKeys[0] ?? "";
    // vizSettings에 저장된 키 우선, 없으면 자동 감지 값 사용
    const xKey = vizSettings.xKey || defaultXKey;
    const yKey = vizSettings.yKey || defaultYKey;

    if (chartType === "table") {
      const displayRows = previewData.slice(0, 10);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                {resultKeys.map((col) => (
                  <th key={col} className="text-left px-3 py-2 font-semibold text-muted-foreground">
                    {schema?.columns.find((c) => c.key === col)?.label ?? col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                  {resultKeys.map((col) => (
                    <td key={col} className="px-3 py-2 text-foreground">{String(row[col] ?? "")}</td>
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

    return <ResultChart data={previewData} chartType={chartType} xKey={xKey} yKey={yKey} settings={vizSettings} />;
  }

  const toggleStep = (s: 1 | 2 | 3) => setOpenStep((prev) => (prev === s ? s : s));

  return (
    <>
    <div className="max-w-3xl mx-auto space-y-4 pb-12">



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

    <SaveQuestionModal
      open={saveModalOpen}
      onClose={() => setSaveModalOpen(false)}
      onSave={handleConfirmSave}
      tableLabel={selectedDataset?.label ?? "질문"}
      filters={filters}
      columnLabels={Object.fromEntries(
        (schema?.columns ?? []).map((c) => [c.key, c.label])
      )}
    />
    </>
  );
}
