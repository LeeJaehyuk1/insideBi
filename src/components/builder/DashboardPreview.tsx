"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { SavedDashboard } from "@/types/builder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WidgetRenderer } from "./WidgetRenderer";
import { GridItemLayout } from "./GridWidgetCanvas";

// react-grid-layout SSR 미지원 → dynamic import
const GridLayout = dynamic<any>(
  () => import("react-grid-layout").then((m) => m.default),
  { ssr: false }
);

const COLS = 3;
const ROW_HEIGHT = 280;

interface DashboardPreviewProps {
  dashboard: SavedDashboard;
  hideHeader?: boolean;
}

export function DashboardPreview({ dashboard, hideHeader }: DashboardPreviewProps) {
  const layouts = dashboard.layouts ?? {};
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(900);

  React.useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // 저장된 레이아웃을 그대로 배열로 변환
  const layoutItems: GridItemLayout[] = dashboard.widgets.map((w, idx) => {
    if (layouts[w.id]) return layouts[w.id];
    // 레이아웃 없는 경우 기본값 (순서대로 1칸씩)
    return { i: w.id, x: idx % COLS, y: Math.floor(idx / COLS), w: 1, h: 1 };
  });

  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">{dashboard.name}</h3>
            <p className="text-xs text-muted-foreground">
              저장: {new Date(dashboard.savedAt).toLocaleString("ko-KR")} · 위젯 {dashboard.widgets.length}개
            </p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full">
        <GridLayout
          layout={layoutItems}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          width={containerWidth}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={false}
          isResizable={false}
          compactType={null}
          useCSSTransforms={true}
        >
          {dashboard.widgets.map((widget) => (
            <div key={widget.id} className="h-full">
              <Card className="overflow-hidden h-full">
                <CardHeader className="flex-row items-center py-2 px-3 space-y-0 border-b bg-muted/30">
                  <span className="text-xs font-semibold">{widget.title}</span>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-40px)]">
                  <WidgetRenderer widget={widget} />
                </CardContent>
              </Card>
            </div>
          ))}
        </GridLayout>
      </div>
    </div>
  );
}
