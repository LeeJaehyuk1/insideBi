
import * as React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { FolderOpen, User2, Plus, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";

export function CollectionSidebar() {
  const pathname = useLocation().pathname;
  const { folders, createFolder } = useCollectionFolders();
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set([ROOT_ID]));
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");

  const rootFolder = folders.find((f) => f.id === ROOT_ID);
  const personalFolder = folders.find((f) => f.id === PERSONAL_ID);
  const subCollections = rootFolder?.entries.filter((e) => e.type === "collection") ?? [];

  const isActive = (href: string) =>
    href === "/collections" ? pathname === "/collections" : pathname === href;

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background flex flex-col py-4 overflow-y-auto">

      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between px-4 mb-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">컬렉션</span>
        <button
          onClick={() => setAdding((p) => !p)}
          title="새 컬렉션"
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

      {/* 우리의 분석 (expandable) */}
      <div className="flex items-center mx-2 group/root">
        <button
          onClick={() => toggleExpand(ROOT_ID)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          {expanded.has(ROOT_ID)
            ? <ChevronDown className="h-3 w-3" />
            : <ChevronRight className="h-3 w-3" />
          }
        </button>
        <Link
          to="/collections"
          className={cn(
            "flex items-center gap-2 flex-1 rounded-lg px-2 py-1.5 text-sm transition-colors min-w-0",
            isActive("/collections")
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground hover:bg-muted/60"
          )}
        >
          <FolderOpen className={cn(
            "h-4 w-4 shrink-0",
            isActive("/collections") ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="truncate">우리의 분석</span>
        </Link>
      </div>

      {/* 하위 컬렉션 */}
      {expanded.has(ROOT_ID) && subCollections.map((sub) => (
        <Link
          key={sub.id}
          to={sub.href}
          className={cn(
            "flex items-center gap-2 ml-9 mr-2 rounded-lg px-2 py-1.5 text-sm transition-colors min-w-0",
            isActive(sub.href)
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground hover:bg-muted/60"
          )}
        >
          <FolderOpen className={cn(
            "h-3.5 w-3.5 shrink-0",
            isActive(sub.href) ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="truncate text-xs">{sub.name}</span>
        </Link>
      ))}

      {/* 개인 컬렉션 */}
      <Link
        to={`/collections/${PERSONAL_ID}`}
        className={cn(
          "flex items-center gap-2.5 mx-2 rounded-lg px-3 py-2 text-sm transition-colors mt-1",
          isActive(`/collections/${PERSONAL_ID}`)
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground hover:bg-muted/60"
        )}
      >
        <User2 className={cn(
          "h-4 w-4 shrink-0",
          isActive(`/collections/${PERSONAL_ID}`) ? "text-primary" : "text-muted-foreground"
        )} />
        <span className="truncate">{personalFolder?.name ?? "개인 컬렉션"}</span>
      </Link>
    </aside>
  );
}
