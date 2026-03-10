import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight, Database, MessageSquarePlus, LayoutTemplate,
  Rows3, Columns3, Calendar, Hash,
} from "lucide-react";
import { getRegistryEntry } from "@/lib/dataset-registry";
import { dataCatalog, categoryMeta, chartTypeLabels } from "@/lib/data-catalog";
import { SchemaTable } from "@/components/browse/SchemaTable";
import { DataPreviewTable } from "@/components/browse/DataPreviewTable";
import { cn } from "@/lib/utils";

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  credit:    { bg: "bg-blue-50 dark:bg-blue-950",    text: "text-blue-600 dark:text-blue-400" },
  market:    { bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400" },
  liquidity: { bg: "bg-teal-50 dark:bg-teal-950",    text: "text-teal-600 dark:text-teal-400" },
};

export default function BrowseDatasetPage({ params }: { params: { datasetId: string } }) {
  const entry = getRegistryEntry(params.datasetId);
  if (!entry) notFound();

  const { meta, schema, queryFn } = entry;
  const rows = queryFn();
  const catMeta = categoryMeta[meta.category as keyof typeof categoryMeta];
  const catColor = CATEGORY_COLOR[meta.category] ?? CATEGORY_COLOR.credit;

  const dateColumns = schema.columns.filter((c) => c.type === "date").length;
  const measureColumns = schema.columns.filter((c) => c.role === "measure").length;
  const dimensionColumns = schema.columns.filter((c) => c.role === "dimension").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/browse" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Database className="h-3.5 w-3.5" />
          데이터 탐색
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className={cn("font-medium", catColor.text)}>{catMeta?.label}</span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{meta.label}</span>
      </nav>

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shrink-0", catColor.bg)}>
            <Database className={cn("h-5 w-5", catColor.text)} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{meta.label}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/questions/new`}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <MessageSquarePlus className="h-4 w-4" />
            질문 만들기
          </Link>
          <Link
            href="/builder"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <LayoutTemplate className="h-4 w-4" />
            대시보드에 추가
          </Link>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Rows3, label: "총 행수", value: rows.length.toLocaleString(), sub: "rows" },
          { icon: Columns3, label: "컬럼 수", value: schema.columns.length, sub: "columns" },
          { icon: Hash, label: "측정값", value: measureColumns, sub: "measures" },
          { icon: Calendar, label: "날짜 컬럼", value: dateColumns, sub: "date cols" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={sub} className="mb-card p-4 text-center">
            <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* 태그 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("text-xs font-medium px-2 py-1 rounded-full", catColor.bg, catColor.text)}>
          {catMeta?.label}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
          기본 차트: {chartTypeLabels[meta.defaultChart] ?? meta.defaultChart}
        </span>
        {meta.compatibleCharts.map((ct) => (
          <span key={ct} className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
            {chartTypeLabels[ct] ?? ct}
          </span>
        ))}
        {schema.defaultDateColumn && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            날짜 기준: {schema.defaultDateColumn}
          </span>
        )}
      </div>

      {/* 스키마 */}
      <div className="mb-card overflow-hidden">
        <div className="mb-card-header">
          <div className="flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-muted-foreground" />
            <span className="mb-card-title">스키마</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {dimensionColumns}개 차원 · {measureColumns}개 측정값
          </span>
        </div>
        <SchemaTable columns={schema.columns} />
      </div>

      {/* 데이터 미리보기 */}
      <div className="mb-card overflow-hidden">
        <div className="mb-card-header">
          <div className="flex items-center gap-2">
            <Rows3 className="h-4 w-4 text-muted-foreground" />
            <span className="mb-card-title">데이터 미리보기</span>
          </div>
          <span className="text-xs text-muted-foreground">클릭하여 정렬</span>
        </div>
        <div className="p-4">
          <DataPreviewTable columns={schema.columns} rows={rows} maxRows={20} />
        </div>
      </div>
    </div>
  );
}
