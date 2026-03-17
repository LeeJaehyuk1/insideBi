import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      const masked = connectionString.replace(/:([^@]+)@/, ":****@");
      console.log(`[DB] Initializing pool with: ${masked}`);
    } else {
      console.warn("[DB] DATABASE_URL is not set!");
    }
    pool = new Pool({
      connectionString,
    });
  }
  return pool;
}

/** 테이블 전체 행 조회 (서버 전용, 최대 limit 행) */
export async function fetchTableRows(
  tableId: string,
  limit = 2000,
): Promise<Record<string, unknown>[]> {
  // 테이블명 허용 문자 검증 (SQL injection 방지)
  if (!/^[a-z_][a-z0-9_]*$/.test(tableId)) return [];
  try {
    const result = await getPool().query(
      `SELECT * FROM "${tableId}" LIMIT $1`,
      [limit],
    );
    return result.rows as Record<string, unknown>[];
  } catch (err) {
    console.error(`[DB] Error fetching table rows for ${tableId}:`, err);
    return [];
  }
}

/** 테이블 총 행 수 조회 */
export async function fetchTableCount(tableId: string): Promise<number> {
  if (!/^[a-z_][a-z0-9_]*$/.test(tableId)) return 0;
  try {
    const result = await getPool().query(
      `SELECT COUNT(*)::int AS n FROM "${tableId}"`,
    );
    return result.rows[0]?.n ?? 0;
  } catch (err) {
    console.error(`[DB] Error fetching table count for ${tableId}:`, err);
    return 0;
  }
}
