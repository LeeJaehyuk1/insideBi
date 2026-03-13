"use client";

import * as React from "react";
import { X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterParam, FilterOperator } from "@/types/query";
import type { ColumnMeta } from "@/types/dataset";
import { FilterPicker } from "./FilterPicker";

const OPERATOR_LABEL: Record<FilterOperator, string> = {
  eq: "=", neq: "≠",
  contains: "포함", not_contains: "미포함",
  starts: "시작", ends: "끝남",
  empty: "비어있음", not_empty: "비어있지않음",
  gte: "≥", lte: "≤",
  between: "범위",
};

interface FilterPanelProps {
  filters: FilterParam[];
  columns: ColumnMeta[];
  tableLabel: string;
  onUpdate: (index: number, filter: FilterParam) => void;
  onRemove: (index: number) => void;
  onAdd: (filter: FilterParam) => void;
}

export function FilterPanel({ filters, columns, tableLabel, onUpdate, onRemove, onAdd }: FilterPanelProps) {
  const [editIndex, setEditIndex] = React.useState<number | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);

  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 bg-primary/5 border-b border-primary/10">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary shrink-0">
        <Filter className="h-3.5 w-3.5" />
        필터
      </div>

      {filters.map((f, idx) => {
        const col = columns.find((c) => c.key === f.column);
        const label = col?.label ?? f.column;
        const opLabel = OPERATOR_LABEL[f.operator] ?? f.operator;
        const valueStr = f.operator === "empty" || f.operator === "not_empty"
          ? ""
          : f.operator === "between"
            ? `${f.value} ~ ${f.value2}`
            : String(f.value);

        return (
          <div key={idx} className="relative">
            <button
              onClick={() => setEditIndex(editIndex === idx ? null : idx)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                editIndex === idx
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/30 bg-background text-foreground hover:border-primary/60 hover:bg-primary/5"
              )}
            >
              <span className="font-semibold">{label}</span>
              <span className="text-muted-foreground">{opLabel}</span>
              {valueStr && <span>{valueStr}</span>}
            </button>

            {/* 수정 팝오버 */}
            {editIndex === idx && (
              <FilterPicker
                datasetLabel={tableLabel}
                columns={columns}
                editFilter={f}
                onAdd={(updated) => {
                  onUpdate(idx, updated);
                  setEditIndex(null);
                }}
                onClose={() => setEditIndex(null)}
              />
            )}

            {/* 삭제 버튼 */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        );
      })}

      {/* 필터 추가 */}
      <div className="relative">
        <button
          onClick={() => setAddOpen((p) => !p)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/30 px-3 py-1 text-xs text-muted-foreground hover:border-primary/60 hover:text-primary transition-colors"
        >
          + 필터 추가
        </button>
        {addOpen && (
          <FilterPicker
            datasetLabel={tableLabel}
            columns={columns}
            onAdd={(f) => { onAdd(f); setAddOpen(false); }}
            onClose={() => setAddOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
