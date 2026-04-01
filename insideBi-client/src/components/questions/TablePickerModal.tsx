
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, Table2, FolderOpen, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { DATABASES, DB_TABLES } from "@/lib/db-catalog";

type Tab = "recent" | "table" | "collection";

function getRecent(): { id: string; label: string; dbId: string }[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("insightbi_recent_tables_v1") || "[]").slice(0, 8); }
  catch { return []; }
}
function saveRecent(id: string, label: string, dbId: string) {
  const prev = getRecent().filter((r) => r.id !== id);
  prev.unshift({ id, label, dbId });
  localStorage.setItem("insightbi_recent_tables_v1", JSON.stringify(prev.slice(0, 20)));
}

interface TablePickerModalProps {
  onSelect: (tableId: string, dbId: string) => void;
  onClose: () => void;
}

export function TablePickerModal({ onSelect, onClose }: TablePickerModalProps) {
  const [tab, setTab] = React.useState<Tab>("table");
  const [dbId, setDbId] = React.useState("railway");
  const [search, setSearch] = React.useState("");
  const [recent, setRecent] = React.useState<{ id: string; label: string; dbId: string }[]>([]);

  React.useEffect(() => { setRecent(getRecent()); }, []);

  const filtered = React.useMemo(() => {
    const tables = DB_TABLES[dbId] ?? [];
    if (!search.trim()) return tables;
    const q = search.toLowerCase();
    return tables.filter((t) => t.label.toLowerCase().includes(q));
  }, [dbId, search]);

  const selectedDb = DATABASES.find((d) => d.id === dbId)!;

  const handleSelect = (tableId: string, label: string) => {
    saveRecent(tableId, label, dbId);
    onSelect(tableId, dbId);
    onClose();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto"
      style={{ top: "3.5rem" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col w-full bg-white dark:bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-6"
        style={{ maxWidth: 860, maxHeight: "calc(100vh - 7rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-foreground">시작할 데이터를 고르세요</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 검색 */}
        <div className="px-6 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이 데이터베이스 또는 모든 곳에서 검색..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex items-center px-6 border-b border-border shrink-0">
          {([
            { id: "recent" as Tab, label: "최근", icon: Clock },
            { id: "table" as Tab, label: "테이블", icon: Table2 },
            { id: "collection" as Tab, label: "컬렉션", icon: FolderOpen },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 좌측: DB 목록 */}
          <div className="w-64 shrink-0 border-r border-border overflow-y-auto py-2 bg-muted/5">
            {DATABASES.map((db) => {
              const isActive = dbId === db.id;
              return (
                <button
                  key={db.id}
                  onClick={() => { setDbId(db.id); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-left transition-all",
                    isActive ? "bg-primary text-white" : "text-foreground hover:bg-muted/60"
                  )}
                >
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded shrink-0 text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary")}>
                    {db.id === "sample" ? "S" : <span className="text-[9px]">DB</span>}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium truncate", isActive ? "text-white" : "text-foreground")}>{db.label}</p>
                    <p className={cn("text-[11px] truncate", isActive ? "text-white/70" : "text-muted-foreground")}>schema: {db.schema}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 우측: 테이블 목록 */}
          <div className="flex-1 overflow-y-auto">
            {tab === "table" && (
              <div className="px-5 py-2 border-b border-border/50 bg-muted/10 shrink-0">
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedDb.label} / <span className="text-foreground font-semibold">{selectedDb.schema}</span>
                  <span className="ml-2 text-muted-foreground">({filtered.length}개 테이블)</span>
                </p>
              </div>
            )}

            {tab === "recent" && (
              recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                  <Clock className="h-8 w-8 opacity-30" />
                  <p className="text-sm">최근 사용한 테이블이 없습니다</p>
                </div>
              ) : (
                <div>
                  {recent.map((r) => (
                    <button key={r.id} onClick={() => handleSelect(r.id, r.label)}
                      className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group">
                      <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-primary font-medium">{r.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground font-mono">{r.id}</span>
                    </button>
                  ))}
                </div>
              )
            )}

            {tab === "table" && (
              filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                  <Search className="h-8 w-8 opacity-30" />
                  <p className="text-sm">&quot;{search}&quot; 에 해당하는 테이블이 없습니다</p>
                </div>
              ) : (
                <div className="py-1">
                  {filtered.map((t) => (
                    <button key={t.tableId} onClick={() => handleSelect(t.tableId, t.label)}
                      className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group">
                      <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-primary font-medium flex-1">{t.label}</span>
                      <span className="text-[11px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">{t.tableId}</span>
                    </button>
                  ))}
                </div>
              )
            )}

            {tab === "collection" && (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <FolderOpen className="h-8 w-8 opacity-30" />
                <p className="text-sm">컬렉션에서 데이터를 선택합니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
