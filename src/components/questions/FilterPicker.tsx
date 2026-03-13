"use client";

import * as React from "react";
import { ChevronLeft, ChevronDown, Calendar, Hash, Type, X, Search, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnMeta } from "@/types/dataset";
import type { FilterParam, FilterOperator } from "@/types/query";

/* ── 타입 아이콘 ── */
function TypeIcon({ type }: { type: string }) {
  const cls = "h-3.5 w-3.5";
  if (type === "date") return <Calendar className={cls} />;
  if (type === "number") return <Hash className={cls} />;
  return <Type className={cls} />;
}

/* ── 연산자 정의 ── */
type OpDef = { value: FilterOperator; label: string; noValue?: boolean };

const STRING_OPS: OpDef[] = [
  { value: "eq",          label: "같음" },
  { value: "neq",         label: "같지 않음" },
  { value: "contains",    label: "포함함" },
  { value: "not_contains",label: "포함하지 않음" },
  { value: "starts",      label: "시작함" },
  { value: "ends",        label: "끝남" },
  { value: "empty",       label: "비어 있음",      noValue: true },
  { value: "not_empty",   label: "비어 있지 않음", noValue: true },
];

const NUMBER_OPS: OpDef[] = [
  { value: "eq",       label: "=" },
  { value: "neq",      label: "≠" },
  { value: "gte",      label: "이상 (≥)" },
  { value: "lte",      label: "이하 (≤)" },
  { value: "between",  label: "범위" },
  { value: "empty",    label: "비어 있음",      noValue: true },
  { value: "not_empty",label: "비어 있지 않음", noValue: true },
];

const DATE_OPS: OpDef[] = [
  { value: "eq",       label: "=" },
  { value: "neq",      label: "≠" },
  { value: "gte",      label: "이후 (≥)" },
  { value: "lte",      label: "이전 (≤)" },
  { value: "between",  label: "기간" },
  { value: "empty",    label: "비어 있음",      noValue: true },
  { value: "not_empty",label: "비어 있지 않음", noValue: true },
];

function getOperators(type: string): OpDef[] {
  if (type === "number") return NUMBER_OPS;
  if (type === "date") return DATE_OPS;
  return STRING_OPS;
}

/* ── 연산자 드롭다운 ── */
function OperatorDropdown({ value, options, onChange }: {
  value: FilterOperator;
  options: OpDef[];
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
        <div className="absolute right-0 top-full mt-1 z-[60] w-44 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-100">
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

/* ── 문자열 피커 ── */
function StringFilterPicker({ operator, value, onChange, onAdd }: {
  operator: FilterOperator; value: string;
  onChange: (v: string) => void; onAdd: () => void;
}) {
  const noValue = operator === "empty" || operator === "not_empty";
  if (noValue) return null;
  return (
    <div className="relative">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
        placeholder="값 입력..."
        className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 pr-8"
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

/* ── 숫자 피커 ── */
function NumberFilterPicker({ operator, value, value2, onChange, onChange2, onAdd }: {
  operator: FilterOperator; value: string; value2: string;
  onChange: (v: string) => void; onChange2: (v: string) => void; onAdd: () => void;
}) {
  const noValue = operator === "empty" || operator === "not_empty";
  if (noValue) return null;

  if (operator === "between") {
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus type="number"
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="최솟값"
          className="flex-1 rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <span className="text-xs text-muted-foreground shrink-0">~</span>
        <input
          type="number"
          value={value2} onChange={(e) => onChange2(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
          placeholder="최댓값"
          className="flex-1 rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    );
  }

  return (
    <input
      autoFocus type="number"
      value={value} onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
      placeholder="숫자 입력..."
      className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}

/* ── 날짜 피커 ── */
function DateFilterPicker({ operator, value, value2, onChange, onChange2, onAdd }: {
  operator: FilterOperator; value: string; value2: string;
  onChange: (v: string) => void; onChange2: (v: string) => void; onAdd: () => void;
}) {
  const noValue = operator === "empty" || operator === "not_empty";
  if (noValue) return null;

  if (operator === "between") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8 shrink-0">시작</span>
          <input
            autoFocus type="date"
            value={value} onChange={(e) => onChange(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8 shrink-0">종료</span>
          <input
            type="date"
            value={value2} onChange={(e) => onChange2(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
            className="flex-1 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>
    );
  }

  return (
    <input
      autoFocus type="date"
      value={value} onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
      className="w-full rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  );
}

/* ── Props ── */
interface FilterPickerProps {
  datasetLabel: string;
  columns: ColumnMeta[];
  onAdd: (filter: FilterParam) => void;
  onClose: () => void;
  /** 수정 모드: 기존 필터 전달 */
  editFilter?: FilterParam;
}

type Phase = "column" | "condition";

/* ── 메인 컴포넌트 ── */
export function FilterPicker({ datasetLabel, columns, onAdd, onClose, editFilter }: FilterPickerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [phase, setPhase] = React.useState<Phase>(editFilter ? "condition" : "column");
  const [selectedCol, setSelectedCol] = React.useState<ColumnMeta | null>(
    editFilter ? (columns.find((c) => c.key === editFilter.column) ?? null) : null
  );
  const [operator, setOperator] = React.useState<FilterOperator>(editFilter?.operator ?? "eq");
  const [value, setValue] = React.useState(String(editFilter?.value ?? ""));
  const [value2, setValue2] = React.useState(String(editFilter?.value2 ?? ""));
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
    setValue2("");
    setPhase("condition");
  };

  const handleOperatorChange = (op: FilterOperator) => {
    setOperator(op);
    setValue("");
    setValue2("");
  };

  const currentOps = getOperators(selectedCol?.type ?? "string");
  const currentOpDef = currentOps.find((o) => o.value === operator);
  const noValue = !!currentOpDef?.noValue;

  const isValid = () => {
    if (!selectedCol) return false;
    if (noValue) return true;
    if (operator === "between") return value.trim() !== "" && value2.trim() !== "";
    return value.trim() !== "";
  };

  const handleAdd = () => {
    if (!selectedCol || !isValid()) return;
    const param: FilterParam = {
      column: selectedCol.key,
      operator,
      value: noValue ? "" : value.trim(),
    };
    if (operator === "between") param.value2 = value2.trim();
    onAdd(param);
    onClose();
  };

  const colType = selectedCol?.type ?? "string";

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 w-80 rounded-xl border border-border bg-background shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {phase === "column" ? (
        /* ── Phase 1: 컬럼 선택 ── */
        <>
          <div className="px-3 pt-3 pb-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="컬럼 검색..."
                className="w-full rounded-lg border border-input bg-muted/30 pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">{datasetLabel}</span>
          </div>

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
                  <span className="flex-1 text-foreground group-hover:text-primary transition-colors">{col.label}</span>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">{col.type}</span>
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        /* ── Phase 2: 조건 설정 (타입별 피커) ── */
        <>
          {/* 헤더 */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <button
              onClick={() => setPhase("column")}
              className="flex items-center gap-0.5 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              {selectedCol?.label}
            </button>
            <div className="flex-1" />
            <OperatorDropdown value={operator} options={currentOps} onChange={handleOperatorChange} />
          </div>

          {/* 타입별 값 입력 */}
          <div className="px-4 py-3">
            {colType === "number" && (
              <NumberFilterPicker
                operator={operator} value={value} value2={value2}
                onChange={setValue} onChange2={setValue2} onAdd={handleAdd}
              />
            )}
            {colType === "date" && (
              <DateFilterPicker
                operator={operator} value={value} value2={value2}
                onChange={setValue} onChange2={setValue2} onAdd={handleAdd}
              />
            )}
            {colType === "string" && (
              <StringFilterPicker
                operator={operator} value={value}
                onChange={setValue} onAdd={handleAdd}
              />
            )}
            {noValue && <div className="py-1 text-sm text-muted-foreground text-center">값 입력 불필요</div>}
          </div>

          {/* 추가 버튼 */}
          <div className="flex justify-end gap-2 px-4 pb-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAdd}
              disabled={!isValid()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {editFilter ? "필터 수정" : "필터 추가"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
