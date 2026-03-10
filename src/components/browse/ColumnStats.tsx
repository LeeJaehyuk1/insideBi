import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColumnMeta } from "@/types/dataset";

interface ColumnStatsProps {
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
}

function computeStats(rows: Record<string, unknown>[], key: string) {
  const vals = rows
    .map((r) => Number(r[key]))
    .filter((v) => !isNaN(v));
  if (vals.length === 0) return null;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return { min, max, avg };
}

export function ColumnStats({ columns, rows }: ColumnStatsProps) {
  const measureCols = columns.filter((c) => c.role === "measure" && c.type === "number");

  if (measureCols.length === 0) return null;

  return (
    <div className="mb-card overflow-hidden">
      <div className="mb-card-header">
        <span className="mb-card-title">컬럼 통계</span>
        <span className="text-xs text-muted-foreground">{measureCols.length}개 측정값</span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {measureCols.map((col) => {
          const stats = computeStats(rows, col.key);
          if (!stats) return null;
          return (
            <div key={col.key} className="rounded-lg border p-3 space-y-1.5">
              <p className="text-xs font-semibold text-foreground truncate">{col.label}</p>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="flex items-center justify-center gap-0.5 text-blue-600 dark:text-blue-400">
                    <TrendingDown className="h-3 w-3" />
                    <span className="text-[10px] font-medium">최소</span>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {stats.min.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-0.5 text-muted-foreground">
                    <Minus className="h-3 w-3" />
                    <span className="text-[10px] font-medium">평균</span>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {stats.avg.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[10px] font-medium">최대</span>
                  </div>
                  <p className="text-xs font-bold text-foreground mt-0.5">
                    {stats.max.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
