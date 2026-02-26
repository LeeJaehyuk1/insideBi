"use client";

import * as React from "react";
import { Save, RotateCcw, Eye, EyeOff, PanelLeftClose, PanelLeft } from "lucide-react";
import { WidgetConfig, SavedDashboard, DatasetMeta } from "@/types/builder";
import { DataCatalogPanel } from "@/components/builder/DataCatalogPanel";
import { WidgetCanvas } from "@/components/builder/WidgetCanvas";
import { DashboardPreview } from "@/components/builder/DashboardPreview";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function BuilderClient() {
  const [widgets, setWidgets] = React.useState<WidgetConfig[]>([]);
  const [dashboardName, setDashboardName] = React.useState("나의 대시보드");
  const [savedDashboard, setSavedDashboard] = React.useState<SavedDashboard | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [catalogOpen, setCatalogOpen] = React.useState(true);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const addedIds = widgets.map((w) => w.datasetId);

  const handleAdd = (dataset: DatasetMeta) => {
    const newWidget: WidgetConfig = {
      id: generateId(),
      datasetId: dataset.id,
      chartType: dataset.defaultChart,
      title: dataset.label,
      colSpan: 1,
    };
    setWidgets((prev) => [...prev, newWidget]);
  };

  const handleSave = () => {
    const dashboard: SavedDashboard = {
      name: dashboardName,
      widgets,
      savedAt: new Date().toISOString(),
    };
    setSavedDashboard(dashboard);
    setShowPreview(true);
    setTimeout(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleReset = () => {
    setWidgets([]);
    setSavedDashboard(null);
    setShowPreview(false);
  };

  return (
    <div className="flex flex-col gap-0">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 rounded-xl border bg-background px-4 py-2.5 mb-4">
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
          onChange={(e) => setDashboardName(e.target.value)}
          className="w-48 rounded-md bg-transparent text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-ring px-2 py-1"
          placeholder="대시보드 이름"
        />

        <span className="text-xs text-muted-foreground">위젯 {widgets.length}개</span>

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
          <Button variant="outline" size="sm" onClick={handleReset} disabled={widgets.length === 0}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            초기화
          </Button>
          <Button size="sm" onClick={handleSave} disabled={widgets.length === 0}>
            <Save className="h-4 w-4 mr-1.5" />
            저장
          </Button>
        </div>
      </div>

      {/* ── Body: Catalog + Canvas ── */}
      <div className="flex gap-4 items-start">
        {/* Left: Data Catalog */}
        <div
          className={cn(
            "shrink-0 transition-all duration-200 overflow-hidden rounded-xl border bg-background",
            catalogOpen ? "w-52" : "w-0 border-0"
          )}
          style={{ height: "calc(100vh - 200px)" }}
        >
          <div className="w-52 flex flex-col h-full overflow-hidden">
            <DataCatalogPanel addedIds={addedIds} onAdd={handleAdd} />
          </div>
        </div>

        {/* Right: Canvas */}
        <div className="flex-1 min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-muted-foreground">캔버스</h2>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              드래그로 순서 변경 · ← → 로 너비 조절 · ⚙ 로 차트 타입 변경
            </span>
          </div>
          <WidgetCanvas widgets={widgets} onWidgetsChange={setWidgets} />
        </div>
      </div>

      {/* ── Preview ── */}
      {showPreview && savedDashboard && (
        <div ref={previewRef} className="mt-8 rounded-xl border bg-background p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-1 w-8 rounded-full bg-primary" />
            <h2 className="text-sm font-semibold">저장된 대시보드 미리보기</h2>
          </div>
          <DashboardPreview dashboard={savedDashboard} />
        </div>
      )}
    </div>
  );
}
