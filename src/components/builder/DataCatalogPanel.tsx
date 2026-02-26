"use client";

import * as React from "react";
import { Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, CATEGORY_ORDER, categoryMeta } from "@/lib/data-catalog";
import { DatasetMeta } from "@/types/builder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface DataCatalogPanelProps {
  addedIds: string[];
  onAdd: (dataset: DatasetMeta) => void;
}

export function DataCatalogPanel({ addedIds, onAdd }: DataCatalogPanelProps) {
  const [openCategories, setOpenCategories] = React.useState<Set<string>>(
    new Set(CATEGORY_ORDER)
  );

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(Array.from(prev));
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    meta: categoryMeta[cat],
    items: dataCatalog.filter((d) => d.category === cat),
  }));

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 border-b px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold">데이터 카탈로그</p>
            <p className="text-xs text-muted-foreground">지표를 선택해 캔버스에 추가</p>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="py-2">
            {grouped.map(({ cat, meta, items }) => (
              <div key={cat}>
                {/* Category header */}
                <button
                  className="flex w-full items-center gap-2 px-4 py-2 hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCategory(cat)}
                >
                  {openCategories.has(cat) ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className={cn("text-xs font-semibold", meta.color)}>
                    {meta.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </button>

                {/* Dataset items */}
                {openCategories.has(cat) && (
                  <div className="pb-1">
                    {items.map((dataset) => {
                      const isAdded = addedIds.includes(dataset.id);
                      return (
                        <Tooltip key={dataset.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "group flex items-center gap-2 px-4 py-2 mx-2 rounded-lg cursor-pointer transition-colors",
                                isAdded
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-muted"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {dataset.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {dataset.compatibleCharts
                                    .slice(0, 3)
                                    .join(" · ")}
                                </p>
                              </div>
                              <Button
                                variant={isAdded ? "secondary" : "ghost"}
                                size="icon"
                                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => !isAdded && onAdd(dataset)}
                                disabled={isAdded}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-44">
                            <p className="font-medium">{dataset.label}</p>
                            <p className="text-xs opacity-80">{dataset.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </TooltipProvider>
  );
}
