"use client";

import * as React from "react";
import { Database, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, categoryMeta, CATEGORY_ORDER } from "@/lib/data-catalog";

const CATEGORY_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  credit:    { bg: "bg-blue-50 dark:bg-blue-950",     text: "text-blue-600 dark:text-blue-400",    border: "border-blue-200 dark:border-blue-800" },
  market:    { bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800" },
  liquidity: { bg: "bg-teal-50 dark:bg-teal-950",     text: "text-teal-600 dark:text-teal-400",    border: "border-teal-200 dark:border-teal-800" },
  ncr:       { bg: "bg-emerald-50 dark:bg-emerald-950", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800" },
};

interface DatasetPickerGridProps {
  onSelect: (datasetId: string) => void;
  selected?: string;
}

export function DatasetPickerGrid({ onSelect, selected }: DatasetPickerGridProps) {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    meta: categoryMeta[cat as keyof typeof categoryMeta],
    datasets: dataCatalog.filter((d) => d.category === cat),
  })).filter((g) => g.datasets.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map(({ cat, meta, datasets }) => {
        const style = CATEGORY_STYLE[cat] ?? CATEGORY_STYLE.credit;
        return (
          <div key={cat}>
            <h3 className={cn("text-xs font-bold uppercase tracking-widest mb-2", style.text)}>
              {meta?.label}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {datasets.map((ds) => (
                <button
                  key={ds.id}
                  onClick={() => onSelect(ds.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all hover:shadow-sm",
                    selected === ds.id
                      ? cn("border-primary bg-primary/5 shadow-sm")
                      : cn("hover:border-primary/50", style.bg, style.border)
                  )}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", style.bg)}>
                    <Database className={cn("h-4 w-4", style.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{ds.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{ds.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
