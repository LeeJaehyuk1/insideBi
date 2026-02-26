"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { WidgetConfig, ChartType, ColSpan } from "@/types/builder";
import { getDataset, chartTypeLabels } from "@/lib/data-catalog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WidgetRenderer } from "./WidgetRenderer";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WidgetCardProps {
  widget: WidgetConfig;
  onRemove: (id: string) => void;
  onChangeChartType: (id: string, type: ChartType) => void;
  onChangeColSpan: (id: string, span: ColSpan) => void;
  isPreview?: boolean;
}

export function WidgetCard({
  widget, onRemove, onChangeChartType, onChangeColSpan, isPreview = false,
}: WidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.id });

  const dataset = getDataset(widget.datasetId);

  const style = {
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

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn("overflow-hidden", isDragging && "ring-2 ring-primary")}>
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
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={spanCycleDown} disabled={widget.colSpan <= 1}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-[10px] text-muted-foreground w-4 text-center">{widget.colSpan}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={spanCycleUp} disabled={widget.colSpan >= 3}>
                <ChevronRight className="h-3 w-3" />
              </Button>

              {/* Chart type selector */}
              {dataset && dataset.compatibleCharts.length > 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Settings2 className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel className="text-xs">차트 타입</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {dataset.compatibleCharts.map((ct) => (
                      <DropdownMenuItem
                        key={ct}
                        className={cn("text-xs", widget.chartType === ct && "bg-accent")}
                        onClick={() => onChangeChartType(widget.id, ct)}
                      >
                        {chartTypeLabels[ct] ?? ct}
                        {widget.chartType === ct && " ✓"}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

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
    </div>
  );
}
