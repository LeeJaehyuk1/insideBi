
import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  Plus, Type, Link2, LayoutGrid, SlidersHorizontal, MoreHorizontal,
  ChevronDown, X, Search, MessageSquare, FileText,
  Table2, Pencil, Check, BarChart2, Maximize2, Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import type { VizSettings } from "@/components/questions/ChartSettingsSidebar";
import { dataCatalog } from "@/lib/data-catalog";
import { WidgetRenderer } from "@/components/builder/WidgetRenderer";
import { useDashboardLibrary } from "@/hooks/useDashboardLibrary";
import { consumeAutoDashboard } from "@/lib/auto-dashboard";
import type { WidgetConfig, ChartType, AxisMapping } from "@/types/builder";
import type { FilterParam } from "@/types/query";

/* Dashboard widget model */
interface DashWidget {
  id: string;
  title: string;
  datasetId: string;
  chartType: ChartType;
  filters?: FilterParam[];
  vizSettings?: VizSettings;
  axisMapping?: AxisMapping;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function toWidgetConfig(w: DashWidget): WidgetConfig {
  // Derive axis mapping from viz settings when explicit mapping is missing.
  const axisMapping: WidgetConfig["axisMapping"] =
    w.axisMapping ??
    (w.vizSettings?.xKey || w.vizSettings?.yKey
      ? { x: w.vizSettings!.xKey || undefined, y: w.vizSettings!.yKey ? [w.vizSettings!.yKey] : [] }
      : undefined);
  return {
    id: w.id,
    datasetId: w.datasetId,
    chartType: w.chartType,
    title: w.title,
    colSpan: 2,
    queryParams: w.filters ? { filters: w.filters } : undefined,
    axisMapping,
  };
}

/* Dashboard tab model */
interface Tab { id: string; label: string }

/* Chart type dropdown */
const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
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

/* Widget card */
function WidgetCard({ widget, onRemove, onChartTypeChange }: {
  widget: DashWidget;
  onRemove: () => void;
  onChartTypeChange: (t: ChartType) => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-background overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
      {/* Card header */}
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
            title="삭제"
            className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Chart preview */}
      <div className="p-3 h-56">
        <WidgetRenderer widget={toWidgetConfig(widget)} />
      </div>
    </div>
  );
}

/* Right-side asset panel */
function RightPanel({ onAddWidget }: {
  onAddWidget: (title: string, datasetId: string, chartType: ChartType, filters?: FilterParam[], vizSettings?: VizSettings) => void;
}) {
  const { questions } = useSavedQuestions();
  const [search, setSearch] = React.useState("");

  const savedQs = questions.filter(
    (q) => q.datasetId && (!search || q.title.toLowerCase().includes(search.toLowerCase()))
  );
  const catalogItems = dataCatalog.filter(
    (d) => !search || d.label.toLowerCase().includes(search.toLowerCase())
  );

  function defaultChart(datasetId: string): ChartType {
    const ds = dataCatalog.find((d) => d.id === datasetId);
    const def = ds?.defaultChart ?? "bar";
    if (["kpi", "gauge", "scatter"].includes(def)) return "bar";
    return def as ChartType;
  }

  return (
    <div className="w-72 shrink-0 border-l border-border bg-background flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3 shrink-0">
        <Link
          to="/questions/new"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          새 질문
        </Link>
        <Link
          to="/questions/new"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          SQL 편집기
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        {savedQs.length > 0 && (
          <div className="mb-2">
            <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Saved Questions
            </p>
            {savedQs.map((q) => {
              const ds = dataCatalog.find((d) => d.id === q.datasetId);
              const chartType =
                q.visualization.type === "line" ||
                q.visualization.type === "bar" ||
                q.visualization.type === "pie"
                  ? q.visualization.type
                  : defaultChart(q.datasetId!);
              return (
                <button
                  key={q.id}
                  onClick={() => onAddWidget(q.title, q.datasetId!, chartType)}
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

        <div className="mt-1">
          <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            Data Catalog
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

/* Main editor */
export function DashboardEditorClient() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuto = searchParams.get("auto") === "1";
  const initialName = searchParams.get("name") ?? "New Dashboard";
  const { saveDashboard, library, hydrated: libHydrated } = useDashboardLibrary();
  const [saveToast, setSaveToast] = React.useState(false);

  const [dashboardName, setDashboardName] = React.useState(initialName);
  const [editingName, setEditingName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(initialName);
  const [tabs, setTabs] = React.useState<Tab[]>([{ id: "tab-1", label: "Tab 1" }]);
  const [activeTab, setActiveTab] = React.useState("tab-1");
  const [rightPanelOpen, setRightPanelOpen] = React.useState(false);
  const [editingTabId, setEditingTabId] = React.useState<string | null>(null);
  const [tabNameInput, setTabNameInput] = React.useState("");

  // Widgets grouped by tab id.
  const [tabWidgets, setTabWidgets] = React.useState<Record<string, DashWidget[]>>(
    { "tab-1": [] }
  );
  const [loaded, setLoaded] = React.useState(false);

  // Widgets for the active tab.
  const widgets = tabWidgets[activeTab] ?? [];

  // Restore an existing dashboard once the library is hydrated.
  React.useEffect(() => {
    if (!libHydrated || loaded) return;

    // Restore an auto-generated dashboard when one is queued.
    if (isAuto) {
      const autoConfig = consumeAutoDashboard();
      if (autoConfig?.widgets?.length) {
        setTabWidgets({
          "tab-1": autoConfig.widgets.map((w) => ({
            id: w.id,
            title: w.title,
            datasetId: w.datasetId,
            chartType: w.chartType,
          })),
        });
        setLoaded(true);
        return;
      }
    }

    const existing = library.find((d) => d.name === initialName);
    if (existing) {
      if (existing.tabData?.length) {
        // Restore multi-tab dashboards.
        const restoredTabs = existing.tabData.map((t) => ({ id: t.id, label: t.label }));
        const restoredWidgets: Record<string, DashWidget[]> = {};
        existing.tabData.forEach((t) => {
          restoredWidgets[t.id] = t.widgets.map((w) => ({
            id: w.id, title: w.title, datasetId: w.datasetId, chartType: w.chartType,
            filters: w.queryParams?.filters,
            axisMapping: w.axisMapping,
          }));
        });
        setTabs(restoredTabs);
        setActiveTab(restoredTabs[0].id);
        setTabWidgets(restoredWidgets);
      } else if (existing.widgets?.length) {
        // Backward compatibility for single-tab saved dashboards.
        setTabWidgets({
          "tab-1": existing.widgets.map((w) => ({
            id: w.id, title: w.title, datasetId: w.datasetId, chartType: w.chartType,
            filters: w.queryParams?.filters, axisMapping: w.axisMapping,
          })),
        });
      }
    }
    setLoaded(true);
  }, [libHydrated, library, initialName, loaded, isAuto]);

  const nameInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const handleNameSave = () => {
    if (nameInput.trim()) setDashboardName(nameInput.trim());
    setEditingName(false);
  };

  const addTab = () => {
    const newId = `tab-${Date.now()}`;
    const t: Tab = { id: newId, label: `Tab ${tabs.length + 1}` };
    setTabs((p) => [...p, t]);
    setTabWidgets((prev) => ({ ...prev, [newId]: [] }));
    setActiveTab(newId);
  };

  const handleAddWidget = (title: string, datasetId: string, chartType: ChartType, filters?: FilterParam[], vizSettings?: VizSettings) => {
    const axisMapping: AxisMapping | undefined =
      vizSettings?.xKey || vizSettings?.yKey
        ? { x: vizSettings.xKey || undefined, y: vizSettings.yKey ? [vizSettings.yKey] : [] }
        : undefined;
    setTabWidgets((prev) => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] ?? []), { id: generateId(), title, datasetId, chartType, filters, vizSettings, axisMapping }],
    }));
    setRightPanelOpen(false);
  };

  /** Remove a widget from the active tab. */
  const removeWidget = (id: string) => {
    setTabWidgets((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] ?? []).filter((w) => w.id !== id),
    }));
  };

  /** Update chart type for a widget in the active tab. */
  const updateChartType = (id: string, chartType: ChartType) => {
    setTabWidgets((prev) => ({
      ...prev,
      [activeTab]: (prev[activeTab] ?? []).map((w) => w.id === id ? { ...w, chartType } : w),
    }));
  };

  /** Enter tab-name edit mode. */
  const startEditingTab = (tab: Tab) => {
    setEditingTabId(tab.id);
    setTabNameInput(tab.label);
  };

  /** Persist tab-name edits. */
  const handleTabNameSave = () => {
    if (editingTabId && tabNameInput.trim()) {
      setTabs((prev) => prev.map((t) => t.id === editingTabId ? { ...t, label: tabNameInput.trim() } : t));
    }
    setEditingTabId(null);
  };

  const isEmpty = widgets.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 bg-background">

      {/* Save toast */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background shadow-lg px-4 py-2.5 text-sm font-medium animate-in slide-in-from-top-2">
          <Check className="h-4 w-4 text-green-500" />
          Dashboard saved.
        </div>
      )}

      {/* Top toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 bg-background">
        {/* Dashboard title */}
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

        {/* Toolbar actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setRightPanelOpen((p) => !p)}
            title="위젯 추가"
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

          {/* Cancel */}
          <button
            onClick={() => window.history.back()}
            className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>

          {/* Save */}
          <button
            onClick={() => {
              const tabData = tabs.map((t) => ({
                id: t.id,
                label: t.label,
                widgets: (tabWidgets[t.id] ?? []).map((w) => toWidgetConfig(w)),
              }));
              const allWidgets = tabData.flatMap((t) => t.widgets);
              const dashboard = {
                name: dashboardName,
                widgets: allWidgets,
                savedAt: new Date().toISOString(),
                tabData,
              };
              saveDashboard(dashboard);

              setSaveToast(true);
              setTimeout(() => {
                setSaveToast(false);
                navigate("/dashboards");
              }, 1200);
            }}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center px-6 border-b border-border shrink-0 bg-background">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onDoubleClick={() => startEditingTab(tab)}
            className={cn(
              "flex items-center gap-1 px-1 py-2.5 mr-1 border-b-2 -mb-px cursor-pointer transition-colors group/tab",
              activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {editingTabId === tab.id ? (
              <input
                autoFocus
                value={tabNameInput}
                onChange={(e) => setTabNameInput(e.target.value)}
                onBlur={handleTabNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTabNameSave();
                  if (e.key === "Escape") setEditingTabId(null);
                }}
                className="text-sm font-medium bg-transparent border-b border-primary outline-none w-24 px-1"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium px-1">{tab.label}</span>
                <Pencil className="h-3 w-3 opacity-0 group-hover/tab:opacity-100 transition-opacity" />
              </div>
            )}
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

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Canvas */}
        <div className={cn("flex-1 overflow-y-auto", isEmpty ? "flex items-center justify-center bg-muted/10" : "p-6 bg-muted/5")}>
          {isEmpty ? (
            /* Empty state */
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
                  새 질문을 만들거나 저장된 질문을 추가해 보세요.
                </p>
                <p className="text-sm text-muted-foreground">
                  차트, 테이블, 텍스트 위젯을 조합해 대시보드를 구성할 수 있습니다.{" "}
                  <button className="text-primary hover:underline">위젯 추가</button>
                  로 바로 시작할 수 있습니다.
                </p>
              </div>
              <button
                onClick={() => setRightPanelOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition-colors"
              >
                Add Widget
              </button>
            </div>
          ) : (
            /* Widget grid */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-min">
              {widgets.map((w) => (
                <WidgetCard
                  key={w.id}
                  widget={w}
                  onRemove={() => removeWidget(w.id)}
                  onChartTypeChange={(t) => updateChartType(w.id, t)}
                />
              ))}
              {/* Add widget card */}
              <button
                onClick={() => setRightPanelOpen(true)}
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[240px] text-muted-foreground hover:text-primary group"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-current group-hover:border-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">Add Widget</span>
              </button>
            </div>
          )}
        </div>

        {/* Right panel */}
        {rightPanelOpen && (
          <div className="animate-in slide-in-from-right duration-200">
            <RightPanel onAddWidget={handleAddWidget} />
          </div>
        )}
      </div>
    </div>
  );
}



