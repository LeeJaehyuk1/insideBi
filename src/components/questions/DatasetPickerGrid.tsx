"use client";

import * as React from "react";
import { Database, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, categoryMeta, CATEGORY_ORDER } from "@/lib/data-catalog";

const CATEGORY_STYLE: Record<string, {
  label: string;
  text: string;
  iconBg: string;
  iconText: string;
  cardBg: string;
  cardBorder: string;
  cardHover: string;
}> = {
  credit: {
    label: "신용리스크",
    text: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900",
    iconText: "text-blue-600 dark:text-blue-400",
    cardBg: "bg-white dark:bg-card",
    cardBorder: "border-gray-200 dark:border-border",
    cardHover: "hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md",
  },
  market: {
    label: "시장리스크",
    text: "text-violet-600 dark:text-violet-400",
    iconBg: "bg-violet-100 dark:bg-violet-900",
    iconText: "text-violet-600 dark:text-violet-400",
    cardBg: "bg-white dark:bg-card",
    cardBorder: "border-gray-200 dark:border-border",
    cardHover: "hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-md",
  },
  liquidity: {
    label: "유동성리스크",
    text: "text-teal-600 dark:text-teal-400",
    iconBg: "bg-teal-100 dark:bg-teal-900",
    iconText: "text-teal-600 dark:text-teal-400",
    cardBg: "bg-white dark:bg-card",
    cardBorder: "border-gray-200 dark:border-border",
    cardHover: "hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md",
  },
  ncr: {
    label: "NCR리스크",
    text: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-100 dark:bg-emerald-900",
    iconText: "text-emerald-600 dark:text-emerald-400",
    cardBg: "bg-white dark:bg-card",
    cardBorder: "border-gray-200 dark:border-border",
    cardHover: "hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md",
  },
};

interface DatasetPickerGridProps {
  onSelect: (datasetId: string) => void;
  selected?: string;
}

export function DatasetPickerGrid({ onSelect, selected }: DatasetPickerGridProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    meta: categoryMeta[cat as keyof typeof categoryMeta],
    style: CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.credit,
    datasets: dataCatalog.filter((d) => d.category === cat),
  })).filter((g) => g.datasets.length > 0);

  return (
    <div className="space-y-8">
      {grouped.map(({ cat, style, datasets }) => (
        <div key={cat}>
          {/* 카테고리 헤더 */}
          <h3 className={cn("text-sm font-bold mb-3", style.text)}>
            {style.label}
          </h3>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {datasets.map((ds) => {
              const isSelected = selected === ds.id;
              return (
                <button
                  key={ds.id}
                  onClick={() => onSelect(ds.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-all",
                    style.cardBg,
                    isSelected
                      ? "border-primary ring-2 ring-primary/20 shadow-sm"
                      : cn(style.cardBorder, style.cardHover)
                  )}
                >
                  {/* DB 아이콘 */}
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                    isSelected ? "bg-primary/10" : style.iconBg
                  )}>
                    <Database className={cn("h-4.5 w-4.5", isSelected ? "text-primary" : style.iconText)} />
                  </div>

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-semibold truncate",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {ds.label}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {ds.description}
                    </p>
                  </div>

                  {/* 화살표 */}
                  <ChevronRight className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground/50"
                  )} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
