import { notFound } from "next/navigation";
import { getDbInfo, getTableInfo } from "@/lib/db-catalog";
import { fetchTableRows } from "@/lib/db";
import { TableDetailClient } from "./TableDetailClient";

export default async function TableDetailPage({
  params,
}: {
  params: { dbId: string; tableId: string };
}) {
  const db    = getDbInfo(params.dbId);
  const table = getTableInfo(params.dbId, params.tableId);
  if (!db || !table) notFound();

  // 실제 DB에서 데이터 조회 (최대 2000행)
  const rows = await fetchTableRows(params.tableId, 2000);

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
