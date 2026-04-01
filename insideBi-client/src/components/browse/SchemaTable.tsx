import { cn } from "@/lib/utils";
import type { ColumnMeta } from "@/types/dataset";

const TYPE_BADGE: Record<string, string> = {
  string:   "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  number:   "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  percent:  "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  currency: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  date:     "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
};

const ROLE_BADGE: Record<string, string> = {
  dimension: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  measure:   "bg-primary/10 text-primary",
};

interface SchemaTableProps {
  columns: ColumnMeta[];
}

export function SchemaTable({ columns }: SchemaTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">컬럼명</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">레이블</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">타입</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">역할</th>
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">단위</th>
            <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">필터</th>
            <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">집계</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {columns.map((col) => (
            <tr key={col.key} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2.5">
                <code className="text-xs font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                  {col.key}
                </code>
              </td>
              <td className="px-4 py-2.5 text-sm text-foreground">{col.label}</td>
              <td className="px-4 py-2.5">
                <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", TYPE_BADGE[col.type] ?? TYPE_BADGE.string)}>
                  {col.type}
                </span>
              </td>
              <td className="px-4 py-2.5">
                <span className={cn("text-[11px] font-medium px-1.5 py-0.5 rounded-full", ROLE_BADGE[col.role] ?? "")}>
                  {col.role === "dimension" ? "차원" : "측정값"}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{col.unit ?? "—"}</td>
              <td className="px-4 py-2.5 text-center">
                {col.filterable
                  ? <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  : <span className="text-muted-foreground/40 text-xs">—</span>}
              </td>
              <td className="px-4 py-2.5 text-center">
                {col.aggregatable
                  ? <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  : <span className="text-muted-foreground/40 text-xs">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
