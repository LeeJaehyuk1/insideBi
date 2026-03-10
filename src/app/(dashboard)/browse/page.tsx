import { Database, Layers } from "lucide-react";
import { getAllRegistryEntries } from "@/lib/dataset-registry";
import { dataCatalog, categoryMeta, CATEGORY_ORDER } from "@/lib/data-catalog";
import { DatasetCard } from "@/components/browse/DatasetCard";

export default function BrowsePage() {
  const entries = getAllRegistryEntries();

  function getStats(id: string) {
    const entry = entries.find((e) => e.meta.id === id);
    if (!entry) return { rowCount: 0, columnCount: 0 };
    return {
      rowCount: entry.queryFn().length,
      columnCount: entry.schema.columns.length,
    };
  }

  const totalDatasets = dataCatalog.length;
  const totalRows = entries.reduce((sum, e) => sum + e.queryFn().length, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">

      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-bold text-foreground">데이터 탐색</h1>
        <p className="text-sm text-muted-foreground mt-0.5">모든 데이터셋의 스키마와 데이터를 조회합니다</p>
      </div>

      {/* 데이터베이스 카드 */}
      <div className="mb-card p-5 flex items-center gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <Database className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">InsightBi 데이터베이스</p>
          <p className="text-sm text-muted-foreground mt-0.5">금융 리스크관리 모의 데이터 (Mock)</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              {totalDatasets}개 데이터셋
            </span>
            <span className="text-xs text-muted-foreground">
              총 {totalRows.toLocaleString()}행
            </span>
          </div>
        </div>
        <div className="flex h-2.5 w-2.5 rounded-full bg-green-500 shrink-0" title="연결됨" />
      </div>

      {/* 카테고리별 데이터셋 목록 */}
      {CATEGORY_ORDER.map((cat) => {
        const catDatasets = dataCatalog.filter((d) => d.category === cat);
        const meta = categoryMeta[cat];
        return (
          <section key={cat}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className={`text-xs font-bold uppercase tracking-widest ${meta.color}`}>
                {meta.label}
              </h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{catDatasets.length}개</span>
            </div>
            <div className="space-y-2">
              {catDatasets.map((ds) => {
                const stats = getStats(ds.id);
                return (
                  <DatasetCard
                    key={ds.id}
                    dataset={ds}
                    rowCount={stats.rowCount}
                    columnCount={stats.columnCount}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
