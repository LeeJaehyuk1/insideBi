"use client";

import * as React from "react";
import {
  Save, RotateCcw, Eye, EyeOff,
  PanelLeftClose, PanelLeft, CheckCircle2, Lock,
} from "lucide-react";
import { WidgetConfig, SavedDashboard, DatasetMeta, GlobalFilter } from "@/types/builder";
import { DataCatalogPanel } from "@/components/builder/DataCatalogPanel";
import { GridWidgetCanvas, GridItemLayout } from "@/components/builder/GridWidgetCanvas";
import { DashboardPreview } from "@/components/builder/DashboardPreview";
import { FilterBar, FilterState, DEFAULT_FILTER } from "@/components/builder/FilterBar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useDashboardPersist } from "@/hooks/useDashboardPersist";
import { useRole, can, getRoleInfo } from "@/context/RoleContext";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

/** Convert FilterState → globalFilter stored on each WidgetConfig */
function filterToGlobalFilter(filter: FilterState): GlobalFilter {
  return {
    dateRange: filter.dateRange,
    department: filter.department,
  };
}

export function BuilderClient() {
  const {
    hydrated,
    widgets, setWidgets,
    dashboardName, setDashboardName,
    savedDashboard, setSavedDashboard,
    layouts, setLayouts,
    clearPersist,
  } = useDashboardPersist();

  const [showPreview, setShowPreview] = React.useState(false);
  const [catalogOpen, setCatalogOpen] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterState>(DEFAULT_FILTER);
  const [saveToast, setSaveToast] = React.useState<"saved" | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const { role } = useRole();
  const roleInfo = getRoleInfo(role);
  const canEdit = can.editDashboard(role);
  const canSave = can.saveDashboard(role);
  const canReset = can.resetDashboard(role);
  const canAddCatalog = can.addCatalog(role);

  const addedIds = widgets.map((w) => w.datasetId);

  /** 현재 layouts에서 가장 아래 행 번호를 구함 */
  function getNextY(currentLayouts: Record<string, GridItemLayout>): number {
    return Object.values(currentLayouts).reduce(
      (acc, item) => Math.max(acc, item.y + item.h),
      0
    );
  }

  const DEFAULT_W = 3; // 추가 시 기본 너비 (3컬럼 전체)
  const DEFAULT_H = 1; // 추가 시 기본 높이 (1행)

  const handleAdd = (dataset: DatasetMeta) => {
    const newId = generateId();
    const newWidget: WidgetConfig = {
      id: newId,
      datasetId: dataset.id,
      chartType: dataset.defaultChart,
      title: dataset.label,
      colSpan: DEFAULT_W as 1 | 2 | 3,
      globalFilter: filterToGlobalFilter(filter),
    };

    // 새 위젯의 레이아웃을 즉시 등록 → react-grid-layout compaction 방지
    setLayouts((prev) => {
      const nextY = getNextY(prev);
      return {
        ...prev,
        [newId]: { i: newId, x: 0, y: nextY, w: DEFAULT_W, h: DEFAULT_H },
      };
    });

    setWidgets((prev) => [...prev, newWidget]);
  };


  // Propagate global filter changes to all widgets
  const handleFilterChange = (next: FilterState) => {
    setFilter(next);
    setWidgets((prev) =>
      prev.map((w) => ({ ...w, globalFilter: filterToGlobalFilter(next) }))
    );
  };

  const handleSave = () => {
    const dashboard: SavedDashboard = {
      name: dashboardName,
      widgets,
      savedAt: new Date().toISOString(),
    };
    setSavedDashboard(dashboard);
    setShowPreview(true);
    setSaveToast("saved");
    setTimeout(() => setSaveToast(null), 2500);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleReset = () => {
    setWidgets([]);
    setSavedDashboard(null);
    setShowPreview(false);
    setLayouts({});
    setFilter(DEFAULT_FILTER);
    clearPersist();
  };

  const handleLayoutChange = (newLayouts: Record<string, GridItemLayout>) => {
    setLayouts(newLayouts);
  };

  // While loading from localStorage, show a subtle skeleton
  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm animate-pulse">
        대시보드 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 relative">
      {/* ── 뷰어 모드 배너 ── */}
      {!canEdit && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-2.5 mb-3">
          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            <span className="font-bold">{roleInfo.label} 모드</span> — 읽기 전용입니다. 편집하려면 상단에서 역할을 변경하세요.
          </p>
        </div>
      )}
      {/* ── Save Toast ── */}
      {saveToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg border bg-background shadow-lg px-4 py-2.5 animate-in slide-in-from-top-2 duration-200 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          대시보드가 저장되었습니다
        </div>
      )}

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-2.5 mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setCatalogOpen((p) => !p)}
          title={catalogOpen ? "카탈로그 숨기기" : "카탈로그 보기"}
        >
          {catalogOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </Button>

        <Separator orientation="vertical" className="h-5" />

        <input
          value={dashboardName}
          onChange={(e) => canEdit && setDashboardName(e.target.value)}
          readOnly={!canEdit}
          className={cn(
            "w-48 rounded-md bg-transparent text-sm font-semibold focus:outline-none px-2 py-1",
            canEdit
              ? "focus:ring-1 focus:ring-ring"
              : "cursor-not-allowed opacity-60"
          )}
          placeholder="대시보드 이름"
        />

        {/* localStorage 저장 상태 indicator */}
        {widgets.length > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            자동저장됨
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {savedDashboard && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPreview((p) => !p);
                if (!showPreview) {
                  setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
              }}
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
              미리보기
            </Button>
          )}
          {canReset && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={widgets.length === 0}>
              <RotateCcw className="h-4 w-4 mr-1.5" />
              초기화
            </Button>
          )}
          {canSave && (
            <Button size="sm" onClick={handleSave} disabled={widgets.length === 0}>
              <Save className="h-4 w-4 mr-1.5" />
              저장
            </Button>
          )}
        </div>
      </div>

      {/* ── Global FilterBar ── */}
      {widgets.length > 0 && (
        <div className="rounded-xl border bg-background px-4 py-2.5 mb-3">
          <FilterBar
            filter={filter}
            onChange={handleFilterChange}
            widgetCount={widgets.length}
          />
        </div>
      )}

      {/* ── Body: Catalog + Canvas ── */}
      <div className="flex gap-4 items-start">
        {/* Left: Data Catalog */}
        <div
          className={cn(
            "shrink-0 transition-all duration-200 overflow-hidden rounded-xl border bg-background",
            catalogOpen ? "w-52" : "w-0 border-0"
          )}
          style={{ height: "calc(100vh - 240px)" }}
        >
          <div className="w-52 flex flex-col h-full overflow-hidden">
            <DataCatalogPanel
              addedIds={addedIds}
              onAdd={canEdit ? handleAdd : () => { }}
              readonly={!canEdit}
              canAddCatalog={canAddCatalog}
            />
          </div>
        </div>

        {/* Right: Canvas */}
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">캔버스</h2>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              드래그로 자유 배치 · 우측 하단 모서리로 크기 조절 · ⚙ 로 차트 설정
            </span>
          </div>
          <GridWidgetCanvas
            widgets={widgets}
            layouts={layouts}
            onWidgetsChange={setWidgets}
            onLayoutChange={handleLayoutChange}
          />
        </div>
      </div>

      {/* ── Preview ── */}
      {showPreview && savedDashboard && (
        <div ref={previewRef} className="mt-8 rounded-xl border bg-background p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 w-8 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold">저장된 대시보드 미리보기</h2>
            <span className="text-xs text-muted-foreground ml-2">
              저장: {new Date(savedDashboard.savedAt).toLocaleString("ko-KR")}
            </span>
          </div>
          <DashboardPreview dashboard={savedDashboard} />
        </div>
      )}
    </div>
  );
}
