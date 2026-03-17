"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus, Table2, Code2, LayoutTemplate,
  FolderPlus, Boxes, TrendingUp, X, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NewItemAction = "new-dashboard" | "new-collection";

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href?: string;
  action?: NewItemAction;
}

interface MenuSection {
  label: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    label: "데이터",
    items: [
      {
        id: "question",
        title: "질문",
        description: "그래픽 빌더로 데이터 탐색",
        icon: Table2,
        iconBg: "bg-purple-100 dark:bg-purple-900/40",
        iconColor: "text-purple-600 dark:text-purple-400",
        href: "/questions/pick",
      },
      {
        id: "sql",
        title: "SQL 쿼리",
        description: "SQL을 직접 작성해 분석",
        icon: Code2,
        iconBg: "bg-orange-100 dark:bg-orange-900/40",
        iconColor: "text-orange-600 dark:text-orange-400",
        href: "/questions/new",
      },
    ],
  },
  {
    label: "구성",
    items: [
      {
        id: "dashboard",
        title: "대시보드",
        description: "차트를 한 화면에 정리",
        icon: LayoutTemplate,
        iconBg: "bg-blue-100 dark:bg-blue-900/40",
        iconColor: "text-blue-600 dark:text-blue-400",
        action: "new-dashboard",
      },
      {
        id: "collection",
        title: "컬렉션",
        description: "질문과 대시보드를 폴더로 묶기",
        icon: FolderPlus,
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        action: "new-collection",
      },
      {
        id: "model",
        title: "모델",
        description: "재사용 가능한 데이터 모델 정의",
        icon: Boxes,
        iconBg: "bg-teal-100 dark:bg-teal-900/40",
        iconColor: "text-teal-600 dark:text-teal-400",
        href: "/models/new",
      },
      {
        id: "metric",
        title: "메트릭",
        description: "집계 지표를 정의하고 추적",
        icon: TrendingUp,
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
        iconColor: "text-rose-600 dark:text-rose-400",
        href: "/metrics/new",
      },
    ],
  },
];

interface NewItemMenuProps {
  onAction: (action: NewItemAction) => void;
}

export function NewItemMenu({ onAction }: NewItemMenuProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          open
            ? "bg-nav-hover text-nav-foreground"
            : "text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-hover"
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">새로 만들기</span>
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-70 transition-transform duration-150 hidden sm:block", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn(
          "absolute left-0 top-full mt-2 z-50 w-[300px] rounded-2xl border border-border bg-background shadow-2xl",
          "animate-in fade-in slide-in-from-top-2 duration-150"
        )}>
          {MENU_SECTIONS.map((section, si) => (
            <div key={section.label} className={cn(si > 0 && "border-t border-border/60")}>
              {/* 섹션 라벨 */}
              <div className="px-4 pt-3 pb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </span>
              </div>

              {/* 아이템 목록 */}
              <div className="px-2 pb-2 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const inner = (
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors cursor-pointer group w-full text-left">
                      {/* 컬러 아이콘 */}
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-105",
                        item.iconBg
                      )}>
                        <Icon className={cn("h-4.5 w-4.5", item.iconColor)} />
                      </div>
                      {/* 텍스트 */}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-none">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                      </div>
                    </div>
                  );

                  if (item.action) {
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setOpen(false); onAction(item.action!); }}
                        className="w-full"
                      >
                        {inner}
                      </button>
                    );
                  }
                  return (
                    <Link key={item.id} href={item.href!} onClick={() => setOpen(false)}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* 하단 — 최근 사용 힌트 */}
          <div className="border-t border-border/60 px-4 py-2.5">
            <p className="text-[11px] text-muted-foreground/70 text-center">
              <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono bg-muted">Ctrl</kbd>
              {" + "}
              <kbd className="rounded border border-border px-1 py-0.5 text-[10px] font-mono bg-muted">K</kbd>
              {" 로도 열 수 있어요"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
