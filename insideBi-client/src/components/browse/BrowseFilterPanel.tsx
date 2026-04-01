
import * as React from "react";
import { Plus, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FilterParam, FilterOperator } from "@/types/query";
import type { DatasetSchema } from "@/types/dataset";

function getOperators(type: string): { value: FilterOperator; label: string }[] {
  if (type === "string") {
    return [
      { value: "eq", label: "=" },
      { value: "contains", label: "포함" },
    ];
  }
  return [
    { value: "eq", label: "=" },
    { value: "gte", label: "≥" },
    { value: "lte", label: "≤" },
  ];
}

interface BrowseFilterPanelProps {
  schema: DatasetSchema;
  filters: FilterParam[];
  onChange: (filters: FilterParam[]) => void;
}

export function BrowseFilterPanel({ schema, filters, onChange }: BrowseFilterPanelProps) {
  const filterableColumns = schema.columns.filter((c) => c.filterable);

  const addFilter = () => {
    if (filterableColumns.length === 0) return;
    const col = filterableColumns[0];
    onChange([
      ...filters,
      { column: col.key, operator: "eq", value: "" },
    ]);
  };

  const updateFilter = (idx: number, partial: Partial<FilterParam>) => {
    onChange(filters.map((f, i) => (i === idx ? { ...f, ...partial } : f)));
  };

  const removeFilter = (idx: number) => {
    onChange(filters.filter((_, i) => i !== idx));
  };

  if (filterableColumns.length === 0) return null;

  return (
    <div className="mb-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">필터</span>
          {filters.length > 0 && (
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {filters.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={addFilter}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          필터 추가
        </Button>
      </div>

      {filters.length === 0 && (
        <p className="text-xs text-muted-foreground">필터 추가 버튼으로 데이터를 좁혀보세요</p>
      )}

      {filters.map((f, idx) => {
        const col = schema.columns.find((c) => c.key === f.column);
        const operators = getOperators(col?.type ?? "string");
        return (
          <div key={idx} className="flex items-center gap-2 flex-wrap">
            {/* 컬럼 선택 */}
            <select
              value={f.column}
              onChange={(e) => {
                const newCol = schema.columns.find((c) => c.key === e.target.value);
                const ops = getOperators(newCol?.type ?? "string");
                updateFilter(idx, { column: e.target.value, operator: ops[0].value, value: "" });
              }}
              className="flex-1 min-w-[120px] rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {filterableColumns.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            {/* 연산자 */}
            <select
              value={f.operator}
              onChange={(e) => updateFilter(idx, { operator: e.target.value as FilterOperator })}
              className="rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {operators.map((op) => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>

            {/* 값 */}
            <input
              value={f.value}
              onChange={(e) => updateFilter(idx, { value: e.target.value })}
              placeholder="값 입력"
              className="flex-1 min-w-[100px] rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />

            <button
              onClick={() => removeFilter(idx)}
              className="rounded p-1 hover:bg-muted transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
