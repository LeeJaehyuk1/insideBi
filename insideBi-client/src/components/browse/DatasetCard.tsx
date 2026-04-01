import { Link } from "react-router-dom";
import { ChevronRight, Columns3, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DatasetMeta } from "@/types/builder";
import { chartTypeLabels } from "@/lib/data-catalog";

const CATEGORY_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  credit:    { bg: "bg-blue-50 dark:bg-blue-950",    text: "text-blue-600 dark:text-blue-400",    dot: "bg-blue-500" },
  market:    { bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  liquidity: { bg: "bg-teal-50 dark:bg-teal-950",    text: "text-teal-600 dark:text-teal-400",    dot: "bg-teal-500" },
};

interface DatasetCardProps {
  dataset: DatasetMeta;
  columnCount: number;
  rowCount: number;
}

export function DatasetCard({ dataset, columnCount, rowCount }: DatasetCardProps) {
  const c = CATEGORY_COLOR[dataset.category] ?? CATEGORY_COLOR.credit;

  return (
    <Link
      to={`/browse/${dataset.id}`}
      className="mb-card flex items-center gap-4 p-4 hover:border-primary/50 hover:shadow-md transition-all group"
    >
      {/* 카테고리 색상 도트 */}
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0", c.bg)}>
        <div className={cn("h-3 w-3 rounded-full", c.dot)} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
          {dataset.label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{dataset.description}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Rows3 className="h-3 w-3" /> {rowCount.toLocaleString()}행
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Columns3 className="h-3 w-3" /> {columnCount}열
          </span>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", c.bg, c.text)}>
            {chartTypeLabels[dataset.defaultChart] ?? dataset.defaultChart}
          </span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}
