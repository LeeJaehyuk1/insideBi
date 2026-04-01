
import * as React from "react";
import { Link } from "react-router-dom";
import {
  LayoutTemplate, MessageSquare, BookOpen,
  Pin, Clock, Star, MoveRight, Trash2, MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePinnedItems } from "@/hooks/usePinnedItems";
import { MoveItemDialog } from "./MoveItemDialog";
import type { CollectionItem, CollectionItemType } from "@/types/collection";

const TYPE_CONFIG: Record<CollectionItemType, {
  icon: React.ElementType; label: string; color: string; bg: string;
}> = {
  dashboard: { icon: LayoutTemplate, label: "대시보드", color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950" },
  question:  { icon: MessageSquare,  label: "질문",     color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950" },
  report:    { icon: BookOpen,       label: "보고서",   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" },
};

interface CollectionItemCardProps {
  item: CollectionItem;
  collectionId?: string;
  onTogglePin?: (itemId: string) => void;
  onRemove?: (itemId: string) => void;
}

export function CollectionItemCard({
  item,
  collectionId,
  onTogglePin,
  onRemove,
}: CollectionItemCardProps) {
  const cfg = TYPE_CONFIG[item.type];
  const Icon = cfg.icon;
  const { toggle: toggleGlobalPin, isPinned } = usePinnedItems();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [moveOpen, setMoveOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const globalPinned = isPinned(item.id);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div className="relative group">
        <Link
          to={item.href}
          className="mb-card p-4 flex items-start gap-3 hover:border-primary/50 hover:shadow-md transition-all pr-20"
        >
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg shrink-0 mt-0.5", cfg.bg)}>
            <Icon className={cn("h-4 w-4", cfg.color)} />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5">
              {item.pinned && (
                <Pin className="h-3 w-3 text-amber-500 shrink-0 fill-amber-400" />
              )}
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {item.title}
              </p>
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            )}
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

        {/* 액션 버튼 (hover 시) */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleGlobalPin({
                id: item.id,
                title: item.title,
                type: item.type,
                href: item.href,
                description: item.description,
              });
            }}
            title={globalPinned ? "즐겨찾기 해제" : "홈에 즐겨찾기"}
            className="rounded p-1.5 hover:bg-muted transition-colors"
          >
            <Star className={cn("h-3.5 w-3.5", globalPinned ? "text-amber-500 fill-amber-400" : "text-muted-foreground")} />
          </button>

          {(onTogglePin || onRemove || collectionId) && (
            <div ref={menuRef} className="relative">
              <button
                onClick={(e) => { e.preventDefault(); setMenuOpen((p) => !p); }}
                className="rounded p-1.5 hover:bg-muted transition-colors"
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border bg-background shadow-lg py-1">
                  {onTogglePin && (
                    <button
                      onClick={(e) => { e.preventDefault(); onTogglePin(item.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                    >
                      <Pin className="h-3.5 w-3.5 text-amber-500" />
                      {item.pinned ? "고정 해제" : "상단 고정"}
                    </button>
                  )}
                  {collectionId && (
                    <button
                      onClick={(e) => { e.preventDefault(); setMoveOpen(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left"
                    >
                      <MoveRight className="h-3.5 w-3.5 text-muted-foreground" />
                      다른 컬렉션으로 이동
                    </button>
                  )}
                  {onRemove && (
                    <button
                      onClick={(e) => { e.preventDefault(); onRemove(item.id); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      컬렉션에서 제거
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {collectionId && (
        <MoveItemDialog
          open={moveOpen}
          onOpenChange={setMoveOpen}
          itemId={item.id}
          itemTitle={item.title}
          fromCollectionId={collectionId}
        />
      )}
    </>
  );
}
