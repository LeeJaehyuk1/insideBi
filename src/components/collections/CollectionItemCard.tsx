import Link from "next/link";
import {
  LayoutTemplate,
  MessageSquare,
  BookOpen,
  Pin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollectionItem, CollectionItemType } from "@/types/collection";

const TYPE_CONFIG: Record<CollectionItemType, { icon: React.ElementType; label: string; color: string; bg: string }> = {
  dashboard: { icon: LayoutTemplate, label: "대시보드", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950" },
  question:  { icon: MessageSquare, label: "질문",     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950" },
  report:    { icon: BookOpen,      label: "보고서",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
};

interface CollectionItemCardProps {
  item: CollectionItem;
}

export function CollectionItemCard({ item }: CollectionItemCardProps) {
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;

  return (
    <Link
      href={item.href}
      className="mb-card p-4 flex items-start gap-3 hover:border-primary/50 hover:shadow-md transition-all group"
    >
      {/* 타입 아이콘 */}
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5", cfg.bg)}>
        <Icon className={cn("h-4.5 w-4.5", cfg.color)} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {/* 제목 + 핀 */}
        <div className="flex items-center gap-1.5">
          {item.pinned && (
            <Pin className="h-3 w-3 text-amber-500 shrink-0 fill-amber-400" />
          )}
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {item.title}
          </p>
        </div>

        {/* 설명 */}
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}

        {/* 메타 정보 */}
        <div className="flex items-center gap-3">
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", cfg.bg, cfg.color)}>
            {cfg.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {item.updatedAt}
          </span>
          <span className="text-[10px] text-muted-foreground">{item.author}</span>
        </div>
      </div>
    </Link>
  );
}
