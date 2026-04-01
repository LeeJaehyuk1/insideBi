
import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnMeta } from "@/types/dataset";

type Row = Record<string, unknown>;
type SortDir = "asc" | "desc" | null;

interface DataPreviewTableProps {
  columns: ColumnMeta[];
  rows: Row[];
  maxRows?: number;
}

export function DataPreviewTable({ columns, rows, maxRows = 20 }: DataPreviewTableProps) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>(null);
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = maxRows;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const sorted = React.useMemo(() => {
    if (!sortKey || !sortDir) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function formatValue(val: unknown, col: ColumnMeta): string {
    if (val === null || val === undefined) return "—";
    if (col.type === "currency") return `${Number(val).toLocaleString("ko-KR")}${col.unit ? " " + col.unit : ""}`;
    if (col.type === "percent") return `${Number(val).toFixed(2)}${col.unit ?? "%"}`;
    if (col.type === "number") return Number(val).toLocaleString("ko-KR");
    return String(val);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc"
                        ? <ArrowUp className="h-3 w-3 text-primary" />
                        : <ArrowDown className="h-3 w-3 text-primary" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-30" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {pageRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-muted/20 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-2 text-sm whitespace-nowrap",
                      col.role === "measure" ? "text-right font-mono tabular-nums" : "text-foreground"
                    )}
                  >
                    {formatValue(row[col.key], col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 + 요약 */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>총 {rows.length.toLocaleString()}행</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2 py-1 rounded border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              이전
            </button>
            <span>{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-2 py-1 rounded border hover:bg-muted disabled:opacity-40 transition-colors"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
