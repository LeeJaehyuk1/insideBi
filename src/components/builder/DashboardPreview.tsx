"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SavedDashboard, WidgetConfig, ChartType, ColSpan } from "@/types/builder";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { WidgetRenderer } from "./WidgetRenderer";

interface PreviewWidgetProps {
  widget: WidgetConfig;
}

function PreviewWidget({ widget }: PreviewWidgetProps) {
  return (
    <div style={{ gridColumn: `span ${widget.colSpan}` }}>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center py-2 px-3 space-y-0 border-b bg-muted/30">
          <span className="text-xs font-semibold">{widget.title}</span>
        </CardHeader>
        <CardContent className="p-0">
          <WidgetRenderer widget={widget} />
        </CardContent>
      </Card>
    </div>
  );
}

interface DashboardPreviewProps {
  dashboard: SavedDashboard;
}

export function DashboardPreview({ dashboard }: DashboardPreviewProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">{dashboard.name}</h3>
          <p className="text-xs text-muted-foreground">
            저장: {new Date(dashboard.savedAt).toLocaleString("ko-KR")} · 위젯 {dashboard.widgets.length}개
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 auto-rows-min">
        {dashboard.widgets.map((widget) => (
          <PreviewWidget key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
}
