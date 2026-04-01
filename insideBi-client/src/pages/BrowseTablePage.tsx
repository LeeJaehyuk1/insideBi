import * as React from "react";
import { useParams, Navigate } from "react-router-dom";
import { getDbInfo, getTableInfo } from "@/lib/db-catalog";
import { TableDetailClient } from "@/components/browse/TableDetailClient";
import { api } from "@/lib/api-client";

export default function BrowseTablePage() {
  const { dbId = "", tableId = "" } = useParams<{ dbId: string; tableId: string }>();
  const [rows, setRows] = React.useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = React.useState(true);

  const db = getDbInfo(dbId);
  const table = getTableInfo(dbId, tableId);

  React.useEffect(() => {
    if (!table) return;
    setLoading(true);
    api
      .post("/api/db-query", { sql: `SELECT * FROM "${tableId}" LIMIT 2000` })
      .then((res) => setRows(res.data?.rows ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [tableId, table]);

  if (!db || !table) return <Navigate to={`/browse/${dbId}`} replace />;
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        데이터 로딩 중...
      </div>
    );
  }

  return (
    <TableDetailClient
      dbId={dbId}
      dbLabel={db.label}
      tableId={tableId}
      tableLabel={table.label}
      rows={rows}
    />
  );
}
