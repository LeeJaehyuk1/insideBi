import { notFound } from "next/navigation";
import Link from "next/link";
import { Database, BookOpen, ChevronRight, LayoutGrid } from "lucide-react";
import { getDbInfo, DB_TABLES } from "@/lib/db-catalog";

export default function DbTableListPage({ params }: { params: { dbId: string } }) {
  const db = getDbInfo(params.dbId);
  if (!db) notFound();

  const tables = DB_TABLES[params.dbId] ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">데이터베이스</h1>
        </div>
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <BookOpen className="h-4 w-4" />
          데이터에 대해 알아보기
        </button>
      </div>

      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1.5 text-sm">
        <Link href="/browse" className="text-muted-foreground hover:text-foreground transition-colors">
          데이터베이스
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-semibold text-foreground uppercase tracking-wide">
          {db.label}
        </span>
      </nav>

      {/* 테이블 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map((table) => (
          <Link
            key={table.tableId}
            href={`/browse/${params.dbId}/${table.tableId}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-4 hover:border-primary/40 hover:shadow-sm transition-all group"
          >
            <LayoutGrid className="h-5 w-5 text-primary shrink-0" />
            <span className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
              {table.label}
            </span>
          </Link>
        ))}
      </div>

      {/* 테이블 수 */}
      <p className="text-xs text-muted-foreground">
        총 {tables.length}개 테이블
      </p>
    </div>
  );
}
