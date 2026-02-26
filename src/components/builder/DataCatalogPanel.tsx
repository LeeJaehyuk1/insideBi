"use client";

import * as React from "react";
import { Plus, ChevronDown, ChevronRight, Trash2, Code2, FileSpreadsheet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog, CATEGORY_ORDER, categoryMeta } from "@/lib/data-catalog";
import { DatasetMeta } from "@/types/builder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { AddDataCatalogModal, ParsedExcelData } from "@/components/builder/AddDataCatalogModal";
import {
  loadCustomCatalog,
  addToCustomCatalog,
  removeFromCustomCatalog,
  CustomDatasetEntry,
} from "@/lib/custom-catalog-store";

interface DataCatalogPanelProps {
  addedIds: string[];
  onAdd: (dataset: DatasetMeta) => void;
}

const CUSTOM_CATEGORY_META = {
  label: "사용자 정의",
  color: "text-purple-600 dark:text-purple-400",
};

export function DataCatalogPanel({ addedIds, onAdd }: DataCatalogPanelProps) {
  const [openCategories, setOpenCategories] = React.useState<Set<string>>(
    new Set([...CATEGORY_ORDER, "custom"])
  );
  const [modalOpen, setModalOpen] = React.useState(false);
  const [customEntries, setCustomEntries] = React.useState<CustomDatasetEntry[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // localStorage hydration
  React.useEffect(() => {
    setCustomEntries(loadCustomCatalog());
    setHydrated(true);
  }, []);

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

  const handleModalAdd = (
    dataset: DatasetMeta,
    sourceType: "sql" | "excel",
    query?: string,
    excelData?: ParsedExcelData
  ) => {
    const entry: CustomDatasetEntry = {
      dataset,
      sourceType,
      query,
      excelData,
      createdAt: new Date().toISOString(),
    };
    const next = addToCustomCatalog(entry);
    setCustomEntries(next);
  };

  const handleRemoveCustom = (e: React.MouseEvent, datasetId: string) => {
    e.stopPropagation();
    const next = removeFromCustomCatalog(datasetId);
    setCustomEntries(next);
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-hidden">
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center gap-2 border-b px-4 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold">데이터 카탈로그</p>
            <p className="text-xs text-muted-foreground">지표를 선택해 캔버스에 추가</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-primary hover:bg-primary/10"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">새 데이터셋 추가</TooltipContent>
          </Tooltip>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="py-2">
            {/* ── 기존 카탈로그 ── */}
            {grouped.map(({ cat, meta, items }) => (
              <div key={cat}>
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
                                <p className="text-xs font-medium truncate">{dataset.label}</p>
                                <p className="text-[10px] text-muted-foreground truncate">
                                  {dataset.compatibleCharts.slice(0, 3).join(" · ")}
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

            {/* ── 커스텀 데이터셋 섹션 ── */}
            {hydrated && (
              <div>
                {/* 구분선 */}
                <div className="mx-4 my-1.5 border-t border-dashed" />

                <button
                  className="flex w-full items-center gap-2 px-4 py-2 hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCategory("custom")}
                >
                  {openCategories.has("custom") ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <Sparkles className="h-3 w-3 text-purple-500" />
                  <span className={cn("text-xs font-semibold", CUSTOM_CATEGORY_META.color)}>
                    {CUSTOM_CATEGORY_META.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {customEntries.length}
                  </span>
                </button>

                {openCategories.has("custom") && (
                  <div className="pb-1">
                    {customEntries.length === 0 ? (
                      /* Empty state */
                      <button
                        onClick={() => setModalOpen(true)}
                        className="mx-2 flex w-[calc(100%-16px)] flex-col items-center gap-1.5 rounded-lg border border-dashed border-purple-300/50 px-3 py-4 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-150"
                      >
                        <Plus className="h-5 w-5 text-purple-400" />
                        <p className="text-[10px] text-muted-foreground text-center">
                          새 데이터셋을 추가하세요
                        </p>
                      </button>
                    ) : (
                      customEntries.map((entry) => {
                        const isAdded = addedIds.includes(entry.dataset.id);
                        const Icon = entry.sourceType === "sql" ? Code2 : FileSpreadsheet;
                        return (
                          <Tooltip key={entry.dataset.id}>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "group flex items-center gap-2 px-4 py-2 mx-2 rounded-lg cursor-pointer transition-colors",
                                  isAdded
                                    ? "bg-primary/10 text-primary"
                                    : "hover:bg-muted"
                                )}
                              >
                                <Icon className="h-3 w-3 shrink-0 text-purple-500" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{entry.dataset.label}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {entry.sourceType === "sql" ? "SQL" : "Excel/CSV"} ·{" "}
                                    {entry.excelData
                                      ? `${entry.excelData.columns.length}컬럼 ${entry.excelData.rows.length}행`
                                      : "쿼리 저장됨"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {/* Add to canvas */}
                                  <Button
                                    variant={isAdded ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => !isAdded && onAdd(entry.dataset)}
                                    disabled={isAdded}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                  {/* Delete */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => handleRemoveCustom(e, entry.dataset.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-52">
                              <p className="font-medium">{entry.dataset.label}</p>
                              <p className="text-xs opacity-80">{entry.dataset.description}</p>
                              {entry.sourceType === "sql" && entry.query && (
                                <pre className="mt-1.5 text-[9px] bg-black/20 rounded p-1 max-h-20 overflow-hidden font-mono opacity-70">
                                  {entry.query.slice(0, 120)}{entry.query.length > 120 ? "…" : ""}
                                </pre>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Add Modal ── */}
      <AddDataCatalogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={handleModalAdd}
      />
    </TooltipProvider>
  );
}
