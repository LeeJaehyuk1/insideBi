"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Type, Link2, LayoutGrid, SlidersHorizontal, MoreHorizontal,
  ChevronDown, X, Search, MessageSquare, FileText, FolderOpen,
  ChevronRight, Table2, Pencil, Check, BarChart2, Maximize2, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collections } from "@/lib/mock-data/collections";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { dataCatalog } from "@/lib/data-catalog";
import { WidgetRenderer } from "@/components/builder/WidgetRenderer";
import { useDashboardLibrary } from "@/hooks/useDashboardLibrary";
import type { WidgetConfig, ChartType } from "@/types/builder";

/* ── 위젯 타입 ── */
interface DashWidget {
  id: string;
  title: string;
  datasetId: string;
  chartType: ChartType;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

/* ── 위젯을 WidgetConfig로 변환 ── */
function toWidgetConfig(w: DashWidget): WidgetConfig {
  return {
    id: w.id,
    datasetId: w.datasetId,
    chartType: w.chartType,
    title: w.title,
    colSpan: 2,
  };
}

/* ── 탭 타입 ── */
interface Tab { id: string; label: string }

/* ── 차트 타입 선택 미니 드롭다운 ── */
const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar",   label: "막대" },
  { value: "line",  label: "선" },
  { value: "area",  label: "영역" },
  { value: "pie",   label: "파이" },
];

function ChartTypeDropdown({ value, onChange }: {
  value: ChartType;
  onChange: (t: ChartType) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = CHART_TYPES.find((c) => c.value === value);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
      >
        <BarChart2 className="h-3 w-3" />
        {current?.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-24 rounded-lg border border-border bg-background shadow-lg">
          {CHART_TYPES.map((ct) => (
            <button
              key={ct.value}
              onClick={() => { onChange(ct.value); setOpen(false); }}
              className={cn(
                "flex w-full px-3 py-1.5 text-xs text-left hover:bg-muted transition-colors",
                value === ct.value && "text-primary font-medium"
              )}
            >
              {ct.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 위젯 카드 ── */
function WidgetCard({ widget, onRemove, onChartTypeChange }: {
  widget: DashWidget;
  onRemove: () => void;
  onChartTypeChange: (t: ChartType) => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-background overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/20 shrink-0">
        <span className="text-sm font-semibold text-foreground truncate flex-1">{widget.title}</span>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChartTypeDropdown value={widget.chartType} onChange={onChartTypeChange} />
          <button
            title="확대"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onRemove}
            title="제거"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* 차트 */}
      <div className="p-3 h-56">
        <WidgetRenderer widget={toWidgetConfig(widget)} />
      </div>
    </div>
  );
}

/* ── 우측 패널 ── */
function RightPanel({ onAddWidget }: {
  onAddWidget: (title: string, datasetId: string, chartType: ChartType) => void;
}) {
  const { questions } = useSavedQuestions();
  const [search, setSearch] = React.useState("");
  const [expandedCols, setExpandedCols] = React.useState<Set<string>>(new Set());

  const toggleCol = (id: string) =>
    setExpandedCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const savedQs = questions.filter(
    (q) => !search || q.title.toLowerCase().includes(search.toLowerCase())
  );
  const cols = collections.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );
  const catalogItems = dataCatalog.filter(
    (d) => !search || d.label.toLowerCase().includes(search.toLowerCase())
  );

  /* 기본 차트 타입 결정 */
  function defaultChart(datasetId: string): ChartType {
    const ds = dataCatalog.find((d) => d.id === datasetId);
    const def = ds?.defaultChart ?? "bar";
    if (["kpi", "gauge", "scatter"].includes(def)) return "bar";
    return def as ChartType;
  }

  return (
    <div className="w-72 shrink-0 border-l border-border bg-background flex flex-col h-full">

      {/* 검색 */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="찾다..."
            className="w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* 새로운 질문 / SQL */}
      <div className="flex items-center gap-2 px-4 pb-3 shrink-0">
        <Link
          href="/questions/nocode"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5 text-primary" />새로운 질문
        </Link>
        <Link
          href="/questions/new"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />새로운 SQL 쿼리
        </Link>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">

        {/* 저장된 질문 */}
        {savedQs.length > 0 && (
          <div className="mb-2">
            <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              저장된 질문
            </p>
            {savedQs.map((q) => {
              const ds = dataCatalog.find((d) => d.id === q.datasetId);
              return (
                <button
                  key={q.id}
                  onClick={() => onAddWidget(q.title, q.datasetId, defaultChart(q.datasetId))}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-primary/5 hover:text-primary transition-colors group"
                >
                  <Table2 className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground group-hover:text-primary truncate">{q.title}</p>
                    {ds && <p className="text-[11px] text-muted-foreground">{ds.categoryLabel}</p>}
                  </div>
                  <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* 컬렉션 섹션 */}
        <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          우리의 분석
        </p>

        {cols.map((col) => (
          <div key={col.id}>
            <button
              onClick={() => toggleCol(col.id)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm text-foreground truncate">{col.name}</span>
              <ChevronRight className={cn(
                "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                expandedCols.has(col.id) && "rotate-90"
              )} />
            </button>

            {expandedCols.has(col.id) && (
              <div className="pl-4">
                {col.items.map((item) => {
                  // 컬렉션 아이템의 datasetId 추론: href에서 dataset 파라미터 또는 id 매핑
                  const dsId = dataCatalog.find((d) =>
                    item.title.toLowerCase().includes(d.label.toLowerCase())
                  )?.id ?? "npl-trend";
                  return (
                    <button
                      key={item.id}
                      onClick={() => onAddWidget(item.title, dsId, defaultChart(dsId))}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-primary/5 hover:text-primary transition-colors group"
                    >
                      <Table2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="flex-1 text-sm text-foreground group-hover:text-primary truncate">{item.title}</span>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                    </button>
                  );
                })}
                {col.items.length === 0 && (
                  <p className="px-4 py-2 text-xs text-muted-foreground">항목 없음</p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 데이터 카탈로그 (항상 표시, 검색 시 필터) */}
        <div className="mt-1">
          <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            데이터 카탈로그
          </p>
          {(search ? catalogItems : dataCatalog).map((d) => (
            <button
              key={d.id}
              onClick={() => onAddWidget(d.label, d.id, defaultChart(d.id))}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-primary/5 transition-colors group"
            >
              <Table2 className="h-4 w-4 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground group-hover:text-primary truncate">{d.label}</p>
                <p className="text-[11px] text-muted-foreground">{d.categoryLabel}</p>
              </div>
              <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 메인 에디터 ── */
export function DashboardEditorClient() {
  const params = useSearchParams();
  const router = useRouter();
  const initialName = params.get("name") ?? "새 대시보드";
  const collectionId = params.get("collection") ?? "analytics";

  const { saveDashboard, library, hydrated: libHydrated } = useDashboardLibrary();
  const [saveToast, setSaveToast] = React.useState(false);

  const [dashboardName, setDashboardName] = React.useState(initialName);
  const [editingName, setEditingName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(initialName);
  const [tabs, setTabs] = React.useState<Tab[]>([{ id: "tab-1", label: "탭 1" }]);
  const [activeTab, setActiveTab] = React.useState("tab-1");
  const [rightPanelOpen, setRightPanelOpen] = React.useState(false);
  const [widgets, setWidgets] = React.useState<DashWidget[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  // 라이브러리 hydration 완료 후 기존 저장 데이터 로드
  React.useEffect(() => {
    if (!libHydrated || loaded) return;
    const existing = library.find((d) => d.name === initialName);
    if (existing?.widgets?.length) {
      setWidgets(
        existing.widgets.map((w) => ({
          id: w.id,
          title: w.title,
          datasetId: w.datasetId,
          chartType: w.chartType,
        }))
      );
    }
    setLoaded(true);
  }, [libHydrated, library, initialName, loaded]);

  const nameInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const handleNameSave = () => {
    if (nameInput.trim()) setDashboardName(nameInput.trim());
    setEditingName(false);
  };

  const addTab = () => {
    const t: Tab = { id: `tab-${Date.now()}`, label: `탭 ${tabs.length + 1}` };
    setTabs((p) => [...p, t]);
    setActiveTab(t.id);
  };

  /** 우측 패널에서 항목 클릭 시 위젯 추가 */
  const handleAddWidget = (title: string, datasetId: string, chartType: ChartType) => {
    setWidgets((prev) => [...prev, { id: generateId(), title, datasetId, chartType }]);
    setRightPanelOpen(false); // 패널 닫기 (선택사항: 열어두려면 제거)
  };

  const removeWidget = (id: string) => setWidgets((p) => p.filter((w) => w.id !== id));

  const updateChartType = (id: string, chartType: ChartType) =>
    setWidgets((p) => p.map((w) => w.id === id ? { ...w, chartType } : w));

  const isEmpty = widgets.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 bg-background">

      {/* 저장 완료 토스트 */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background shadow-lg px-4 py-2.5 text-sm font-medium animate-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-green-500" />
          대시보드가 저장되었습니다
        </div>
      )}

      {/* ── 상단 툴바 ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 bg-background">
        {/* 대시보드 이름 */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") { setEditingName(false); setNameInput(dashboardName); }
                }}
                className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none min-w-[120px]"
              />
              <button onClick={handleNameSave} className="text-primary"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setEditingName(false); setNameInput(dashboardName); }} className="text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <button onClick={() => setEditingName(true)} className="flex items-center gap-2 group">
              <h1 className="text-xl font-bold text-foreground">{dashboardName}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* 우측 툴바 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRightPanelOpen((p) => !p)}
            title="차트 추가"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              rightPanelOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="h-5 w-px bg-border mx-1" />
          <button className="flex items-center gap-0.5 h-8 px-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Type className="h-3.5 w-3.5" /><ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex items-center gap-0.5 h-8 px-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Link2 className="h-3.5 w-3.5" /><ChevronDown className="h-3 w-3" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-border mx-2" />

          {/* 취소 */}
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            취소
          </button>

          {/* 저장 */}
          <button
            onClick={() => {
              const dashboard = {
                name: dashboardName,
                widgets: widgets.map((w) => toWidgetConfig(w)),
                savedAt: new Date().toISOString(),
              };
              saveDashboard(dashboard);
              setSaveToast(true);
              setTimeout(() => {
                setSaveToast(false);
                router.push("/dashboards");
              }, 1200);
            }}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            저장
          </button>
        </div>
      </div>

      {/* ── 탭 바 ── */}
      <div className="flex items-center px-6 border-b border-border shrink-0 bg-background">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1 px-1 py-2.5 mr-1 border-b-2 -mb-px cursor-pointer transition-colors",
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="text-sm font-medium px-1">{tab.label}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </div>
        ))}
        <button
          onClick={addTab}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ml-1"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* ── 본문 ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* 캔버스 */}
        <div className={cn("flex-1 overflow-y-auto", isEmpty ? "flex items-center justify-center bg-muted/10" : "p-6 bg-muted/5")}>
          {isEmpty ? (
            /* 빈 상태 */
            <div className="text-center space-y-4 max-w-md px-4">
              <div className="flex justify-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/60">
                  <svg width="52" height="44" viewBox="0 0 52 44" fill="none" className="opacity-40">
                    <rect x="2" y="8" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <rect x="8" y="2" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="white"/>
                    <line x1="14" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="14" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="40" cy="34" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="46" y1="40" x2="50" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-base font-semibold text-foreground">
                  새로운 질문을 만들거나, 컬렉션에서 기존 질문을<br />찾아보세요.
                </p>
                <p className="text-sm text-muted-foreground">
                  링크 또는 텍스트 카드를 추가합니다.{" "}
                  <button className="text-primary hover:underline">섹션을 추가</button>
                  하여 기본 레이아웃으로 시작할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setRightPanelOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors"
              >
                차트 추가
              </button>
            </div>
          ) : (
            /* 위젯 그리드 */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
              {widgets.map((w) => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  onRemove={() => removeWidget(w.id)}
                  onChartTypeChange={(t) => updateChartType(w.id, t)}
                />
              ))}
              {/* + 카드 추가 버튼 */}
              <button
                onClick={() => setRightPanelOpen(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[240px] text-muted-foreground hover:text-primary group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current group-hover:border-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">차트 추가</span>
              </button>
            </div>
          )}
        </div>

        {/* 우측 패널 */}
        {rightPanelOpen && (
          <div className="animate-in slide-in-from-right duration-200">
            <RightPanel onAddWidget={handleAddWidget} />
          </div>
        )}
      </div>
    </div>
  );
}
