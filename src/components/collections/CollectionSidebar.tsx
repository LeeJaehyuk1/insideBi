"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, ChevronDown, ChevronRight, FolderOpen, User2,
  Database, Cpu, BarChart2, Trash2, Plus, LayoutGrid,
  BookOpen, HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";

interface CollectionSidebarProps {
  onCreateFolder?: (name: string, parentId: string) => void;
}

export function CollectionSidebar({ onCreateFolder }: CollectionSidebarProps) {
  const pathname = usePathname();
  const { folders, createFolder } = useCollectionFolders();
  const [startOpen, setStartOpen] = React.useState(true);
  const [dataOpen, setDataOpen] = React.useState(true);
  const [newColName, setNewColName] = React.useState("");
  const [addingCol, setAddingCol] = React.useState(false);

  /* 루트 컬렉션의 하위 컬렉션만 사이드바에 표시 */
  const rootFolder = folders.find((f) => f.id === ROOT_ID);
  const subCollections = rootFolder?.entries.filter((e) => e.type === "collection") ?? [];

  /* 활성 여부 */
  const isActive = (href: string) =>
    href === "/collections" ? pathname === "/collections" : pathname === href;

  const navItem = (href: string, icon: React.ElementType, label: string, indent = false) => {
    const Icon = icon;
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
          indent && "ml-2",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground hover:bg-muted/60"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-background flex flex-col h-full overflow-y-auto">
      <div className="px-3 py-3 space-y-1">

        {/* 홈 */}
        {navItem("/", Home, "집")}

        {/* 시작하기 */}
        <div>
          <button
            onClick={() => setStartOpen((p) => !p)}
            className="flex items-center gap-1.5 w-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {startOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            시작하기
          </button>
          {startOpen && (
            <div className="mt-0.5 space-y-0.5">
              {navItem("/browse", LayoutGrid, "데이터 추가", true)}
              {navItem("#", BookOpen, "메타베이스 사용 방법", true)}
              {navItem("/collections/examples", FolderOpen, "Examples", true)}
            </div>
          )}
        </div>

        {/* 컬렉션 */}
        <div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs font-semibold text-muted-foreground">컬렉션</span>
            <button
              onClick={() => setAddingCol((p) => !p)}
              title="새 컬렉션"
              className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 새 컬렉션 이름 입력 */}
          {addingCol && (
            <div className="mx-3 mb-2">
              <input
                autoFocus
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newColName.trim()) {
                    createFolder(newColName.trim(), ROOT_ID);
                    setNewColName("");
                    setAddingCol(false);
                  }
                  if (e.key === "Escape") { setNewColName(""); setAddingCol(false); }
                }}
                placeholder="컬렉션 이름..."
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          )}

          <div className="space-y-0.5">
            {/* 우리의 분석 */}
            <Link
              href="/collections"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive("/collections")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted/60"
              )}
            >
              <FolderOpen className={cn("h-4 w-4 shrink-0", isActive("/collections") ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate">우리의 분석</span>
            </Link>

            {/* 개인 컬렉션 */}
            <Link
              href={`/collections/${PERSONAL_ID}`}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(`/collections/${PERSONAL_ID}`)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted/60"
              )}
            >
              <User2 className={cn("h-4 w-4 shrink-0", isActive(`/collections/${PERSONAL_ID}`) ? "text-primary" : "text-muted-foreground")} />
              <span className="truncate">당신의 개인 컬렉션</span>
            </Link>

            {/* 루트 하위 컬렉션 */}
            {subCollections.map((col) => (
              <Link
                key={col.id}
                href={col.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(col.href)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted/60"
                )}
              >
                <FolderOpen className={cn("h-4 w-4 shrink-0", isActive(col.href) ? "text-primary" : "text-muted-foreground")} />
                <span className="truncate">{col.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 데이터 */}
        <div>
          <div className="flex items-center justify-between px-3 py-1.5">
            <button
              onClick={() => setDataOpen((p) => !p)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              {dataOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              데이터
            </button>
            <Link
              href="/browse"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <LayoutGrid className="h-3 w-3" />
              추가
            </Link>
          </div>
          {dataOpen && (
            <div className="mt-0.5 space-y-0.5">
              {navItem("/browse", Database, "데이터베이스", true)}
              {navItem("#", Cpu, "모델", true)}
              {navItem("#", BarChart2, "측정항목", true)}
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="h-px bg-border mx-2 my-2" />

        {/* 휴지통 */}
        <button className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors">
          <Trash2 className="h-4 w-4 shrink-0" />
          <span>휴지통</span>
        </button>
      </div>
    </aside>
  );
}
