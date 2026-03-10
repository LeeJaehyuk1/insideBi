"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRight, Database, MessageSquarePlus, LayoutTemplate,
  Rows3, Columns3, Calendar, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SchemaTable } from "./SchemaTable";
import { DataPreviewTable } from "./DataPreviewTable";
import { BrowseFilterPanel } from "./BrowseFilterPanel";
import { DataPreviewChart } from "./DataPreviewChart";
import { ColumnStats } from "./ColumnStats";
import { executeQuery } from "@/lib/query-engine";
import type { FilterParam } from "@/types/query";

import type { DatasetSchema } from "@/types/dataset";
import type { DatasetMeta } from "@/types/builder";

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  credit:    { bg: "bg-blue-50 dark:bg-blue-950",    text: "text-blue-600 dark:text-blue-400" },
  market:    { bg: "bg-violet-50 dark:bg-violet-950", text: "text-violet-600 dark:text-violet-400" },
  liquidity: { bg: "bg-teal-50 dark:bg-teal-950",    text: "text-teal-600 dark:text-teal-400" },
};

interface BrowseDatasetClientProps {
  meta: DatasetMeta;
  schema: DatasetSchema;
  rawRows: Record<string, unknown>[];
  catLabel: string;
}

export function BrowseDatasetClient({
  meta,
  schema,
  rawRows,
  catLabel,
}: BrowseDatasetClientProps) {
  const [filters, setFilters] = React.useState<FilterParam[]>([]);
  const catColor = CATEGORY_COLOR[meta.category] ?? CATEGORY_COLOR.credit;

  const [filteredRows, setFilteredRows] = React.useState(rawRows);

  React.useEffect(() => {
    const active = filters.filter((f) => f.value !== "");
    if (active.length === 0) {
      setFilteredRows(rawRows);
      return;
    }
    executeQuery({ datasetId: meta.id, filters: active }).then((result) => {
      setFilteredRows(result.data as Record<string, unknown>[]);
    });
  }, [filters, rawRows, meta.id]);

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
        <span className={cn("font-medium", catColor.text)}>{catLabel}</span>
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
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/questions/new"
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
          { icon: Rows3,    label: "총 행수",   value: filteredRows.length.toLocaleString(), sub: "rows" },
          { icon: Columns3, label: "컬럼 수",   value: schema.columns.length,               sub: "columns" },
          { icon: Hash,     label: "측정값",    value: measureColumns,                      sub: "measures" },
          { icon: Calendar, label: "날짜 컬럼", value: dateColumns,                         sub: "date cols" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={sub} className="mb-card p-4 text-center">
            <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* 필터 패널 */}
      <BrowseFilterPanel
        schema={schema}
        filters={filters}
        onChange={setFilters}
      />

      {/* 차트 미리보기 */}
      <DataPreviewChart meta={meta} filters={filters} />

      {/* 컬럼 통계 */}
      <ColumnStats columns={schema.columns} rows={filteredRows} />

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
          <span className="text-xs text-muted-foreground">
            {filters.filter((f) => f.value !== "").length > 0
              ? `필터 적용됨 · ${filteredRows.length}행`
              : "클릭하여 정렬"}
          </span>
        </div>
        <div className="p-4">
          <DataPreviewTable columns={schema.columns} rows={filteredRows} maxRows={20} />
        </div>
      </div>
    </div>
  );
}
