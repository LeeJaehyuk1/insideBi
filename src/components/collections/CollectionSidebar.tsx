"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, User2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";

export function CollectionSidebar() {
  const pathname = usePathname();
  const { createFolder } = useCollectionFolders();
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");

  const isActive = (href: string) =>
    href === "/collections" ? pathname === "/collections" : pathname === href;

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background flex flex-col py-4 overflow-y-auto">

      {/* 컬렉션 헤더 */}
      <div className="flex items-center justify-between px-4 mb-2">
        <span className="text-xs font-semibold text-muted-foreground">컬렉션</span>
        <button
          onClick={() => setAdding((p) => !p)}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 인라인 새 컬렉션 입력 */}
      {adding && (
        <div className="px-3 mb-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) {
                createFolder(name.trim(), ROOT_ID);
                setName("");
                setAdding(false);
              }
              if (e.key === "Escape") { setName(""); setAdding(false); }
            }}
            placeholder="컬렉션 이름..."
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      )}

      {/* 우리의 분석 */}
      <Link
        href="/collections"
        className={cn(
          "flex items-center gap-2.5 mx-2 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive("/collections")
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground hover:bg-muted/60"
        )}
      >
        <FolderOpen className={cn("h-4 w-4 shrink-0", isActive("/collections") ? "text-primary" : "text-muted-foreground")} />
        <span className="truncate">우리의 분석</span>
      </Link>

      {/* 당신의 개인 컬렉션 */}
      <Link
        href={`/collections/${PERSONAL_ID}`}
        className={cn(
          "flex items-center gap-2.5 mx-2 rounded-lg px-3 py-2 text-sm transition-colors",
          isActive(`/collections/${PERSONAL_ID}`)
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground hover:bg-muted/60"
        )}
      >
        <User2 className={cn("h-4 w-4 shrink-0", isActive(`/collections/${PERSONAL_ID}`) ? "text-primary" : "text-muted-foreground")} />
        <span className="truncate">당신의 개인 컬렉션</span>
      </Link>
    </aside>
  );
}
