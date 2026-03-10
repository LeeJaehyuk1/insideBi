"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Table2, FolderOpen, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────
   DB 목록
───────────────────────────────────────── */
const DATABASES = [
  { id: "railway", label: "railway" },
  { id: "sample", label: "Sample Database" },
];

/* ─────────────────────────────────────────
   테이블 목록 (영어 이름, 설명 없음, 알파벳 순)
───────────────────────────────────────── */
const DB_TABLES: Record<string, string[]> = {
  railway: [
    "Concentration",
    "Credit Grades",
    "Funding Structure",
    "Lcr Gauge",
    "Lcr Nsfr Trend",
    "Liquidity Buffer",
    "Maturity Gap",
    "Ncr Capital",
    "Ncr Composition",
    "Ncr Summary",
    "Ncr Trend",
    "Npl Summary",
    "Npl Trend",
    "Pd Lgd Ead",
    "Risk Composition",
    "Sector Exposure",
    "Sensitivity",
    "Stress Scenarios",
    "Var Summary",
    "Var Trend",
  ].sort(),
  sample: [
    "Accounts",
    "Analytic Events",
    "Feedback",
    "Invoices",
    "Orders",
    "People",
    "Products",
    "Reviews",
  ].sort(),
};

/* 테이블 이름 → dataset ID 변환 */
function labelToId(label: string): string {
  return label.toLowerCase().replace(/ /g, "-");
}

/* ─────────────────────────────────────────
   최근 기록
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
  const [dbId, setDbId] = React.useState("railway");
  const [search, setSearch] = React.useState("");
  const [recent, setRecent] = React.useState<{ id: string; label: string; dbId: string }[]>([]);

  React.useEffect(() => { setRecent(getRecent()); }, []);

  const tables = DB_TABLES[dbId] ?? [];

  const filtered = React.useMemo(() => {
    if (!search.trim()) return tables;
    const q = search.toLowerCase();
    return tables.filter((t) => t.toLowerCase().includes(q));
  }, [tables, search]);

  const handleSelect = (label: string) => {
    const id = labelToId(label);
    saveRecent(id, label, dbId);
    router.push(`/questions/nocode?dataset=${id}`);
  };

  return (
    /* 전체 화면 반투명 배경 */
    <div
      className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[4vh]"
      onClick={(e) => { if (e.target === e.currentTarget) router.back(); }}
    >
      {/* ── 모달 카드 ── */}
      <div
        className="relative flex flex-col w-full bg-white dark:bg-card rounded-xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{ maxWidth: 900, maxHeight: "88vh" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <h2 className="text-xl font-bold text-foreground">시작할 데이터를 고르세요</h2>
          <button
            onClick={() => router.back()}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 검색창 */}
        <div className="px-6 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이 데이터베이스 또는 모든 곳에서 검색..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div className="flex items-center gap-0 px-6 border-b border-border shrink-0">
          {([
            { id: "recent", label: "최근", icon: Clock },
            { id: "table", label: "테이블", icon: Table2 },
            { id: "collection", label: "컬렉션", icon: FolderOpen },
          ] as { id: Tab; label: string; icon: React.ElementType }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* 본문: 좌측 DB + 우측 테이블 목록 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* 좌측 DB 목록 */}
          <div className="w-64 shrink-0 border-r border-border overflow-y-auto py-2">
            {DATABASES.map((db) => {
              const isActive = dbId === db.id;
              return (
                <button
                  key={db.id}
                  onClick={() => { setDbId(db.id); setSearch(""); }}
                  className={cn(
                    "flex items-center gap-3 w-full px-5 py-3 text-sm font-medium text-left transition-all rounded-none",
                    isActive
                      ? "bg-primary text-white"
                      : "text-foreground hover:bg-muted/60"
                  )}
                >
                  {/* DB 아이콘 */}
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded shrink-0 text-[10px] font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {db.id === "sample" ? (
                      <span>S</span>
                    ) : (
                      <span className="text-[9px]">DB</span>
                    )}
                  </div>
                  <span className="truncate">{db.label}</span>
                </button>
              );
            })}
          </div>

          {/* 우측 테이블 목록 */}
          <div className="flex-1 overflow-y-auto">
            {tab === "recent" && (
              recent.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                  <Clock className="h-8 w-8 opacity-30" />
                  <p className="text-sm">최근 사용한 테이블이 없습니다</p>
                </div>
              ) : (
                <div>
                  {recent.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelect(r.label)}
                      className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group"
                    >
                      <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-primary font-medium">{r.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{r.dbId}</span>
                    </button>
                  ))}
                </div>
              )
            )}

            {tab === "table" && (
              filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                  <Search className="h-8 w-8 opacity-30" />
                  <p className="text-sm">"{search}" 에 해당하는 테이블이 없습니다</p>
                </div>
              ) : (
                <div>
                  {filtered.map((label) => (
                    <button
                      key={label}
                      onClick={() => handleSelect(label)}
                      className="flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors group"
                    >
                      <LayoutGrid className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-primary font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              )
            )}

            {tab === "collection" && (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
                <FolderOpen className="h-8 w-8 opacity-30" />
                <p className="text-sm">컬렉션에서 데이터를 선택합니다</p>
                <button
                  onClick={() => router.push("/collections")}
                  className="mt-1 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
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
