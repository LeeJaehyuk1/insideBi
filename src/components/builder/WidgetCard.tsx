"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, ChevronLeft, ChevronRight, Settings2, TableProperties } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetConfig, ColSpan } from "@/types/builder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WidgetRenderer } from "./WidgetRenderer";
import { MappingPanel } from "./MappingPanel";
import { DrilldownTable } from "./DrilldownTable";

interface WidgetCardProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onUpdateWidget: (id: string, updates: Partial<WidgetConfig>) => void;
  onChangeColSpan: (id: string, span: ColSpan) => void;
  isPreview?: boolean;
  isGridMode?: boolean;  // react-grid-layout 내부에서 사용 시 dnd-kit transform 비활성화
}

export function WidgetCard({
  widget, onRemove, onUpdateWidget, onChangeColSpan, isPreview = false, isGridMode = false,
}: WidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id });

  const [drilldownOpen, setDrilldownOpen] = React.useState(false);

  // react-grid-layout 모드에서는 dnd-kit transform 무력화 (두 라이브러리 충돌 방지)
  const style = isGridMode ? {
    opacity: 1,
    height: "100%",
  } : {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    gridColumn: `span ${widget.colSpan}`,
  };

  const spanCycleUp = () => {
    const next = Math.min(widget.colSpan + 1, 3) as ColSpan;
    onChangeColSpan(widget.id, next);
  };
  const spanCycleDown = () => {
    const next = Math.max(widget.colSpan - 1, 1) as ColSpan;
    onChangeColSpan(widget.id, next);
  };

  const hasCustomMapping = !!(widget.axisMapping || widget.thresholds?.length);

  return (
    <div ref={isGridMode ? undefined : setNodeRef} style={style}>
      <Card className={cn("overflow-hidden h-full", !isGridMode && isDragging && "ring-2 ring-primary")}>
        <CardHeader className="flex-row items-center gap-2 py-2 px-3 space-y-0 border-b bg-muted/30">
          {/* Drag handle */}
          {!isPreview && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}

          {/* Title */}
          <span className="flex-1 text-xs font-semibold truncate">{widget.title}</span>

          {!isPreview && (
            <div className="flex items-center gap-0.5">
              {/* Col span controls */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={spanCycleDown}
                disabled={widget.colSpan <= 1}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-[10px] text-muted-foreground w-4 text-center">
                {widget.colSpan}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={spanCycleUp}
                disabled={widget.colSpan >= 3}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>

              {/* Drill-down toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-6 w-6",
                  drilldownOpen && "text-primary bg-primary/10"
                )}
                title="상세 데이터 보기"
                onClick={() => setDrilldownOpen((p) => !p)}
              >
                <TableProperties className="h-3.5 w-3.5" />
              </Button>

              {/* Mapping panel trigger */}
              <MappingPanel
                widget={widget}
                onUpdate={(updates) => onUpdateWidget(widget.id, updates)}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-6 w-6",
                      hasCustomMapping && "text-primary"
                    )}
                    title="위젯 설정"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                }
              />

              {/* Remove */}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(widget.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <WidgetRenderer widget={widget} />
        </CardContent>
      </Card>

      {/* Drill-down Table (outside card, below) */}
      {drilldownOpen && !isPreview && (
        <DrilldownTable
          widget={widget}
          onClose={() => setDrilldownOpen(false)}
        />
      )}
    </div>
  );
}
