"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionTableView } from "@/components/collections/CollectionTableView";
import { CollectionSidebar } from "@/components/collections/CollectionSidebar";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";
import { NewDashboardModal } from "@/components/dashboard/NewDashboardModal";

/* ── 빈 컬렉션 상태 ── */
function EmptyCollection({ folderName, folderId }: { folderName: string; folderId: string }) {
  const [dashModal, setDashModal] = React.useState(false);
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
      <button
        onClick={() => setDashModal(true)}
        className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <Plus className="h-4 w-4" />새로운
      </button>
      <NewDashboardModal open={dashModal} onClose={() => setDashModal(false)} />
    </div>
  );
}

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  const { getFolder, hydrated, createFolder, removeEntry, renameEntry } = useCollectionFolders();

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] -m-6">
        <div className="w-64 border-r border-border p-4 space-y-3">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
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
      <main className="flex-1 overflow-y-auto px-8 py-6 flex flex-col">
        {folder.entries.length === 0 ? (
          <>
            {/* 헤더만 표시 */}
            <div className="flex items-center justify-between mb-8">
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
            </div>
            <EmptyCollection folderName={folder.name} folderId={folder.id} />
          </>
        ) : (
          <CollectionTableView
            folder={folder}
            breadcrumb={breadcrumb}
            onDelete={(id) => removeEntry(params.id, id)}
            onRename={(id, name) => renameEntry(params.id, id, name)}
            onCreateFolder={(name) => createFolder(name, params.id)}
          />
        )}
      </main>
    </div>
  );
}
