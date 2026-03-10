"use client";

import * as React from "react";
import { FolderOpen, Plus } from "lucide-react";
import { useCollections } from "@/hooks/useCollections";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CreateCollectionDialog } from "@/components/collections/CreateCollectionDialog";

export default function CollectionsPage() {
  const { collections, hydrated, createCollection } = useCollections();
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const personal = collections.filter((c) => c.personal);
  const shared = collections.filter((c) => !c.personal);

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FolderOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">컬렉션</h1>
              <p className="text-sm text-muted-foreground">대시보드, 질문, 보고서를 컬렉션으로 정리하세요</p>
            </div>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Plus className="h-4 w-4" />
            새 컬렉션
          </button>
        </div>

        {/* 공유 컬렉션 */}
        {shared.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              공유 컬렉션
            </h2>
            <div className="space-y-3">
              {shared.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          </section>
        )}

        {/* 개인 컬렉션 */}
        {personal.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              내 컬렉션
            </h2>
            <div className="space-y-3">
              {personal.map((col) => (
                <CollectionCard key={col.id} collection={col} />
              ))}
            </div>
          </section>
        )}

        {collections.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">컬렉션이 없습니다. 새 컬렉션을 만들어보세요.</p>
          </div>
        )}
      </div>

      <CreateCollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={createCollection}
      />
    </>
  );
}
