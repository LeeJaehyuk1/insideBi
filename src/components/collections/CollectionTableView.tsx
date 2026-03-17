"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search, Plus, FolderOpen, LayoutDashboard, Table2, Cpu,
  Info, MoreHorizontal, MoveRight, Share2, Calendar,
  ChevronUp, ChevronDown, Trash2, Pencil, X, Pin,
  Asterisk, Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FolderEntry, EntryType, CollectionFolder } from "@/lib/mock-data/collection-folders";
import { NewDashboardModal } from "@/components/dashboard/NewDashboardModal";
import { BookmarkButton } from "@/components/ui/BookmarkButton";
import type { BookmarkType } from "@/hooks/useBookmarks";

/* ── 타입 라벨 ── */
function typeLabel(type: EntryType) {
  switch (type) {
    case "dashboard":   return "대시보드";
    case "question":    return "질문";
    case "collection":  return "컬렉션";
    case "model":       return "모델";
  }
}

/* ── 타입 아이콘 ── */
function EntryIcon({ type, size = "sm" }: { type: EntryType; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : "h-4 w-4";
  if (type === "dashboard")  return <LayoutDashboard className={cn(cls, "text-primary shrink-0")} />;
  if (type === "collection") return <FolderOpen className={cn(cls, "text-primary shrink-0")} />;
  if (type === "question")   return <Table2 className={cn(cls, "text-primary shrink-0")} />;
  return <Cpu className={cn(cls, "text-primary shrink-0")} />;
}

type SortDir = "asc" | "desc";

/* ══════════════════════════════════════
   고정 항목 카드
══════════════════════════════════════ */
function PinnedCard({ entry, onUnpin, onDelete, onRename }: {
  entry: FolderEntry;
  onUnpin: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(entry.name);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative group rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        {/* 아이콘 배지 */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
          <EntryIcon type={entry.type} size="lg" />
        </div>
        {/* 텍스트 */}
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
            {typeLabel(entry.type)}
          </p>
          <Link
            href={entry.href}
            className="font-semibold text-foreground hover:text-primary text-sm leading-tight block truncate"
          >
            {entry.name}
          </Link>
          {entry.lastEditor && (
            <p className="text-xs text-muted-foreground mt-1.5 truncate">
              {entry.lastEditor} · {entry.lastModified}
            </p>
          )}
        </div>
      </div>

      {/* 3-dot 메뉴 */}
      <div ref={ref} className="absolute top-3 right-3">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p); }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-background shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-1 space-y-0.5">
              <button
                onClick={() => { onUnpin(); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pin className="h-3.5 w-3.5 text-muted-foreground" />고정 해제
              </button>
              <button
                onClick={() => { setRenaming(true); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />이름 변경
              </button>
              <div className="h-px bg-border my-0.5" />
              <button
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />삭제
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 이름 변경 모달 */}
      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl p-5 w-80 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-foreground">이름 변경</h3>
            <input
              autoFocus value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) { onRename(name.trim()); setRenaming(false); }
                if (e.key === "Escape") setRenaming(false);
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenaming(false)} className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-muted transition-colors">취소</button>
              <button
                onClick={() => { if (name.trim()) { onRename(name.trim()); setRenaming(false); } }}
                disabled={!name.trim()}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   행 더보기 메뉴
══════════════════════════════════════ */
function RowMoreMenu({ entry, onDelete, onRename, onTogglePin }: {
  entry: FolderEntry;
  onDelete: () => void;
  onRename: (name: string) => void;
  onTogglePin: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [renaming, setRenaming] = React.useState(false);
  const [name, setName] = React.useState(entry.name);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((p) => !p); }}
        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-background shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-1 space-y-0.5">
            {entry.type !== "collection" && (
              <button
                onClick={() => { onTogglePin(); setOpen(false); }}
                className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pin className="h-3.5 w-3.5 text-muted-foreground" />
                {entry.pinned ? "고정 해제" : "고정"}
              </button>
            )}
            <button
              onClick={() => { setRenaming(true); setOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />이름 변경
            </button>
            <div className="h-px bg-border my-0.5" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />삭제
            </button>
          </div>
        </div>
      )}
      {renaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-xl shadow-2xl p-5 w-80 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-foreground">이름 변경</h3>
            <input
              autoFocus value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) { onRename(name.trim()); setRenaming(false); }
                if (e.key === "Escape") setRenaming(false);
              }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenaming(false)} className="rounded-lg border border-border px-4 py-1.5 text-sm hover:bg-muted transition-colors">취소</button>
              <button
                onClick={() => { if (name.trim()) { onRename(name.trim()); setRenaming(false); } }}
                disabled={!name.trim()}
                className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   새 컬렉션 모달
══════════════════════════════════════ */
function NewFolderModal({ open, onClose, onSubmit }: {
  open: boolean; onClose: () => void; onSubmit: (name: string) => void;
}) {
  const [name, setName] = React.useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-xl shadow-2xl p-6 w-96 space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">새 컬렉션</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">이름</label>
          <input
            autoFocus value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) { onSubmit(name.trim()); onClose(); } }}
            placeholder="컬렉션 이름을 입력하세요"
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">취소</button>
          <button
            onClick={() => { if (name.trim()) { onSubmit(name.trim()); onClose(); } }}
            disabled={!name.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >만들기</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   + 새로운 드롭다운
══════════════════════════════════════ */
function NewDropdown({ onNewFolder, folderId }: { onNewFolder: () => void; folderId: string }) {
  const [open, setOpen] = React.useState(false);
  const [dashModal, setDashModal] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />새로운
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-border bg-background shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-1 space-y-0.5">
              <button
                onClick={() => { onNewFolder(); setOpen(false); }}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <FolderOpen className="h-4 w-4 text-primary" />새 컬렉션
              </button>
              <button
                onClick={() => { setDashModal(true); setOpen(false); }}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-primary" />새 대시보드
              </button>
              <Link
                href={`/questions/pick?collection=${folderId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Asterisk className="h-4 w-4 text-primary" />새 질문
              </Link>
              <Link
                href={`/questions/new?collection=${folderId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Terminal className="h-4 w-4 text-muted-foreground" />SQL 쿼리
              </Link>
            </div>
          </div>
        )}
      </div>
      <NewDashboardModal open={dashModal} onClose={() => setDashModal(false)} defaultCollectionId={folderId} />
    </>
  );
}

/* ══════════════════════════════════════
   정보 사이드바 (fixed 우측 패널)
══════════════════════════════════════ */
function InfoSidebar({ folder, onClose }: { folder: CollectionFolder; onClose: () => void }) {
  const total = folder.entries.length;
  const pinned = folder.entries.filter((e) => e.pinned).length;
  const typeCount = folder.entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="fixed right-0 top-14 bottom-0 w-72 border-l border-border bg-background shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="font-semibold text-foreground text-sm">컬렉션 정보</h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">이름</p>
          <p className="text-sm font-medium text-foreground">{folder.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground mb-1">전체 항목</p>
            <p className="text-lg font-bold text-foreground">{total}</p>
          </div>
          {pinned > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground mb-1">고정됨</p>
              <p className="text-lg font-bold text-foreground">{pinned}</p>
            </div>
          )}
        </div>

        {Object.entries(typeCount).length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">항목 유형</p>
            <div className="space-y-2">
              {Object.entries(typeCount).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <EntryIcon type={type as EntryType} />
                    <span className="text-foreground">{typeLabel(type as EntryType)}</span>
                  </div>
                  <span className="font-medium text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">기타</p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>우리의 분석 컬렉션</p>
            <p>모든 팀원이 접근 가능</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   빈 컬렉션 상태
══════════════════════════════════════ */
function EmptyState({ folderId }: { folderId: string }) {
  const [dashModal, setDashModal] = React.useState(false);
  return (
    <>
      <div className="flex flex-col items-center justify-center py-24 text-center max-w-sm mx-auto">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-5">
          <FolderOpen className="h-10 w-10 text-muted-foreground opacity-40" />
        </div>
        <p className="text-lg font-bold text-foreground mb-2">이 컬렉션은 비어 있습니다.</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          컬렉션을 사용하여 질문, 대시보드, 모델 및 기타 컬렉션을 구성합니다.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href={`/questions/pick?collection=${folderId}`}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Asterisk className="h-4 w-4 text-primary" />새 질문
          </Link>
          <button
            onClick={() => setDashModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />새 대시보드
          </button>
        </div>
      </div>
      <NewDashboardModal open={dashModal} onClose={() => setDashModal(false)} defaultCollectionId={folderId} />
    </>
  );
}

/* ══════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════ */
interface CollectionTableViewProps {
  folder: CollectionFolder;
  breadcrumb?: { label: string; href: string }[];
  onDelete: (entryId: string) => void;
  onRename: (entryId: string, name: string) => void;
  onCreateFolder: (name: string) => void;
  onTogglePin: (entryId: string) => void;
}

const PAGE_SIZE = 25;

export function CollectionTableView({
  folder, breadcrumb = [], onDelete, onRename, onCreateFolder, onTogglePin,
}: CollectionTableViewProps) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);
  const [infoOpen, setInfoOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const pinnedEntries = folder.entries.filter((e) => e.pinned);
  const unpinnedEntries = folder.entries.filter((e) => !e.pinned);
  const isEmpty = folder.entries.length === 0;

  const filtered = unpinnedEntries.filter((e) =>
    !search.trim() || e.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name, "ko");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset to page 1 when search changes
  React.useEffect(() => { setPage(1); }, [search]);

  const allChecked = paginated.length > 0 && paginated.every((e) => selected.has(e.id));

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(paginated.map((e) => e.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="pb-12 w-full">

      {/* ══ 헤더 ══ */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
              {breadcrumb.map((b, i) => (
                <React.Fragment key={b.href}>
                  {i > 0 && <span className="select-none">/</span>}
                  <Link href={b.href} className="hover:text-foreground transition-colors">{b.label}</Link>
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
        </div>

        <div className="flex items-center gap-1.5 mt-0.5">
          <NewDropdown onNewFolder={() => setNewFolderOpen(true)} folderId={folder.id} />
          <div className="w-px h-5 bg-border mx-0.5" />
          <button title="이동" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MoveRight className="h-4 w-4" />
          </button>
          <button title="공유" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
          <button title="타임라인" className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Calendar className="h-4 w-4" />
          </button>
          <button
            title="컬렉션 정보"
            onClick={() => setInfoOpen((p) => !p)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              infoOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEmpty ? (
        /* ══ 빈 상태 ══ */
        <EmptyState folderId={folder.id} />
      ) : (
        <>
          {/* ══ 고정된 항목 섹션 ══ */}
          {pinnedEntries.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Pin className="h-3.5 w-3.5 text-muted-foreground fill-current" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">고정된 항목</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinnedEntries.map((entry) => (
                  <PinnedCard
                    key={entry.id}
                    entry={entry}
                    onUnpin={() => onTogglePin(entry.id)}
                    onDelete={() => onDelete(entry.id)}
                    onRename={(name) => onRename(entry.id, name)}
                  />
                ))}
              </div>
              <div className="mt-6 border-t border-border" />
            </div>
          )}

          {/* ══ 테이블 툴바 ══ */}
          <div className="flex items-center justify-between mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="조회"
                className="w-52 rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <span className="text-xs text-muted-foreground">{unpinnedEntries.length}개 항목</span>
          </div>

          {/* ══ 테이블 ══ */}
          <div className="rounded-xl border border-border bg-background overflow-visible">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                  </th>
                  <th className="w-12 px-2 py-3 text-left text-xs font-semibold text-muted-foreground">타입</th>
                  <th
                    className="px-3 py-3 text-left cursor-pointer select-none"
                    onClick={() => setSortDir((p) => p === "asc" ? "desc" : "asc")}
                  >
                    <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                      이름
                      {sortDir === "asc"
                        ? <ChevronUp className="h-3 w-3" />
                        : <ChevronDown className="h-3 w-3" />
                      }
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-36">최종 편집자</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-40">마지막 수정 시간</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      {search ? `"${search}"에 해당하는 항목이 없습니다` : "이 컬렉션은 비어 있습니다"}
                    </td>
                  </tr>
                ) : paginated.map((entry) => {
                  const isChecked = selected.has(entry.id);
                  return (
                    <tr
                      key={entry.id}
                      className={cn(
                        "border-b border-border/60 last:border-0 transition-colors group",
                        isChecked ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                    >
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(entry.id)}
                          className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                        />
                      </td>
                      <td className="w-12 px-2 py-3">
                        <EntryIcon type={entry.type} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={entry.href}
                            className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                          >
                            {entry.name}
                          </Link>
                          <BookmarkButton
                            item={{
                              id: entry.id,
                              type: (entry.type === "question" || entry.type === "dashboard" || entry.type === "collection"
                                ? entry.type : "question") as BookmarkType,
                              name: entry.name,
                              href: entry.href,
                            }}
                            className="opacity-0 group-hover:opacity-100"
                          />
                          <button
                            title="정보"
                            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                          >
                            <Info className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground w-36">{entry.lastEditor ?? ""}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground w-40">{entry.lastModified ?? ""}</td>
                      <td className="w-10 px-2 py-3">
                        <RowMoreMenu
                          entry={entry}
                          onDelete={() => onDelete(entry.id)}
                          onRename={(name) => onRename(entry.id, name)}
                          onTogglePin={() => onTogglePin(entry.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ══ 페이지네이션 ══ */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-1">
              <span className="text-xs text-muted-foreground">
                {sorted.length}개 중 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)}개 표시
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5 -rotate-90" />
                </button>
                <span className="text-xs text-muted-foreground px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ 선택 항목 액션 바 ══ */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border border-border bg-background shadow-xl px-5 py-3 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-medium text-foreground">{selected.size}개 선택됨</span>
          <div className="h-4 w-px bg-border" />
          <button className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors">
            <MoveRight className="h-3.5 w-3.5" />이동
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => { selected.forEach((id) => onDelete(id)); setSelected(new Set()); }}
            className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" />삭제
          </button>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            취소
          </button>
        </div>
      )}

      {/* ══ 새 컬렉션 모달 ══ */}
      <NewFolderModal
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onSubmit={onCreateFolder}
      />

      {/* ══ 정보 사이드바 ══ */}
      {infoOpen && <InfoSidebar folder={folder} onClose={() => setInfoOpen(false)} />}
    </div>
  );
}
