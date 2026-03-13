import { notFound } from "next/navigation";
import { getDbInfo, getTableInfo } from "@/lib/db-catalog";
import { getPool } from "@/lib/db";
import { TableDetailClient } from "./TableDetailClient";

export default async function TableDetailPage({
  params,
}: {
  params: { dbId: string; tableId: string };
}) {
  const db = getDbInfo(params.dbId);
  const table = getTableInfo(params.dbId, params.tableId);
  if (!db || !table) notFound();

  let rows: Record<string, unknown>[] = [];
  try {
    const pool = getPool();
    const result = await pool.query(`SELECT * FROM ${params.tableId} LIMIT 1000`);
    rows = result.rows;
  } catch {
    // DB 연결 실패 시 빈 배열
    rows = [];
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
