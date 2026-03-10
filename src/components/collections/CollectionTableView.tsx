"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search, Plus, Settings, FolderOpen, LayoutDashboard,
  Table2, Cpu, Info, MoreHorizontal, MoveRight, Share2,
  Calendar, ChevronUp, ChevronDown, Trash2, Pencil, Check, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FolderEntry, EntryType, CollectionFolder } from "@/lib/mock-data/collection-folders";
import { NewDashboardModal } from "@/components/dashboard/NewDashboardModal";

/* ── 타입 아이콘 ── */
function EntryIcon({ type }: { type: EntryType }) {
  if (type === "dashboard") return <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />;
  if (type === "collection") return <FolderOpen className="h-4 w-4 text-primary shrink-0" />;
  if (type === "question")   return <Table2 className="h-4 w-4 text-primary shrink-0" />;
  return <Cpu className="h-4 w-4 text-primary shrink-0" />;
}

type SortDir = "asc" | "desc";

/* ── 행 더보기 메뉴 ── */
function RowMoreMenu({ entry, onDelete, onRename }: {
  entry: FolderEntry;
  onDelete: () => void;
  onRename: (name: string) => void;
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
      {/* 이름 변경 인라인 */}
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
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 새 컬렉션 모달 ── */
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
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
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
          >
            만들기
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── + 새로운 드롭다운 ── */
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
                href="/questions/pick"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Table2 className="h-4 w-4 text-primary" />새 질문
              </Link>
            </div>
          </div>
        )}
      </div>
      <NewDashboardModal open={dashModal} onClose={() => setDashModal(false)} />
    </>
  );
}

/* ── 메인 컴포넌트 ── */
interface CollectionTableViewProps {
  folder: CollectionFolder;
  breadcrumb?: { label: string; href: string }[];
  onDelete: (entryId: string) => void;
  onRename: (entryId: string, name: string) => void;
  onCreateFolder: (name: string) => void;
}

export function CollectionTableView({
  folder, breadcrumb = [], onDelete, onRename, onCreateFolder,
}: CollectionTableViewProps) {
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [newFolderOpen, setNewFolderOpen] = React.useState(false);

  const filtered = folder.entries.filter((e) =>
    !search.trim() || e.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const cmp = a.name.localeCompare(b.name, "ko");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const allChecked = sorted.length > 0 && sorted.every((e) => selected.has(e.id));

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(sorted.map((e) => e.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-12 w-full">

      {/* ── 상단 바 (우측 정렬) ── */}
      <div className="flex items-center justify-end gap-3">
        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="조회"
            className="w-44 rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* + 새로운 */}
        <NewDropdown onNewFolder={() => setNewFolderOpen(true)} folderId={folder.id} />

        {/* 설정 */}
        <button className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* ── 컬렉션 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          {breadcrumb.length > 0 && (
            <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              {breadcrumb.map((b, i) => (
                <React.Fragment key={b.href}>
                  {i > 0 && <span>/</span>}
                  <Link href={b.href} className="hover:text-foreground transition-colors">{b.label}</Link>
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
        </div>

        {/* 액션 아이콘 */}
        <div className="flex items-center gap-1">
          <button title="이동" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MoveRight className="h-4 w-4" />
          </button>
          <button title="공유" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
          <button title="일정" className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Calendar className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>
          <button title="정보" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Info className="h-4 w-4" />
          </button>
          <button title="더보기" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── 테이블 ── */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <table className="w-full text-sm border-collapse">
          {/* 헤더 */}
          <thead>
            <tr className="border-b border-border bg-background">
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
              </th>
              <th className="w-14 px-2 py-3 text-left text-xs font-semibold text-muted-foreground">타입</th>
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

          {/* 본문 */}
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  {search ? `"${search}"에 해당하는 항목이 없습니다` : "이 컬렉션은 비어 있습니다"}
                </td>
              </tr>
            ) : (
              sorted.map((entry) => {
                const isChecked = selected.has(entry.id);
                return (
                  <tr
                    key={entry.id}
                    className={cn(
                      "border-b border-border/60 last:border-0 transition-colors group",
                      isChecked ? "bg-primary/5" : "hover:bg-muted/30"
                    )}
                  >
                    {/* 체크박스 */}
                    <td className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(entry.id)}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                    </td>

                    {/* 타입 아이콘 */}
                    <td className="w-14 px-2 py-3">
                      <EntryIcon type={entry.type} />
                    </td>

                    {/* 이름 */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={entry.href}
                          className={cn(
                            "font-semibold hover:underline transition-colors",
                            entry.type === "collection"
                              ? "text-foreground"
                              : "text-foreground hover:text-primary"
                          )}
                        >
                          {entry.name}
                        </Link>
                        <button
                          title="정보"
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                        >
                          <Info className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </td>

                    {/* 최종 편집자 */}
                    <td className="px-4 py-3 text-sm text-muted-foreground w-36">
                      {entry.lastEditor ?? ""}
                    </td>

                    {/* 수정 시간 */}
                    <td className="px-4 py-3 text-sm text-muted-foreground w-40">
                      {entry.lastModified ?? ""}
                    </td>

                    {/* 더보기 */}
                    <td className="w-10 px-2 py-3">
                      <RowMoreMenu
                        entry={entry}
                        onDelete={() => onDelete(entry.id)}
                        onRename={(name) => onRename(entry.id, name)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 선택 항목 수 */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-xl border border-border bg-background shadow-xl px-5 py-3 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-medium text-foreground">{selected.size}개 선택됨</span>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => {
              selected.forEach((id) => onDelete(id));
              setSelected(new Set());
            }}
            className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" />삭제
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            취소
          </button>
        </div>
      )}

      {/* 새 컬렉션 모달 */}
      <NewFolderModal
        open={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        onSubmit={onCreateFolder}
      />
    </div>
  );
}
