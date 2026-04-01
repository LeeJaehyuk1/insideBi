
import * as React from "react";
import { ChevronLeft, ChevronDown, Calendar, Hash, Type, X, Search, LayoutGrid, Info } from "lucide-react";
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

interface FilterSidebarProps {
  tableLabel: string;
  columns: ColumnMeta[];
  onAdd: (filter: FilterParam) => void;
  onClose: () => void;
}

export function FilterSidebar({ tableLabel, columns, onAdd, onClose }: FilterSidebarProps) {
  const [phase, setPhase] = React.useState<"column" | "condition">("column");
  const [selectedCol, setSelectedCol] = React.useState<ColumnMeta | null>(null);
  const [operator, setOperator] = React.useState<FilterOperator>("eq");
  const [value, setValue] = React.useState("");
  const [value2, setValue2] = React.useState("");
  const [search, setSearch] = React.useState("");

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

  const handleAdd = () => {
    if (!selectedCol) return;
    const param: FilterParam = {
      column: selectedCol.key,
      operator,
      value: value.trim(),
    };
    if (operator === "between") param.value2 = value2.trim();
    onAdd(param);
    onClose();
  };

  const currentOps = getOperators(selectedCol?.type ?? "string");
  const currentOpDef = currentOps.find((o) => o.value === operator);
  const noValue = !!currentOpDef?.noValue;

  return (
    <div className="w-80 border-l border-border bg-background flex flex-col h-full shadow-xl animate-in slide-in-from-right duration-300">
      {phase === "column" ? (
        <>
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">필터 추가</h3>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="찾기..."
                className="w-full pl-9 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {tableLabel}
                </p>
              </div>
              {searched.map((col) => (
                <button
                  key={col.key}
                  onClick={() => handleSelectColumn(col)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-all group text-left"
                >
                  <span className="opacity-60 group-hover:opacity-100 transition-opacity">
                    <TypeIcon type={col.type} />
                  </span>
                  <span className="flex-1 truncate">{col.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="p-5 border-b border-border flex items-center gap-3">
            <button
              onClick={() => setPhase("column")}
              className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold text-foreground truncate">{selectedCol?.label}</h3>
            <div className="flex-1" />
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-6 flex-1">
            <div className="space-y-4">
              <div className="relative">
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value as FilterOperator)}
                  className="w-full appearance-none rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10 transition-all"
                >
                  {currentOps.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {!noValue && (
                <div className="relative">
                  {operator === "between" ? (
                    <div className="space-y-3">
                      <input
                        autoFocus
                        type={selectedCol?.type === "number" ? "number" : selectedCol?.type === "date" ? "date" : "text"}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="시작 값"
                        className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type={selectedCol?.type === "number" ? "number" : selectedCol?.type === "date" ? "date" : "text"}
                        value={value2}
                        onChange={(e) => setValue2(e.target.value)}
                        placeholder="종료 값"
                        className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  ) : (
                    <div className="relative group">
                      <input
                        autoFocus
                        type={selectedCol?.type === "number" ? "number" : selectedCol?.type === "date" ? "date" : "text"}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={`${selectedCol?.label}로 검색하거나 ID를 입력하세요`}
                        className="w-full rounded-lg border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                      />
                      {selectedCol?.type === "date" && (
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      )}
                      <Info className="absolute -bottom-6 right-0 h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary transition-colors cursor-help" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-5 border-t border-border bg-muted/5">
            <button
              onClick={handleAdd}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98]"
            >
              필터 적용
            </button>
          </div>
        </>
      )}
    </div>
  );
}
