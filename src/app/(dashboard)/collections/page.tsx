import { FolderOpen, Plus } from "lucide-react";
import { collections } from "@/lib/mock-data/collections";
import { CollectionCard } from "@/components/collections/CollectionCard";

export default function CollectionsPage() {
  const personal = collections.filter((c) => c.personal);
  const shared = collections.filter((c) => !c.personal);

  return (
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
          disabled
          title="새 컬렉션 (준비 중)"
          className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-1.5 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
        >
          <Plus className="h-4 w-4" />
          새 컬렉션
        </button>
      </div>

      {/* 공유 컬렉션 */}
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
    </div>
  );
}
