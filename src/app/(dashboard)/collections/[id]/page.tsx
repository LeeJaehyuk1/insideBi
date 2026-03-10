"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FolderOpen, Plus, Asterisk, Terminal, LayoutDashboard,
  MoveRight, Share2, Calendar, Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionTableView } from "@/components/collections/CollectionTableView";
import { CollectionSidebar } from "@/components/collections/CollectionSidebar";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";
import { NewDashboardModal } from "@/components/dashboard/NewDashboardModal";
import { cn } from "@/lib/utils";

/* ── 새로운 버튼 + 하단 드롭다운 ── */
function NewDropdown({ collectionId }: { collectionId: string }) {
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
      <div ref={ref} className="relative inline-block">
        <button
          onClick={() => setOpen((p) => !p)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors",
            open
              ? "border-primary text-primary bg-primary/5"
              : "border-border text-foreground hover:bg-muted"
          )}
        >
          <Plus className="h-4 w-4" />새로운
        </button>

        {/* 하단으로 펼쳐지는 드롭다운 */}
        {open && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-background shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-1.5 space-y-0.5">
              {/* 질문 */}
              <Link
                href={`/questions/pick?collection=${collectionId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Asterisk className="h-4 w-4 text-primary shrink-0" />
                질문
              </Link>

              {/* SQL 쿼리 */}
              <Link
                href={`/questions/new?collection=${collectionId}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Terminal className="h-4 w-4 text-muted-foreground shrink-0" />
                SQL 쿼리
              </Link>

              {/* 대시보드 */}
              <button
                onClick={() => { setOpen(false); setDashModal(true); }}
                className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
              >
                <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />
                대시보드
              </button>
            </div>
          </div>
        )}
      </div>

      <NewDashboardModal
        open={dashModal}
        onClose={() => setDashModal(false)}
        defaultCollectionId={collectionId}
      />
    </>
  );
}

/* ── 빈 컬렉션 상태 ── */
function EmptyCollection({ folder }: { folder: { id: string; name: string } }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 py-24 text-center max-w-sm mx-auto">
      {/* 폴더 일러스트 */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted/50">
        <FolderOpen className="h-12 w-12 text-muted-foreground opacity-40" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-bold text-foreground">이 컬렉션은 비어 있습니다.</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          컬렉션을 사용하여 질문, 대시보드, 모델 및 기타 컬렉션을 구성합니다.
        </p>
      </div>
      <NewDropdown collectionId={folder.id} />
    </div>
  );
}

/* ── 컬렉션 헤더 액션 ── */
function CollectionHeaderActions() {
  return (
    <div className="flex items-center gap-1">
      <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
        <MoveRight className="h-4 w-4" />
      </button>
      <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
        <Share2 className="h-4 w-4" />
      </button>
      <button className="relative flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
        <Calendar className="h-4 w-4" />
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
      </button>
      <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
        <Info className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  const { getFolder, hydrated, createFolder, removeEntry, renameEntry } = useCollectionFolders();

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] -m-6">
        <div className="w-56 border-r border-border p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const folder = getFolder(params.id);
  if (!folder) notFound();

  /* 브레드크럼 */
  const breadcrumb: { label: string; href: string }[] = [];
  if (folder.parentId) {
    const parent = getFolder(folder.parentId);
    if (parent) {
      breadcrumb.push({
        label: parent.name,
        href: parent.id === ROOT_ID ? "/collections" : `/collections/${parent.id}`,
      });
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 overflow-hidden">
      <CollectionSidebar />
      <main className="flex-1 overflow-y-auto flex flex-col">

        {folder.entries.length === 0 ? (
          /* 빈 상태 */
          <>
            <div className="flex items-center justify-between px-8 pt-6 pb-2 shrink-0">
              <h1 className="text-2xl font-bold text-foreground">{folder.name}</h1>
              <CollectionHeaderActions />
            </div>
            <EmptyCollection folder={folder} />
          </>
        ) : (
          /* 아이템 있을 때: 테이블 뷰 */
          <div className="px-8 py-6">
            <CollectionTableView
              folder={folder}
              breadcrumb={breadcrumb}
              onDelete={(id) => removeEntry(params.id, id)}
              onRename={(id, name) => renameEntry(params.id, id, name)}
              onCreateFolder={(name) => createFolder(name, params.id)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
