"use client";

import * as React from "react";
import { ChevronLeft, ChevronDown, Calendar, Hash, Percent, Type, X, Search, LayoutGrid } from "lucide-react";
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

/* ── 연산자 전체 목록 ── */
const ALL_OPERATORS: { value: FilterOperator; label: string; noValue?: boolean }[] = [
  { value: "eq",          label: "같음" },
  { value: "neq",         label: "같지 않음" },
  { value: "contains",    label: "포함함" },
  { value: "not_contains",label: "포함하지 않음" },
  { value: "starts",      label: "시작함" },
  { value: "ends",        label: "끝남" },
  { value: "empty",       label: "비어 있음",       noValue: true },
  { value: "not_empty",   label: "비어 있지 않음",  noValue: true },
  { value: "gte",         label: "이상 (≥)" },
  { value: "lte",         label: "이하 (≤)" },
];

function getOperators(type: string) {
  if (type === "number" || type === "currency" || type === "percent") {
    return ALL_OPERATORS.filter((o) =>
      ["eq","neq","gte","lte","empty","not_empty"].includes(o.value)
    );
  }
  if (type === "date") {
    return ALL_OPERATORS.filter((o) =>
      ["eq","neq","gte","lte","empty","not_empty"].includes(o.value)
    );
  }
  // string
  return ALL_OPERATORS.filter((o) =>
    ["eq","neq","contains","not_contains","starts","ends","empty","not_empty"].includes(o.value)
  );
}

/* ── 커스텀 연산자 드롭다운 (스크린샷처럼 목록 펼침) ── */
function OperatorDropdown({ value, options, onChange }: {
  value: FilterOperator;
  options: typeof ALL_OPERATORS;
  onChange: (v: FilterOperator) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 rounded-lg border border-border bg-background pl-3 pr-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
      >
        {current?.label}
        <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-[60] w-40 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-100">
          <div className="py-1">
            {options.map((op) => (
              <button
                key={op.value}
                onClick={() => { onChange(op.value); setOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm transition-colors",
                  value === op.value ? "text-primary font-medium bg-primary/5" : "text-foreground hover:bg-muted"
                )}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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
  const [search, setSearch] = React.useState("");

  /* 외부 클릭 닫기 */
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filterable = columns.filter((c) => c.filterable);
  const searched = search.trim()
    ? filterable.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()))
    : filterable;

  const handleSelectColumn = (col: ColumnMeta) => {
    setSelectedCol(col);
    const ops = getOperators(col.type);
    setOperator(ops[0].value);
    setValue("");
    setPhase("condition");
  };

  const currentOps = getOperators(selectedCol?.type ?? "string");
  const currentOpDef = currentOps.find((o) => o.value === operator);
  const noValue = !!currentOpDef?.noValue;

  const handleAdd = () => {
    if (!selectedCol) return;
    if (!noValue && String(value).trim() === "") return;
    onAdd({ column: selectedCol.key, operator, value: noValue ? "" : String(value).trim() });
    onClose();
  };

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 w-80 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {phase === "column" ? (
        /* ── Phase 1: 컬럼 선택 ── */
        <>
          {/* 검색 */}
          <div className="px-3 pt-3 pb-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="찾기..."
                className="w-full rounded-lg border border-input bg-muted/30 pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* 테이블명 헤더 */}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-primary" />
              <span>{datasetLabel}</span>
            </div>
            <ChevronDown className={cn("h-4 w-4 transition-transform text-muted-foreground", collapsed && "rotate-180")} />
          </button>

          {/* 컬럼 목록 */}
          {!collapsed && (
            <div className="max-h-64 overflow-y-auto pb-1">
              {searched.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  {search ? `"${search}"에 해당하는 컬럼이 없습니다` : "필터 가능한 컬럼이 없습니다"}
                </p>
              ) : (
                searched.map((col) => (
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
          {/* 헤더: 뒤로 + 컬럼명 + 연산자 드롭다운 */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <button
              onClick={() => setPhase("column")}
              className="flex items-center gap-0.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {selectedCol?.label}
            </button>
            <div className="flex-1" />
            <OperatorDropdown
              value={operator}
              options={currentOps}
              onChange={setOperator}
            />
          </div>

          {/* 값 입력 (noValue 연산자는 숨김) */}
          {!noValue && (
            <div className="px-4 py-3">
              <div className="relative">
                <input
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") onClose(); }}
                  placeholder={`${selectedCol?.label} 로 검색하거나 ID를 입력하세요`}
                  className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background pr-8"
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
          )}
          {noValue && <div className="py-3" />}

          {/* 필터 추가 버튼 */}
          <div className="flex justify-end px-4 pb-3">
            <button
              onClick={handleAdd}
              disabled={!noValue && !String(value).trim()}
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
