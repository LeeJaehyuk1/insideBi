"use client";

import * as React from "react";
import { ChevronLeft, ChevronDown, Calendar, Hash, Percent, Type, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnMeta } from "@/types/dataset";
import type { FilterParam, FilterOperator } from "@/types/query";

/* ── 타입 아이콘 ── */
function TypeIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  if (type === "date") return <Calendar className={cls} />;
  if (type === "number" || type === "currency") return <Hash className={cls} />;
  if (type === "percent") return <Percent className={cls} />;
  return <Type className={cls} />;
}

/* ── 연산자 목록 ── */
function getOperators(type: string): { value: FilterOperator; label: string }[] {
  if (type === "date") return [
    { value: "eq", label: "같음" },
    { value: "gte", label: "이후 (≥)" },
    { value: "lte", label: "이전 (≤)" },
  ];
  if (type === "string") return [
    { value: "eq", label: "같음" },
    { value: "contains", label: "포함" },
  ];
  return [
    { value: "eq", label: "같음" },
    { value: "gte", label: "이상 (≥)" },
    { value: "lte", label: "이하 (≤)" },
  ];
}

/* ── Props ── */
interface FilterPickerProps {
  datasetLabel: string;
  columns: ColumnMeta[];
  onAdd: (filter: FilterParam) => void;
  onClose: () => void;
}

type Phase = "column" | "condition";

/* ── 메인 컴포넌트 ── */
export function FilterPicker({ datasetLabel, columns, onAdd, onClose }: FilterPickerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [phase, setPhase] = React.useState<Phase>("column");
  const [selectedCol, setSelectedCol] = React.useState<ColumnMeta | null>(null);
  const [operator, setOperator] = React.useState<FilterOperator>("eq");
  const [value, setValue] = React.useState("");
  const [collapsed, setCollapsed] = React.useState(false);

  /* 외부 클릭 닫기 */
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filterable = columns.filter((c) => c.filterable);

  const handleSelectColumn = (col: ColumnMeta) => {
    setSelectedCol(col);
    const ops = getOperators(col.type);
    setOperator(ops[0].value);
    setValue("");
    setPhase("condition");
  };

  const handleAdd = () => {
    if (!selectedCol || String(value).trim() === "") return;
    onAdd({ column: selectedCol.key, operator, value: String(value).trim() });
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 w-72 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {phase === "column" ? (
        /* ── Phase 1: 컬럼 선택 ── */
        <>
          {/* 헤더: 데이터셋명 + 접기 */}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="flex items-center justify-between w-full px-4 py-3 border-b border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors rounded-t-xl"
          >
            <span>{datasetLabel}</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform text-muted-foreground", collapsed && "rotate-180")}
            />
          </button>

          {/* 컬럼 목록 */}
          {!collapsed && (
            <div className="max-h-60 overflow-y-auto py-1">
              {filterable.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  필터 가능한 컬럼이 없습니다
                </p>
              ) : (
                filterable.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => handleSelectColumn(col)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-muted/60 transition-colors group"
                  >
                    <span className="flex h-5 w-5 items-center justify-center text-muted-foreground shrink-0">
                      <TypeIcon type={col.type} />
                    </span>
                    <span className="flex-1 text-foreground group-hover:text-primary transition-colors">
                      {col.label}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* 하단 고정 버튼 */}
          <div className="border-t border-border px-3 py-2.5">
            <div className="w-full rounded-lg bg-muted/60 px-4 py-2 text-sm text-muted-foreground text-center select-none">
              답변을 좁히기 위해 필터 더하기
            </div>
          </div>
        </>
      ) : (
        /* ── Phase 2: 조건 설정 ── */
        <>
          {/* 헤더: 뒤로가기 + 컬럼명 + 연산자 */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <button
              onClick={() => setPhase("column")}
              className="flex items-center gap-0.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {selectedCol?.label}
            </button>
            <div className="flex-1" />
            {/* 연산자 드롭다운 */}
            <div className="relative">
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as FilterOperator)}
                className="appearance-none rounded-lg border border-border bg-background pl-3 pr-6 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
              >
                {getOperators(selectedCol?.type ?? "string").map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          {/* 값 입력 */}
          <div className="px-4 py-3">
            <div className="relative">
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onClose(); }}
                placeholder={`${selectedCol?.label} 로 검색하거나 ID를 입력하세요`}
                className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background pr-8"
              />
              {value && (
                <button
                  onClick={() => setValue("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 필터 추가 버튼 */}
          <div className="flex justify-end px-4 pb-3">
            <button
              onClick={handleAdd}
              disabled={!String(value).trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              필터 추가
            </button>
          </div>
        </>
      )}
    </div>
  );
}
