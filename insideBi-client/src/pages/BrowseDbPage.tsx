import { useParams, Link, Navigate } from "react-router-dom";
import { Database, ChevronRight } from "lucide-react";
import { getDbInfo, DB_TABLES } from "@/lib/db-catalog";
import TableCardList from "@/components/browse/TableCardList";

export default function BrowseDbPage() {
  const { dbId = "" } = useParams<{ dbId: string }>();
  const db = getDbInfo(dbId);
  if (!db) return <Navigate to="/browse" replace />;

  const tables = DB_TABLES[dbId] ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">데이터베이스</h1>
        </div>
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link to="/browse" className="hover:text-foreground transition-colors">탐색</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{db.label}</span>
        </nav>
      </div>

      <div className="mb-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{db.label}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{db.description}</p>
            <p className="text-xs text-muted-foreground mt-1">스키마: {db.schema}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-4">
          테이블 ({tables.length})
        </h2>
        <TableCardList dbId={dbId} tables={tables} />
      </div>
    </div>
  );
}
