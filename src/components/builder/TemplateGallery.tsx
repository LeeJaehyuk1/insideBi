"use client";

import * as React from "react";
import { Layers, TrendingUp, CreditCard, BarChart2 } from "lucide-react";
import { SavedDashboard, WidgetConfig } from "@/types/builder";
import { Button } from "@/components/ui/button";

function makeWidget(id: string, datasetId: string, chartType: WidgetConfig["chartType"], title: string, colSpan: WidgetConfig["colSpan"]): WidgetConfig {
  return { id, datasetId, chartType, title, colSpan };
}

export const DASHBOARD_TEMPLATES: (Omit<SavedDashboard, "savedAt"> & { description: string; icon: React.ElementType })[] = [
  {
    name: "신용리스크 종합",
    description: "NPL 추이·신용등급·익스포저·PD/LGD/EAD 한눈에",
    icon: CreditCard,
    widgets: [
      makeWidget("t1-1", "npl-trend",     "area", "NPL 구성 추이",       2),
      makeWidget("t1-2", "pd-lgd-ead",    "kpi",  "PD / LGD / EAD",    1),
      makeWidget("t1-3", "credit-grades", "bar",  "신용등급 분포",        1),
      makeWidget("t1-4", "sector-exposure","pie", "업종별 익스포저",       2),
    ],
    layouts: {
      "t1-1": { i: "t1-1", x: 0, y: 0, w: 2, h: 1 },
      "t1-2": { i: "t1-2", x: 2, y: 0, w: 1, h: 1 },
      "t1-3": { i: "t1-3", x: 0, y: 1, w: 1, h: 1 },
      "t1-4": { i: "t1-4", x: 1, y: 1, w: 2, h: 1 },
    },
  },
  {
    name: "시장리스크 종합",
    description: "VaR 추이·요약 KPI·스트레스 시나리오 비교",
    icon: TrendingUp,
    widgets: [
      makeWidget("t2-1", "var-trend",         "line",  "VaR 추이",           2),
      makeWidget("t2-2", "var-summary",        "kpi",   "VaR 요약",           1),
      makeWidget("t2-3", "stress-scenarios",   "bar",   "스트레스 시나리오",   3),
    ],
    layouts: {
      "t2-1": { i: "t2-1", x: 0, y: 0, w: 2, h: 1 },
      "t2-2": { i: "t2-2", x: 2, y: 0, w: 1, h: 1 },
      "t2-3": { i: "t2-3", x: 0, y: 1, w: 3, h: 1 },
    },
  },
  {
    name: "경영진 요약",
    description: "NPL·VaR·LCR/NSFR 핵심 KPI 한 페이지 요약",
    icon: BarChart2,
    widgets: [
      makeWidget("t3-1", "npl-summary",    "kpi",   "NPL 요약",         1),
      makeWidget("t3-2", "var-summary",    "kpi",   "VaR 요약",         1),
      makeWidget("t3-3", "lcr-gauge",      "gauge", "LCR/NSFR 게이지",  1),
      makeWidget("t3-4", "lcr-nsfr-trend", "line",  "LCR/NSFR 추이",   3),
    ],
    layouts: {
      "t3-1": { i: "t3-1", x: 0, y: 0, w: 1, h: 1 },
      "t3-2": { i: "t3-2", x: 1, y: 0, w: 1, h: 1 },
      "t3-3": { i: "t3-3", x: 2, y: 0, w: 1, h: 1 },
      "t3-4": { i: "t3-4", x: 0, y: 1, w: 3, h: 1 },
    },
  },
];

interface TemplateGalleryProps {
  onLoadTemplate: (dashboard: SavedDashboard) => void;
}

export function TemplateGallery({ onLoadTemplate }: TemplateGalleryProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold">빠른 시작 템플릿</p>
        <p className="text-xs text-muted-foreground">선택하면 바로 대시보드를 구성합니다</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {DASHBOARD_TEMPLATES.map((tpl) => {
          const Icon = tpl.icon;
          return (
            <div
              key={tpl.name}
              className="rounded-xl border bg-card p-4 space-y-3 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground">위젯 {tpl.widgets.length}개</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{tpl.description}</p>
              <Button
                size="sm"
                className="w-full"
                onClick={() =>
                  onLoadTemplate({
                    ...tpl,
                    savedAt: new Date().toISOString(),
                  })
                }
              >
                사용하기
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
