"use client";

import * as React from "react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { LayoutGrid, Trash2 } from "lucide-react";
import { WidgetConfig, ChartType, ColSpan } from "@/types/builder";
import { WidgetCard } from "./WidgetCard";
import { cn } from "@/lib/utils";

interface WidgetCanvasProps {
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
}

export function WidgetCanvas({ widgets, onWidgetsChange }: WidgetCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = widgets.findIndex((w) => w.id === active.id);
      const newIdx = widgets.findIndex((w) => w.id === over.id);
      onWidgetsChange(arrayMove(widgets, oldIdx, newIdx));
    }
  };

  const handleRemove = (id: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== id));
  };

  const handleChangeChartType = (id: string, type: ChartType) => {
    onWidgetsChange(widgets.map((w) => (w.id === id ? { ...w, chartType: type } : w)));
  };

  const handleChangeColSpan = (id: string, span: ColSpan) => {
    onWidgetsChange(widgets.map((w) => (w.id === id ? { ...w, colSpan: span } : w)));
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-4 auto-rows-min">
          {widgets.map((widget) => (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onRemove={handleRemove}
              onChangeChartType={handleChangeChartType}
              onChangeColSpan={handleChangeColSpan}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
