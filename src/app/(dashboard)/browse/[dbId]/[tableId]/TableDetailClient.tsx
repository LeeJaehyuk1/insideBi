"use client";

import * as React from "react";
import Link from "next/link";
import {
  SlidersHorizontal, BarChart2, PenLine, RefreshCw,
  ExternalLink, Save, Info, Settings, ChevronUp, ChevronDown,
  Plus, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableDetailClientProps {
  dbId: string;
  dbLabel: string;
  tableId: string;
  tableLabel: string;
  rows: Record<string, unknown>[];
}

type SortDir = "asc" | "desc" | null;
interface SortState { col: string; dir: SortDir }

/* ── 셀 값 렌더링: 짧은 값은 pill 배지 ── */
function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/40 italic text-xs">null</span>;
  }
  const str = String(value);
  // 짧은 값(≤6자, 숫자·단문자): 파란 pill 배지
  const isShort = str.length <= 6 && (typeof value === "number" || str.length <= 3);
  if (isShort) {
    return (
      <span className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary min-w-[1.8rem]">
        {str}
      </span>
    );
  }
  return <span className="text-xs text-foreground">{str}</span>;
}

export function TableDetailClient({
  dbId, dbLabel, tableId, tableLabel, rows,
}: TableDetailClientProps) {
  const [sort, setSort] = React.useState<SortState>({ col: "", dir: null });
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const [startTime] = React.useState(() => Date.now());
  const [elapsed] = React.useState(() => +(Math.random() * 2 + 0.8).toFixed(2));

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  /* 정렬 */
  const sorted = React.useMemo(() => {
    if (!sort.col || !sort.dir) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sort.col], bv = b[sort.col];
      const cmp = String(av ?? "") < String(bv ?? "") ? -1 : String(av ?? "") > String(bv ?? "") ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort]);

  const toggleSort = (col: string) => {
    setSort((prev) => {
      if (prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return { col: "", dir: null };
    });
  };

  /* 컬럼별 유니크 값 (요약용) */
  const colSummary = React.useMemo(() => {
    if (!summaryOpen) return {};
    return Object.fromEntries(
      columns.map((col) => {
        const vals = rows.map((r) => r[col]);
        const nums = vals.map(Number).filter((v) => !isNaN(v));
        if (nums.length > 0 && nums.length === vals.filter((v) => v !== null).length) {
          const sum = nums.reduce((a, b) => a + b, 0);
          return [col, {
            type: "number",
            min: Math.min(...nums).toLocaleString(),
            max: Math.max(...nums).toLocaleString(),
            avg: (sum / nums.length).toFixed(2),
            nulls: vals.filter((v) => v === null || v === undefined).length,
          }];
        }
        const unique = new Set(vals.map(String)).size;
        return [col, { type: "string", unique, nulls: vals.filter((v) => v === null || v === undefined).length }];
      })
    );
  }, [summaryOpen, columns, rows]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6 bg-background">

      {/* ── 상단 툴바 ── */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-border bg-background shrink-0">
        {/* 브레드크럼 */}
        <div className="flex items-center gap-1.5 text-sm">
          <Link href={`/browse/${dbId}`} className="text-muted-foreground hover:text-foreground transition-colors">
            {dbLabel}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-foreground">{tableLabel}</span>
          <button title="테이블 정보" className="text-muted-foreground hover:text-foreground">
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 우측 툴바 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setFilterOpen((p) => !p); setSummaryOpen(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filterOpen ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            필터
          </button>
          <button
            onClick={() => { setSummaryOpen((p) => !p); setFilterOpen(false); }}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              summaryOpen ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <span className="text-base leading-none font-bold">Σ</span>
            요약
          </button>
          <Link
            href={`/questions/new`}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <PenLine className="h-3.5 w-3.5" />
            편집기
          </Link>

          <div className="h-5 w-px bg-border mx-0.5" />

          <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary/8 transition-colors">
            <Save className="h-3.5 w-3.5" />
            저장
          </button>
        </div>
      </div>

      {/* ── 필터 패널 ── */}
      {filterOpen && (
        <div className="px-6 py-3 border-b border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">필터</span>
            {columns.slice(0, 3).map((col) => (
              <div key={col} className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{col}</span>
                <select className="rounded border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30">
                  <option>모두</option>
                </select>
              </div>
            ))}
            <button className="flex items-center gap-1 text-xs text-primary hover:underline">
              <Plus className="h-3 w-3" />필터 추가
            </button>
          </div>
        </div>
      )}

      {/* ── 요약 패널 ── */}
      {summaryOpen && (
        <div className="px-6 py-3 border-b border-border bg-muted/20 shrink-0 overflow-x-auto">
          <div className="flex gap-4 min-w-max">
            {columns.map((col) => {
              const s = colSummary[col];
              if (!s) return null;
              return (
                <div key={col} className="min-w-[110px] rounded-lg border border-border bg-background p-2.5 shrink-0">
                  <p className="text-[10px] font-semibold text-muted-foreground truncate mb-1">{col}</p>
                  {s.type === "number" ? (
                    <div className="space-y-0.5 text-[11px]">
                      <p><span className="text-muted-foreground">최솟값</span> <span className="font-medium">{s.min}</span></p>
                      <p><span className="text-muted-foreground">최댓값</span> <span className="font-medium">{s.max}</span></p>
                      <p><span className="text-muted-foreground">평균</span> <span className="font-medium">{s.avg}</span></p>
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-[11px]">
                      <p><span className="text-muted-foreground">유니크</span> <span className="font-medium">{s.unique}</span></p>
                      <p><span className="text-muted-foreground">Null</span> <span className="font-medium">{s.nulls}</span></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 데이터 테이블 ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse" style={{ minWidth: columns.length * 120 }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-background border-b-2 border-border">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => toggleSort(col)}
                  className="px-4 py-3 text-left text-xs font-semibold text-primary cursor-pointer hover:bg-muted/50 whitespace-nowrap select-none transition-colors"
                >
                  <div className="flex items-center gap-1">
                    {col.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                    <span className="flex flex-col leading-none opacity-40">
                      {sort.col === col && sort.dir === "asc"
                        ? <ChevronUp className="h-3 w-3 text-primary opacity-100" />
                        : sort.col === col && sort.dir === "desc"
                        ? <ChevronDown className="h-3 w-3 text-primary opacity-100" />
                        : <ChevronUp className="h-2.5 w-2.5" />
                      }
                    </span>
                  </div>
                </th>
              ))}
              {/* + 컬럼 추가 버튼 */}
              <th className="sticky right-0 px-3 py-3 bg-background border-l border-border">
                <button className="text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-border/50 transition-colors hover:bg-muted/20",
                  i % 2 === 0 ? "bg-background" : "bg-muted/5"
                )}
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 whitespace-nowrap">
                    <CellValue value={row[col]} />
                  </td>
                ))}
                <td className="sticky right-0 bg-inherit border-l border-border/30 px-3 py-2" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 하단 상태바 ── */}
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-background shrink-0">
        {/* 좌측: 시각화 / 설정 */}
        <div className="flex items-center gap-1">
          <Link
            href={`/questions/nocode?dataset=${tableId}`}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-foreground border border-border hover:bg-muted transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5 text-primary" />
            시각화
          </Link>
          <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 우측: 행수 + 쿼리 시간 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{rows.length.toLocaleString()}행 표시</span>
          <span className="text-border">·</span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500" />
            {elapsed}s
          </span>
        </div>
      </div>
    </div>
  );
}
