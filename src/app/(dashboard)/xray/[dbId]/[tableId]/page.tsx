import { notFound } from "next/navigation";
import { getDbInfo, DB_TABLES } from "@/lib/db-catalog";
import { fetchTableRows } from "@/lib/db";
import { getRegistryEntry } from "@/lib/dataset-registry";
import { dataCatalog } from "@/lib/data-catalog";
import XrayClient from "./XrayClient";
import type { ColAnalysis, DateColAnalysis } from "./XrayClient";

function inferCategory(tableId: string, label: string): string {
  const s = `${tableId} ${label}`.toLowerCase();
  if (/credit|npl|pd|lgd|ead|grade|sector|concentrat/.test(s)) return "credit";
  if (/var|market|stress|sensitiv|irriskmr/.test(s)) return "market";
  if (/lcr|nsfr|liquid|maturit|buffer|fund/.test(s)) return "liquidity";
  if (/ncr|capital|composit|irpos|irriskcr|irncr/.test(s)) return "ncr";
  return "credit";
}

/** YYYYMMDD or ISO date string 감지 */
function isDateLike(val: unknown): boolean {
  if (typeof val !== "string") return false;
  return /^\d{8}$/.test(val) || /^\d{4}-\d{2}-\d{2}/.test(val);
}

function parseDate(val: string): Date {
  if (/^\d{8}$/.test(val)) {
    return new Date(
      `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`
    );
  }
  return new Date(val);
}

function analyzeColumns(rows: Record<string, unknown>[]): {
  dateCol: DateColAnalysis | null;
  categories: ColAnalysis[];
  numerics: ColAnalysis[];
} {
  if (rows.length === 0) return { dateCol: null, categories: [], numerics: [] };

  const keys = Object.keys(rows[0]);
  let dateCol: DateColAnalysis | null = null;
  const categories: ColAnalysis[] = [];
  const numerics: ColAnalysis[] = [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const key of keys) {
    const sampleVals = rows.slice(0, 5).map((r) => r[key]);

    // 날짜 컬럼
    if (!dateCol && sampleVals.every(isDateLike)) {
      const dates = rows.map((r) => parseDate(String(r[key])));
      const recentCount = dates.filter((d) => d >= thirtyDaysAgo).length;

      // 월별 집계
      const byMonth: Record<string, number> = {};
      for (const d of dates) {
        if (isNaN(d.getTime())) continue;
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        byMonth[k] = (byMonth[k] ?? 0) + 1;
      }
      const monthData = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, count]) => ({ label, count }));

      // 요일별 집계
      const dayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
      const byDay: number[] = [0, 0, 0, 0, 0, 0, 0];
      for (const d of dates) {
        if (!isNaN(d.getTime())) byDay[d.getDay()]++;
      }
      const dayData = byDay
        .map((count, i) => ({ label: dayNames[i], count }))
        .filter((d) => d.count > 0);

      // 시간별 집계
      const byHour: Record<string, number> = {};
      for (const d of dates) {
        if (isNaN(d.getTime())) continue;
        const h = d.getHours();
        const label = h === 0 ? "자정" : h < 12 ? `${h}:00 오전` : h === 12 ? "12:00 오후" : `${h - 12}:00 오후`;
        byHour[label] = (byHour[label] ?? 0) + 1;
      }
      const hourData = Object.entries(byHour)
        .sort(([a], [b]) => {
          const toNum = (s: string) => parseInt(s);
          return toNum(a) - toNum(b);
        })
        .map(([label, count]) => ({ label, count }));

      // 분기별 집계
      const byQuarter: Record<string, number> = {};
      for (const d of dates) {
        if (isNaN(d.getTime())) continue;
        const q = Math.floor(d.getMonth() / 3) + 1;
        const k = `${d.getFullYear()} Q${q}`;
        byQuarter[k] = (byQuarter[k] ?? 0) + 1;
      }
      const quarterData = Object.entries(byQuarter)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, count]) => ({ label, count }));

      dateCol = { key, recentCount, monthData, dayData, hourData, quarterData };
      continue;
    }

    // 숫자 컬럼
    const numVals = rows.map((r) => Number(r[key])).filter((v) => !isNaN(v) && isFinite(v));
    if (numVals.length === rows.length && numVals.length > 0) {
      // 히스토그램 버킷
      const min = Math.min(...numVals);
      const max = Math.max(...numVals);
      const BUCKETS = 8;
      const size = min === max ? 1 : (max - min) / BUCKETS;
      const buckets = Array.from({ length: BUCKETS }, (_, i) => ({
        label: (min + i * size).toLocaleString("ko-KR", { maximumFractionDigits: 0 }),
        count: 0,
      }));
      for (const v of numVals) {
        const idx = Math.min(Math.floor((v - min) / size), BUCKETS - 1);
        buckets[idx].count++;
      }
      if (numerics.length < 2) numerics.push({ key, data: buckets, type: "histogram" });
      continue;
    }

    // 범주형 컬럼 (문자열 + 고유값 ≤ 30)
    if (typeof rows[0][key] === "string") {
      const freqMap: Record<string, number> = {};
      for (const r of rows) {
        const v = String(r[key]);
        freqMap[v] = (freqMap[v] ?? 0) + 1;
      }
      const unique = Object.keys(freqMap).length;
      if (unique <= 30 && unique > 1 && categories.length < 3) {
        const data = Object.entries(freqMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 15)
          .map(([label, count]) => ({ label, count }));
        categories.push({ key, data, type: "category" });
      }
    }
  }

  return { dateCol, categories, numerics };
}

export default async function XrayPage({
  params,
}: {
  params: { dbId: string; tableId: string };
}) {
  const { dbId, tableId } = params;
  const db = getDbInfo(dbId);
  if (!db) notFound();

  const tables = DB_TABLES[dbId] ?? [];
  const table = tables.find((t) => t.tableId === tableId);
  if (!table) notFound();

  // 실제 DB 우선, 없으면 registry mock fallback
  let rows: Record<string, unknown>[] = await fetchTableRows(tableId, 5000);
  const entry = table.datasetId ? getRegistryEntry(table.datasetId) : undefined;
  if (rows.length === 0) {
    if (entry) rows = entry.queryFn();
  }

  const { dateCol, categories, numerics } = analyzeColumns(rows);

  // 관련 테이블 (같은 카테고리)
  const category = entry?.meta?.category ?? inferCategory(tableId, table.label);
  const relatedDatasets = dataCatalog
    .filter((d) => d.category === category && d.id !== table.datasetId)
    .slice(0, 5);
  const relatedTables = relatedDatasets.map((ds) => {
    const t = tables.find((tb) => tb.datasetId === ds.id);
    return { label: ds.label, tableId: t?.tableId ?? null };
  });

  // 컬럼 필터 목록 (범주형 컬럼)
  const filterCols = categories.map((c) => c.key);

  return (
    <XrayClient
      dbId={dbId}
      tableId={tableId}
      tableLabel={table.label}
      rowCount={rows.length}
      dateCol={dateCol}
      categories={categories}
      numerics={numerics}
      relatedTables={relatedTables}
      filterCols={filterCols}
    />
  );
}
