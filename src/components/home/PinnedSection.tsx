"use client";

import Link from "next/link";
import {
  LayoutTemplate, MessageSquare, BookOpen, Star, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePinnedItems, PinnedItem } from "@/hooks/usePinnedItems";

const TYPE_CONFIG: Record<PinnedItem["type"], { icon: React.ElementType; color: string; bg: string; label: string }> = {
  dashboard:  { icon: LayoutTemplate, color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950",   label: "대시보드" },
  question:   { icon: MessageSquare,  color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950", label: "질문" },
  report:     { icon: BookOpen,       color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", label: "보고서" },
  collection: { icon: Star,           color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950", label: "컬렉션" },
  page:       { icon: Globe,          color: "text-slate-600 dark:text-slate-400",  bg: "bg-slate-50 dark:bg-slate-950", label: "페이지" },
};

export function PinnedSection() {
  const { items, hydrated, unpin } = usePinnedItems();

  if (!hydrated || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          즐겨찾기
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => {
          const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.page;
          const Icon = cfg.icon;
          return (
            <div key={item.id} className="group relative">
              <Link
                href={item.href}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", cfg.bg)}>
                  <Icon className={cn("h-4 w-4", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                  )}
                </div>
              </Link>
              <button
                onClick={() => unpin(item.id)}
                title="즐겨찾기 해제"
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-muted transition-all"
              >
                <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
