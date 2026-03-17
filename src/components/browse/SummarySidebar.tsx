"use client";

import * as React from "react";
import { X, Search, Plus, Trash2, Hash, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export type AggFunc = "count" | "sum" | "avg" | "min" | "max";
export type AggItem = { func: AggFunc; column: string };

interface SummarySidebarProps {
  tableLabel: string;
  columns: string[];
  columnLabels?: Record<string, string>;
  numericColumns: string[];
  aggregations: AggItem[];
  breakouts: string[];
  onAggChange: (aggs: AggItem[]) => void;
  onBreakoutChange: (breakouts: string[]) => void;
  onClose: () => void;
}

const AGG_LABELS: Record<AggFunc, string> = {
  count: "카운트",
  sum: "합계",
  avg: "평균",
  min: "최솟값",
  max: "최댓값",
};

export function SummarySidebar({
  tableLabel,
  columns,
  columnLabels,
  numericColumns,
  aggregations,
  breakouts,
  onAggChange,
  onBreakoutChange,
  onClose,
}: SummarySidebarProps) {
  const [search, setSearch] = React.useState("");
  const [showAggPicker, setShowAggPicker] = React.useState(false);
  const [pendingFunc, setPendingFunc] = React.useState<AggFunc | null>(null);

  const getLabel = (key: string) => columnLabels?.[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const filteredColumns = columns.filter((c) =>
    getLabel(c).toLowerCase().includes(search.toLowerCase())
  );

  const addAgg = (func: AggFunc, column: string = "") => {
    onAggChange([...aggregations, { func, column }]);
    setShowAggPicker(false);
    setPendingFunc(null);
  };

  const removeAgg = (index: number) => {
    onAggChange(aggregations.filter((_, i) => i !== index));
  };

  const toggleBreakout = (column: string) => {
    if (breakouts.includes(column)) {
      onBreakoutChange(breakouts.filter((b) => b !== column));
    } else {
      onBreakoutChange([...breakouts, column]);
    }
  };

  const handleFuncClick = (f: AggFunc) => {
    if (f === "count") {
      addAgg(f);
    } else {
      setPendingFunc(f);
    }
  };

  const selectableCols = pendingFunc && pendingFunc !== "count" ? numericColumns : columns;
  const breakoutSelectable = breakouts.filter(c => selectableCols.includes(c));
  const otherSelectable = columns.filter(c => selectableCols.includes(c) && !breakouts.includes(c));

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full shadow-xl animate-in slide-in-from-right duration-300">
      <div className="flex-1 overflow-y-auto p-5 space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
            요약하다
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            {aggregations.map((agg, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold group"
              >
                <span>
                  {agg.func === "count"
                    ? "카운트"
                    : `${AGG_LABELS[agg.func]}(${getLabel(agg.column)})`}
                </span>
                <button
                  onClick={() => removeAgg(i)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAggPicker(!showAggPicker);
                  setPendingFunc(null);
                }}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
              
              {showAggPicker && (
                <div className="absolute left-0 top-full mt-2 z-50 w-56 bg-background border border-border rounded-lg shadow-xl p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                  {!pendingFunc ? (
                    (["count", "sum", "avg", "min", "max"] as AggFunc[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => handleFuncClick(f)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-md transition-colors flex items-center justify-between group"
                      >
                        <span>{AGG_LABELS[f]}</span>
                        {f !== "count" && <Plus className="h-3 w-3 opacity-0 group-hover:opacity-40" />}
                      </button>
                    ))
                  ) : (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase border-b border-border/50 mb-1 flex items-center justify-between">
                        <span>{AGG_LABELS[pendingFunc]} 대상 선택</span>
                        <button onClick={() => setPendingFunc(null)} className="hover:text-foreground">뒤로</button>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {breakoutSelectable.length > 0 && (
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-md mb-1">
                            {breakoutSelectable.map(col => (
                              <button
                                key={col}
                                onClick={() => addAgg(pendingFunc, col)}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-md transition-colors flex items-center gap-2"
                              >
                                <Hash className="h-3 w-3" />
                                <span className="font-semibold">{getLabel(col)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {otherSelectable.map((col) => (
                          <button
                            key={col}
                            onClick={() => addAgg(pendingFunc, col)}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-md transition-colors"
                          >
                            {getLabel(col)}
                          </button>
                        ))}
                        {selectableCols.length === 0 && (
                          <p className="text-[10px] text-center text-muted-foreground py-4 italic">선택 가능한 숫자형 컬럼이 없습니다</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {(aggregations.length > 0 || breakouts.length > 0) && <section className="space-y-4">
          <h3 className="text-sm font-bold text-foreground">그룹화 기준</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="찾기..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">
              {tableLabel}
            </p>
            {filteredColumns.map((col) => {
              const isSelected = breakouts.includes(col);
              return (
                <button
                  key={col}
                  onClick={() => toggleBreakout(col)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all",
                    isSelected
                      ? "bg-emerald-500 text-white font-semibold shadow-md shadow-emerald-500/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="opacity-60">
                      {col.toLowerCase().includes("date") || col.toLowerCase().includes("no") || col.toLowerCase().includes("cd") || col.toLowerCase().includes("code") ? (
                        <Hash className="h-3.5 w-3.5" />
                      ) : (
                        <Type className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span>{getLabel(col)}</span>
                  </div>
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBreakout(col);
                      }}
                      className="hover:bg-white/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </button>
              );
            })}
          </div>
        </section>}
      </div>

      <div className="p-5 border-t border-border bg-background">
        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
        >
          완료
        </button>
      </div>
    </div>
  );
}
