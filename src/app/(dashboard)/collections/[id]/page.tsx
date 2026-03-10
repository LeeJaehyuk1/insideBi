"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Pin, LayoutTemplate, MessageSquare, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCollection } from "@/lib/mock-data/collections";
import { CollectionIcon } from "@/components/collections/CollectionIcon";
import { CollectionItemCard } from "@/components/collections/CollectionItemCard";
import type { CollectionItemType } from "@/types/collection";

type FilterType = "all" | CollectionItemType;

const FILTER_TABS: { value: FilterType; label: string; icon: React.ElementType }[] = [
  { value: "all",       label: "전체",      icon: () => null },
  { value: "dashboard", label: "대시보드",  icon: LayoutTemplate },
  { value: "question",  label: "질문",      icon: MessageSquare },
  { value: "report",    label: "보고서",    icon: BookOpen },
];

export default function CollectionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const collection = getCollection(params.id);
  if (!collection) notFound();

  const [filter, setFilter] = React.useState<FilterType>("all");

  const pinned = collection.items.filter((i) => i.pinned);
  const filtered =
    filter === "all"
      ? collection.items
      : collection.items.filter((i) => i.type === filter);

  const counts: Record<FilterType, number> = {
    all: collection.items.length,
    dashboard: collection.items.filter((i) => i.type === "dashboard").length,
    question:  collection.items.filter((i) => i.type === "question").length,
    report:    collection.items.filter((i) => i.type === "report").length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">

      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/collections" className="hover:text-foreground transition-colors">
          컬렉션
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{collection.name}</span>
      </nav>

      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <CollectionIcon icon={collection.icon} color={collection.color} size="lg" />
        <div>
          <h1 className="text-xl font-bold text-foreground">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{collection.description}</p>
          )}
        </div>
      </div>

      {/* 고정 항목 */}
      {pinned.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Pin className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              고정됨
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pinned.map((item) => (
              <CollectionItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* 필터 탭 + 전체 목록 */}
      <section>
        {/* 탭 */}
        <div className="flex items-center gap-1 mb-4 border-b border-border">
          {FILTER_TABS.map((tab) => {
            const count = counts[tab.value];
            if (tab.value !== "all" && count === 0) return null;
            const Icon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                  filter === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.value !== "all" && <Icon className="h-3.5 w-3.5" />}
                {tab.label}
                <span className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  filter === tab.value
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* 항목 목록 */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            해당 유형의 항목이 없습니다.
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <CollectionItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
