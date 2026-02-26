"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LayoutGrid } from "lucide-react";
import { WidgetConfig, ColSpan } from "@/types/builder";
import { WidgetCard } from "./WidgetCard";

// react-grid-layout은 SSR 미지원이므로 dynamic import
const GridLayout = dynamic<any>(
    () => import("react-grid-layout").then((m) => m.default),
    { ssr: false }
);

export interface GridItemLayout {
    i: string;   // widget id
    x: number;
    y: number;
    w: number;   // 1~3 (out of 3 cols)
    h: number;   // row height units
}

interface GridWidgetCanvasProps {
    widgets: WidgetConfig[];
    layouts: Record<string, GridItemLayout>;
    onWidgetsChange: (widgets: WidgetConfig[]) => void;
    onLayoutChange: (layouts: Record<string, GridItemLayout>) => void;
}

const COLS = 3;
const ROW_HEIGHT = 280; // px per grid row

function buildDefaultLayouts(
    widgets: WidgetConfig[],
    existing: Record<string, GridItemLayout>
): GridItemLayout[] {
    // 이미 배치된 위젯들의 최대 y+h 값을 구해 새 위젯의 시작 row를 결정
    const maxBottom = Object.values(existing).reduce(
        (acc, item) => Math.max(acc, item.y + item.h),
        0
    );

    // 새 위젯 전용 커서 (기존 레이아웃 아래부터 시작)
    let curX = 0;
    let curY = maxBottom;

    return widgets.map((w) => {
        // 이미 레이아웃이 저장되어 있으면 그대로 사용
        if (existing[w.id]) return existing[w.id];

        // 새 위젯: 항상 기본 크기(w:1, h:1)로 맨 아래에 순서대로 배치
        const DEFAULT_W = 1;
        const DEFAULT_H = 1;

        if (curX + DEFAULT_W > COLS) {
            curX = 0;
            curY += DEFAULT_H;
        }
        const item: GridItemLayout = { i: w.id, x: curX, y: curY, w: DEFAULT_W, h: DEFAULT_H };
        curX += DEFAULT_W;
        return item;
    });
}

export function GridWidgetCanvas({
    widgets,
    layouts,
    onWidgetsChange,
    onLayoutChange,
}: GridWidgetCanvasProps) {
    const [containerWidth, setContainerWidth] = React.useState(900);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const obs = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width;
            if (w) setContainerWidth(w);
        });
        if (containerRef.current) obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    const layoutItems = buildDefaultLayouts(widgets, layouts);

    const handleDragStop = (...args: unknown[]) => {
        const newItem = args[2] as GridItemLayout | null;
        if (!newItem) return;
        onLayoutChange({ ...layouts, [newItem.i]: newItem });
    };

    const handleResizeStop = (...args: unknown[]) => {
        const newItem = args[2] as GridItemLayout | null;
        if (!newItem) return;
        // Sync colSpan with grid width
        const wId = newItem.i;
        const clamped = Math.max(1, Math.min(COLS, newItem.w)) as ColSpan;
        onWidgetsChange(
            widgets.map((w) => (w.id === wId ? { ...w, colSpan: clamped } : w))
        );
        onLayoutChange({ ...layouts, [newItem.i]: { ...newItem, w: clamped } });
    };

    const handleRemove = (id: string) => {
        onWidgetsChange(widgets.filter((w) => w.id !== id));
        const next = { ...layouts };
        delete next[id];
        onLayoutChange(next);
    };

    const handleUpdateWidget = (id: string, updates: Partial<WidgetConfig>) => {
        onWidgetsChange(widgets.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    };

    const handleChangeColSpan = (id: string, span: ColSpan) => {
        onWidgetsChange(widgets.map((w) => (w.id === id ? { ...w, colSpan: span } : w)));
        const cur = layouts[id];
        if (cur) onLayoutChange({ ...layouts, [id]: { ...cur, w: span } });
    };

    if (widgets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[320px] text-center gap-3 text-muted-foreground border-2 border-dashed rounded-xl">
                <LayoutGrid className="h-10 w-10 opacity-30" />
                <div>
                    <p className="text-sm font-medium">캔버스가 비어 있습니다</p>
                    <p className="text-xs opacity-70 mt-1">좌측 카탈로그에서 + 버튼으로 지표를 추가하세요</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full">
            <GridLayout
                layout={layoutItems}
                cols={COLS}
                rowHeight={ROW_HEIGHT}
                width={containerWidth}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                draggableHandle=".drag-handle"
                isResizable={true}
                resizeHandles={["se"]}
                compactType={null}
                preventCollision={true}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
                useCSSTransforms={true}
            >
                {widgets.map((widget) => (
                    <div key={widget.id} className="h-full">
                        <WidgetCardGridWrapper
                            widget={widget}
                            onRemove={handleRemove}
                            onUpdateWidget={handleUpdateWidget}
                            onChangeColSpan={handleChangeColSpan}
                        />
                    </div>
                ))}
            </GridLayout>
        </div>
    );
}

/** Wrapper that exposes .drag-handle for react-grid-layout */
function WidgetCardGridWrapper({
    widget,
    onRemove,
    onUpdateWidget,
    onChangeColSpan,
}: {
    widget: WidgetConfig;
    onRemove: (id: string) => void;
    onUpdateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
    onChangeColSpan: (id: string, span: ColSpan) => void;
}) {
    return (
        <div className="h-full">
            <WidgetCard
                widget={widget}
                onRemove={onRemove}
                onUpdateWidget={onUpdateWidget}
                onChangeColSpan={onChangeColSpan}
                isGridMode={true}
            />
        </div>
    );
}
