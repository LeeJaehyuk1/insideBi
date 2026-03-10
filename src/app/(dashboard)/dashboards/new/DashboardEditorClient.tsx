"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Type, Link2, LayoutGrid, SlidersHorizontal,
  MoreHorizontal, ChevronDown, X, Search, MessageSquare,
  FileText, FolderOpen, ChevronRight, Table2, Pencil, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { collections } from "@/lib/mock-data/collections";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { dataCatalog } from "@/lib/data-catalog";

/* ── 탭 타입 ── */
interface Tab {
  id: string;
  label: string;
}

/* ── 우측 패널: 컬렉션 트리 아이템 ── */
type PanelItem =
  | { kind: "collection"; id: string; name: string; hasChildren: boolean }
  | { kind: "question"; id: string; title: string; datasetId: string };

/* ── 우측 패널 컴포넌트 ── */
function RightPanel({
  onClose,
  collectionId,
}: {
  onClose: () => void;
  collectionId: string;
}) {
  const { questions } = useSavedQuestions();
  const [search, setSearch] = React.useState("");
  const [expandedCols, setExpandedCols] = React.useState<Set<string>>(new Set());

  const toggleCol = (id: string) =>
    setExpandedCols((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // 컬렉션 목록
  const cols = collections.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  // 저장된 질문 목록
  const savedQs = questions.filter(
    (q) => !search || q.title.toLowerCase().includes(search.toLowerCase())
  );

  // dataCatalog 질문 (검색용)
  const catalogItems = dataCatalog.filter(
    (d) => !search || d.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 shrink-0 border-l border-border bg-background flex flex-col h-full">
      {/* 검색 */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="찾다..."
            className="w-full rounded-lg border border-input bg-muted/30 pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* 새로운 질문 / SQL */}
      <div className="flex items-center gap-2 px-4 pb-3 shrink-0">
        <Link
          href="/questions/nocode"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          새로운 질문
        </Link>
        <Link
          href="/questions/new"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground font-mono" />
          새로운 SQL 쿼리
        </Link>
      </div>

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">

        {/* 저장된 질문이 있으면 먼저 표시 */}
        {savedQs.length > 0 && (
          <div className="mb-2">
            <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              저장된 질문
            </p>
            {savedQs.map((q) => {
              const ds = dataCatalog.find((d) => d.id === q.datasetId);
              return (
                <button
                  key={q.id}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
                >
                  <Table2 className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{q.title}</p>
                    {ds && <p className="text-[11px] text-muted-foreground truncate">{ds.categoryLabel}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 컬렉션 섹션 */}
        <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          우리의 분석
        </p>

        {cols.map((col) => (
          <div key={col.id}>
            <button
              onClick={() => toggleCol(col.id)}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
            >
              <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 text-sm text-foreground truncate">{col.name}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                  expandedCols.has(col.id) && "rotate-90"
                )}
              />
            </button>

            {/* 컬렉션 아이템 펼침 */}
            {expandedCols.has(col.id) && (
              <div className="pl-4">
                {col.items.map((item) => (
                  <button
                    key={item.id}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-muted/60 transition-colors"
                  >
                    <Table2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="text-sm text-foreground truncate">{item.title}</span>
                  </button>
                ))}
                {col.items.length === 0 && (
                  <p className="px-4 py-2 text-xs text-muted-foreground">항목 없음</p>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 데이터 카탈로그 */}
        {search && catalogItems.length > 0 && (
          <div className="mt-2">
            <p className="px-4 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              데이터 카탈로그
            </p>
            {catalogItems.map((d) => (
              <button
                key={d.id}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
              >
                <Table2 className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{d.label}</p>
                  <p className="text-[11px] text-muted-foreground">{d.categoryLabel}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 메인 에디터 ── */
export function DashboardEditorClient() {
  const params = useSearchParams();
  const router = useRouter();
  const initialName = params.get("name") ?? "새 대시보드";
  const collectionId = params.get("collection") ?? "analytics";

  const [dashboardName, setDashboardName] = React.useState(initialName);
  const [editingName, setEditingName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(initialName);
  const [tabs, setTabs] = React.useState<Tab[]>([{ id: "tab-1", label: "탭 1" }]);
  const [activeTab, setActiveTab] = React.useState("tab-1");
  const [rightPanelOpen, setRightPanelOpen] = React.useState(false);

  const nameInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const handleNameSave = () => {
    if (nameInput.trim()) setDashboardName(nameInput.trim());
    setEditingName(false);
  };

  const addTab = () => {
    const newTab: Tab = { id: `tab-${Date.now()}`, label: `탭 ${tabs.length + 1}` };
    setTabs((p) => [...p, newTab]);
    setActiveTab(newTab.id);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 bg-background">

      {/* ── 상단 툴바 ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0 bg-background">
        {/* 대시보드 이름 */}
        <div className="flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") { setEditingName(false); setNameInput(dashboardName); }
                }}
                className="text-xl font-bold bg-transparent border-b-2 border-primary outline-none text-foreground min-w-[120px]"
              />
              <button onClick={handleNameSave} className="text-primary hover:text-primary/80">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => { setEditingName(false); setNameInput(dashboardName); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-2 group"
            >
              <h1 className="text-xl font-bold text-foreground">{dashboardName}</h1>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
        </div>

        {/* 우측 툴바 */}
        <div className="flex items-center gap-1">
          {/* 차트 추가 (+) */}
          <button
            onClick={() => setRightPanelOpen((p) => !p)}
            title="차트 추가"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              rightPanelOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* 텍스트 */}
          <button className="flex items-center gap-0.5 h-8 px-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm">
            <Type className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* 링크 */}
          <button className="flex items-center gap-0.5 h-8 px-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm">
            <Link2 className="h-3.5 w-3.5" />
            <ChevronDown className="h-3 w-3" />
          </button>

          {/* 섹션 */}
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <LayoutGrid className="h-4 w-4" />
          </button>

          {/* 필터 */}
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* 더보기 */}
          <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── 탭 바 ── */}
      <div className="flex items-center px-6 border-b border-border shrink-0 bg-background">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-1 px-1 py-2.5 mr-1 border-b-2 -mb-px transition-colors cursor-pointer",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="text-sm font-medium px-1">{tab.label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="opacity-60 hover:opacity-100"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors ml-1"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* ── 본문 영역 ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* 메인 캔버스 */}
        <div className="flex-1 overflow-y-auto bg-muted/10 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md px-4">
            {/* 일러스트 */}
            <div className="flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/60">
                <svg width="52" height="44" viewBox="0 0 52 44" fill="none" className="opacity-40">
                  <rect x="2" y="8" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <rect x="8" y="2" width="30" height="22" rx="3" stroke="currentColor" strokeWidth="2" fill="white"/>
                  <line x1="14" y1="10" x2="32" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="14" y1="18" x2="26" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="40" cy="34" r="8" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <line x1="46" y1="40" x2="50" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">
                새로운 질문을 만들거나, 컬렉션에서 기존 질문을
                <br />찾아보세요.
              </p>
              <p className="text-sm text-muted-foreground">
                링크 또는 텍스트 카드를 추가합니다. 카드를 수동으로 정렬하거나{" "}
                <button className="text-primary hover:underline">섹션을 추가</button>
                하여 기본 레이아웃으로 시작할 수 있습니다.
              </p>
            </div>

            <button
              onClick={() => setRightPanelOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              차트 추가
            </button>
          </div>
        </div>

        {/* 우측 패널 */}
        {rightPanelOpen && (
          <div className="animate-in slide-in-from-right duration-200">
            <RightPanel
              onClose={() => setRightPanelOpen(false)}
              collectionId={collectionId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
