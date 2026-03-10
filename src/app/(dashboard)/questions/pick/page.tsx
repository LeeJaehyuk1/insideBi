"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Table2, FolderOpen, Database, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { dataCatalog } from "@/lib/data-catalog";

/* ─────────────────────────────────────────
   DB 목록
───────────────────────────────────────── */
const DATABASES = [
  { id: "insightbi", label: "InsightBi DB", icon: "railway" },
  { id: "sample", label: "Sample Database", icon: "sample" },
];

/* ─────────────────────────────────────────
   테이블 목록 (DB별 flat)
───────────────────────────────────────── */

// InsightBi DB: dataCatalog에서 label을 사람이 읽기 좋은 형태로 변환
const INSIGHTBI_TABLES = [...dataCatalog]
  .sort((a, b) => a.label.localeCompare(b.label, "ko"))
  .map((d) => ({ id: d.id, label: d.label, description: d.description }));

// Sample Database
const SAMPLE_TABLES = [
  "Accounts", "Analytic Events", "Feedback", "Invoices",
  "Orders", "People", "Products", "Reviews",
].sort().map((t) => ({ id: t.toLowerCase().replace(/ /g, "-"), label: t, description: "" }));

const DB_TABLES: Record<string, { id: string; label: string; description: string }[]> = {
  insightbi: INSIGHTBI_TABLES,
  sample: SAMPLE_TABLES,
};

/* ─────────────────────────────────────────
   최근 항목 (recent) — localStorage 기반
───────────────────────────────────────── */
function getRecent(): { id: string; label: string; dbId: string }[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("insightbi_recent_tables_v1") || "[]").slice(0, 8);
  } catch { return []; }
}
function saveRecent(id: string, label: string, dbId: string) {
  const prev = getRecent().filter((r) => r.id !== id);
  prev.unshift({ id, label, dbId });
  localStorage.setItem("insightbi_recent_tables_v1", JSON.stringify(prev.slice(0, 20)));
}

/* ─────────────────────────────────────────
   메인 페이지
───────────────────────────────────────── */
type Tab = "recent" | "table" | "collection";

export default function QuestionPickPage() {
  const router = useRouter();

  const [tab, setTab] = React.useState<Tab>("table");
  const [dbId, setDbId] = React.useState("insightbi");
  const [search, setSearch] = React.useState("");
  const [recent, setRecent] = React.useState<{ id: string; label: string; dbId: string }[]>([]);

  React.useEffect(() => {
    setRecent(getRecent());
  }, []);

  const tables = DB_TABLES[dbId] ?? [];

  const filtered = React.useMemo(() => {
    if (!search.trim()) return tables;
    const q = search.toLowerCase();
    return tables.filter(
      (t) => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [tables, search]);

  const handleSelect = (tableId: string, tableLabel: string) => {
    saveRecent(tableId, tableLabel, dbId);
    router.push(`/questions/nocode?dataset=${tableId}`);
  };

  return (
    /* 전체 화면 오버레이 배경 */
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/30 backdrop-blur-sm pt-[5vh]"
      onClick={(e) => { if (e.target === e.currentTarget) router.back(); }}>

      {/* 모달 카드 */}
      <div className="relative flex flex-col w-full max-w-3xl bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ maxHeight: "85vh" }}>

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">시작할 데이터를 고르세요</h2>
          <button onClick={() => router.back()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── 검색창 ── */}
        <div className="px-6 py-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이 데이터베이스 또는 모든 곳에서 검색..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── 탭 ── */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-border shrink-0">
          {([
            { id: "recent", label: "최근", icon: Clock },
            { id: "table", label: "테이블", icon: Table2 },
            { id: "collection", label: "컬렉션", icon: FolderOpen },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ── 본문 (DB 목록 + 테이블 목록) ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* 좌측 DB 목록 */}
          <div className="w-56 shrink-0 border-r border-border overflow-y-auto py-2 bg-muted/10">
            {DATABASES.map((db) => {
              const isActive = dbId === db.id;
              return (
                <button
                  key={db.id}
                  onClick={() => { setDbId(db.id); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-left transition-all",
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-muted"
                  )}>
                  <Database className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-primary")} />
                  <span className="truncate">{db.label}</span>
                </button>
              );
            })}
          </div>

          {/* 우측 테이블 목록 */}
          <div className="flex-1 overflow-y-auto">
            {tab === "recent" && (
              <>
                {recent.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <Clock className="h-8 w-8 opacity-30" />
                    <p className="text-sm">최근 사용한 테이블이 없습니다</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {recent.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelect(r.id, r.label)}
                        className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors group">
                        <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-foreground group-hover:text-primary transition-colors">{r.label}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{DATABASES.find(d => d.id === r.dbId)?.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "table" && (
              <div className="py-1">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                    <Search className="h-8 w-8 opacity-30" />
                    <p className="text-sm">"{search}" 에 해당하는 테이블이 없습니다</p>
                  </div>
                ) : (
                  filtered.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelect(t.id, t.label)}
                      className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left hover:bg-muted/50 transition-colors group">
                      <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-foreground group-hover:text-primary transition-colors">{t.label}</span>
                        {t.description && (
                          <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {tab === "collection" && (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                <FolderOpen className="h-8 w-8 opacity-30" />
                <p className="text-sm">컬렉션에서 데이터를 선택합니다</p>
                <button
                  onClick={() => router.push("/collections")}
                  className="mt-1 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  컬렉션 열기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
