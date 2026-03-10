"use client";

import * as React from "react";
import {
  Save, RotateCcw, Eye, EyeOff,
  PanelLeftClose, PanelLeft, CheckCircle2, Lock, BookOpen,
  Pencil, X as XIcon,
} from "lucide-react";
import { WidgetConfig, SavedDashboard, DatasetMeta, GlobalFilter, ColSpan } from "@/types/builder";
import { DataCatalogPanel } from "@/components/builder/DataCatalogPanel";
import { GridWidgetCanvas, GridItemLayout } from "@/components/builder/GridWidgetCanvas";
import { DashboardPreview } from "@/components/builder/DashboardPreview";
import { DashboardLibrary } from "@/components/builder/DashboardLibrary";
import { FilterBar, FilterState, DEFAULT_FILTER } from "@/components/builder/FilterBar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useDashboardPersist } from "@/hooks/useDashboardPersist";
import { useDashboardLibrary } from "@/hooks/useDashboardLibrary";
import { useMyDashboard } from "@/hooks/useMyDashboard";
import { useRole, can, getRoleInfo } from "@/context/RoleContext";
import { DefaultDashboard } from "@/components/dashboard/DefaultDashboard";
import { hydrateCustomDatasets } from "@/lib/custom-dataset-runtime";
import { TemplateGallery } from "@/components/builder/TemplateGallery";

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

  const { library, saveDashboard: saveToLibrary, deleteDashboard: deleteFromLibrary } = useDashboardLibrary();
  const { myDashboard, setMyDashboard, clearMyDashboard } = useMyDashboard();
  const [showPreview, setShowPreview] = React.useState(false);
  const [catalogOpen, setCatalogOpen] = React.useState(true);
  const [filter, setFilter] = React.useState<FilterState>(DEFAULT_FILTER);
  const [saveToast, setSaveToast] = React.useState<"saved" | null>(null);
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const previewRef = React.useRef<HTMLDivElement>(null);

  // 커스텀 데이터셋(Excel/SQL) 런타임 메모리에 로드
  React.useEffect(() => {
    hydrateCustomDatasets();
  }, []);

  // URL ?share= 파라미터로 공유된 대시보드 로드
  React.useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const share = params.get("share");
    if (!share) return;
    try {
      const dashboard: SavedDashboard = JSON.parse(decodeURIComponent(escape(atob(share))));
      setWidgets(dashboard.widgets ?? []);
      setDashboardName((dashboard.name ?? "공유 대시보드") + " (불러옴)");
      if (dashboard.layouts) setLayouts(dashboard.layouts);
      window.history.replaceState({}, "", "/builder");
    } catch { /* 잘못된 공유 링크 무시 */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // Normalize colSpan from layouts.w once after hydration (fixes stale localStorage data)
  React.useEffect(() => {
    if (!hydrated || Object.keys(layouts).length === 0) return;
    setWidgets((prev) =>
      prev.map((w) => {
        const lay = layouts[w.id];
        if (!lay) return w;
        const clamped = Math.max(1, Math.min(3, lay.w)) as ColSpan;
        return clamped !== w.colSpan ? { ...w, colSpan: clamped } : w;
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]); // run once after hydration

  const { role } = useRole();
  const roleInfo = getRoleInfo(role);
  const canEdit = can.editDashboard(role);
  const canSave = can.saveDashboard(role);
  const canReset = can.resetDashboard(role);
  const canAddCatalog = can.addCatalog(role);

  const addedIds = widgets.map((w) => w.datasetId);

  const DEFAULT_W = 1; // 추가 시 기본 너비 (1컬럼)
  const DEFAULT_H = 1; // 추가 시 기본 높이 (1행)

  /** 새 위젯을 배치할 최적 위치 반환 (옆 공간 우선, 없으면 새 행) */
  function findNextPosition(
    currentLayouts: Record<string, GridItemLayout>,
    newW: number
  ): { x: number; y: number } {
    const items = Object.values(currentLayouts);
    if (items.length === 0) return { x: 0, y: 0 };

    const maxBottom = items.reduce((acc, it) => Math.max(acc, it.y + it.h), 0);

    // 마지막 행 아이템들이 모두 h=DEFAULT_H이면 옆에 패킹 시도
    const lastRowItems = items.filter((it) => it.y + it.h === maxBottom);
    const allH1 = lastRowItems.every((it) => it.h === DEFAULT_H);
    if (allH1 && lastRowItems.length > 0) {
      const rightmostX = lastRowItems.reduce((acc, it) => Math.max(acc, it.x + it.w), 0);
      if (rightmostX + newW <= 3) {
        // 마지막 행의 시작 y = maxBottom - DEFAULT_H
        return { x: rightmostX, y: maxBottom - DEFAULT_H };
      }
    }

    // 공간 없으면 새 행
    return { x: 0, y: maxBottom };
  }

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
      const { x, y } = findNextPosition(prev, DEFAULT_W);
      return {
        ...prev,
        [newId]: { i: newId, x, y, w: DEFAULT_W, h: DEFAULT_H },
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
      layouts,
    };
    setSavedDashboard(dashboard);
    saveToLibrary(dashboard);
    setShowPreview(true);
    setSaveToast("saved");
    setTimeout(() => setSaveToast(null), 2500);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleLoadDashboard = (dashboard: SavedDashboard) => {
    setWidgets(dashboard.widgets);
    setDashboardName(dashboard.name);
    if (dashboard.layouts) setLayouts(dashboard.layouts);
    setLibraryOpen(false);
  };

  const handleReset = () => {
    setWidgets([]);
    setSavedDashboard(null);
    setShowPreview(false);
    setLayouts({});
    setFilter(DEFAULT_FILTER);
    clearPersist();
  };

  const handleLoadTemplate = (dashboard: SavedDashboard) => {
    setWidgets(dashboard.widgets);
    setDashboardName(dashboard.name);
    if (dashboard.layouts) setLayouts(dashboard.layouts);
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

      {/* ── Metabase-style Toolbar ── */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-2.5 mb-4 -mx-6 -mt-6 px-6">
        {/* 편집 모드: 카탈로그 토글 */}
        {isEditMode && (
          <>
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
          </>
        )}

        {/* 대시보드 이름 */}
        <input
          value={dashboardName}
          onChange={(e) => canEdit && isEditMode && setDashboardName(e.target.value)}
          readOnly={!canEdit || !isEditMode}
          className={cn(
            "min-w-0 max-w-xs rounded-md bg-transparent text-sm font-bold focus:outline-none px-2 py-1",
            isEditMode && canEdit
              ? "focus:ring-1 focus:ring-ring hover:bg-muted/50 cursor-text"
              : "cursor-default"
          )}
          placeholder="대시보드 이름"
        />

        {/* 자동저장 indicator — 편집 모드에서만 */}
        {isEditMode && widgets.length > 0 && (
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            자동저장됨
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* 라이브러리 */}
          <Button variant="ghost" size="sm" onClick={() => setLibraryOpen(true)}>
            <BookOpen className="h-4 w-4 mr-1" />
            라이브러리
          </Button>

          {/* 미리보기 (저장 후) */}
          {savedDashboard && !isEditMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPreview((p) => !p);
                if (!showPreview) setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
              }}
            >
              {showPreview ? <EyeOff className="h-4 w-4 mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />}
              미리보기
            </Button>
          )}

          {/* 편집 모드 전용 버튼 */}
          {isEditMode ? (
            <>
              {canReset && (
                <Button variant="ghost" size="sm" onClick={handleReset} disabled={widgets.length === 0}>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditMode(false)}
              >
                <XIcon className="h-4 w-4 mr-1.5" />
                편집 종료
              </Button>
            </>
          ) : (
            canEdit && (
              <Button
                size="sm"
                onClick={() => setIsEditMode(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                편집
              </Button>
            )
          )}
        </div>
      </div>

      {/* ── Global FilterBar (항상 표시, 편집 모드에서 변경 가능) ── */}
      {widgets.length > 0 && (
        <div className="rounded-lg border bg-card px-4 py-2.5 mb-4">
          <FilterBar
            filter={filter}
            onChange={isEditMode ? handleFilterChange : () => {}}
            widgetCount={widgets.length}
          />
        </div>
      )}

      {/* ── Body: Catalog + Canvas ── */}
      <div className="flex gap-4 items-start">
        {/* Left: Data Catalog — 편집 모드에서만 표시 */}
        {isEditMode && (
          <div
            className={cn(
              "shrink-0 transition-all duration-200 overflow-hidden rounded-lg border bg-card",
              catalogOpen ? "w-52" : "w-0 border-0"
            )}
            style={{ height: "calc(100vh - 260px)" }}
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
        )}

        {/* Right: Canvas or Default Dashboard */}
        <div className="flex-1 min-w-0">
          {widgets.length === 0 ? (
            <div className="space-y-6">
              <TemplateGallery onLoadTemplate={handleLoadTemplate} />
              {library.length === 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground px-2">또는 현황 보기</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <DefaultDashboard />
                </div>
              )}
            </div>
          ) : (
            <div>
              {isEditMode && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    드래그로 배치 이동 · 우측 하단 모서리로 크기 조절 · ⚙ 로 차트 설정
                  </span>
                </div>
              )}
              <GridWidgetCanvas
                widgets={widgets}
                layouts={layouts}
                onWidgetsChange={setWidgets}
                onLayoutChange={handleLayoutChange}
                isEditMode={isEditMode}
              />
            </div>
          )}
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

      <DashboardLibrary
        library={library}
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onLoad={handleLoadDashboard}
        onDelete={deleteFromLibrary}
        onSetHome={setMyDashboard}
        onClearHome={clearMyDashboard}
        homeName={myDashboard?.name ?? null}
      />
    </div>
  );
}
