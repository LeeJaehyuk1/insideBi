import { notFound } from "next/navigation";
import { getDbInfo, getTableInfo, getTableData } from "@/lib/db-catalog";
import { getRegistryEntry } from "@/lib/dataset-registry";
import { TableDetailClient } from "./TableDetailClient";

export default function TableDetailPage({
  params,
}: {
  params: { dbId: string; tableId: string };
}) {
  const db = getDbInfo(params.dbId);
  const table = getTableInfo(params.dbId, params.tableId);
  if (!db || !table) notFound();

  // registry 연결된 테이블은 mock-data에서, 아니면 db-catalog에서
  let rows: Record<string, unknown>[] = [];
  if (table.datasetId) {
    const entry = getRegistryEntry(table.datasetId);
    if (entry) rows = entry.queryFn() as Record<string, unknown>[];
  }
  if (rows.length === 0) {
    rows = getTableData(params.dbId, params.tableId);
  }

  return (
    <TableDetailClient
      dbId={params.dbId}
      dbLabel={db.label}
      tableId={params.tableId}
      tableLabel={table.label}
      rows={rows}
    />
  );
}
