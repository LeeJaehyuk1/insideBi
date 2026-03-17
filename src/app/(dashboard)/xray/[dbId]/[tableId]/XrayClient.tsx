"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, ZoomIn, ArrowUpRight, ChevronDown, Calendar, Type } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

/* ── 타입 (page.tsx에서 import) ── */
export interface DateColAnalysis {
  key: string;
  recentCount: number;
  monthData: { label: string; count: number }[];
  dayData:   { label: string; count: number }[];
  hourData?:    { label: string; count: number }[];
  quarterData?: { label: string; count: number }[];
}

export interface ColAnalysis {
  key: string;
  type: "histogram" | "category";
  data: { label: string; count: number }[];
}

interface RelatedTable {
  label: string;
  tableId: string | null;
}

interface Props {
  dbId: string;
  tableId: string;
  tableLabel: string;
  rowCount: number;
  dateCol: DateColAnalysis | null;
  categories: ColAnalysis[];
  numerics: ColAnalysis[];
  relatedTables: RelatedTable[];
  filterCols: string[];
}

function colDisplay(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* ── 공통 차트 컨테이너 ── */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

/* ── 수직 막대 (보라) ── */
function PurpleBar({ data, xKey = "label" }: { data: { label: string; count: number }[]; xKey?: string }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          angle={-30} textAnchor="end" interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          label={{ value: "카운트", angle: -90, position: "insideLeft", offset: 10,
            style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
        <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill="#7c3aed" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 수평 막대 (파랑, 범주형) ── */
function BlueHBar({ data }: { data: { label: string; count: number }[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, sorted.length * 28)}>
      <BarChart data={sorted} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis type="number" allowDecimals={false}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          label={{ value: "카운트", position: "insideBottom", offset: -4,
            style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
        <YAxis type="category" dataKey="label" width={100}
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill="#2563eb" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 히스토그램 (주황) ── */
function OrangeHistogram({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
          angle={-30} textAnchor="end" interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          label={{ value: "카운트", angle: -90, position: "insideLeft", offset: 10,
            style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }} />
        <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="count" fill="#f97316" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 라인 차트 (노랑) ── */
function YellowLine({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
          angle={-30} textAnchor="end" interval={0} />
        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
        <Line type="monotone" dataKey="count" stroke="#eab308" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 사이드바 섹션 ── */
function SidebarSection({ heading, items }: {
  heading: string;
  items: { label: string; href: string | null }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5">
      <h5 className="text-[11px] font-black uppercase text-muted-foreground mb-2 tracking-wide">
        {heading}
      </h5>
      <div className="space-y-1.5">
        {items.map((item) =>
          item.href ? (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 hover:border-yellow-400/60 hover:shadow-sm transition-all group">
              <Zap className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500 shrink-0" />
              <span className="text-sm font-medium text-foreground leading-tight">{item.label}</span>
            </Link>
          ) : (
            <div key={item.label}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <Zap className="h-3.5 w-3.5 fill-yellow-400/50 text-yellow-400/50 shrink-0" />
              <span className="text-sm font-medium text-muted-foreground leading-tight">{item.label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* ── 상단 필터 pill ── */
function FilterPill({ label, icon }: { label: string; icon: "text" | "date" }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:border-primary/40 text-sm text-foreground transition-colors">
      {icon === "text"
        ? <Type className="h-3.5 w-3.5 text-muted-foreground" />
        : <Calendar className="h-3.5 w-3.5 text-muted-foreground" />}
      {label}
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </button>
  );
}

/* ══════════════════════════════════════════
   메인 컴포넌트
══════════════════════════════════════════ */
export default function XrayClient({
  dbId, tableId, tableLabel,
  rowCount, dateCol, categories, numerics,
  relatedTables, filterCols,
}: Props) {
  const router = useRouter();

  /* 사이드바 — zoom-in: 컬럼별 필드 드릴다운 링크 */
  const zoomInItems = [
    ...(dateCol ? [{ label: `${colDisplay(dateCol.key)} 필드`, href: null }] : []),
    ...categories.slice(0, 3).map(c => ({ label: `${colDisplay(c.key)} 필드`, href: null })),
  ].slice(0, 4);

  /* 사이드바 — related: 관련 테이블 */
  const relatedItems = relatedTables.map(rt => ({
    label: rt.label,
    href: rt.tableId ? `/xray/${dbId}/${rt.tableId}` : null,
  }));

  return (
    <div className="min-h-screen bg-[hsl(var(--muted)/0.3)]">

      {/* ── 헤더 바 ── */}
      <div className="border-b border-border bg-background sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Zap className="h-4 w-4 fill-yellow-400 text-yellow-500" />
            Here&apos;s a quick look at {tableLabel}
          </div>
          <button
            onClick={() => router.push(`/dashboards/new?auto=${tableId}&db=${dbId}`)}
            className="px-4 py-1.5 rounded-md bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors">
            저장
          </button>
        </div>
      </div>

      {/* ── 필터 pills ── */}
      {(filterCols.length > 0 || dateCol) && (
        <div className="border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-2 flex-wrap">
            {categories.map(c => (
              <FilterPill key={c.key} label={colDisplay(c.key)} icon="text" />
            ))}
            {dateCol && <FilterPill label={colDisplay(dateCol.key)} icon="date" />}
          </div>
        </div>
      )}

      {/* ── 본문 ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-6">

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-w-0 space-y-10">

          {/* Summary */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Summary</h2>
            <div className="flex gap-4 flex-wrap">
              <div className="rounded-xl border border-border bg-background p-6 min-w-[180px]">
                <p className="text-5xl font-black text-foreground">{rowCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-2">Total {tableLabel}</p>
              </div>
              {dateCol && (
                <div className="rounded-xl border border-border bg-background p-6 min-w-[220px]">
                  <p className="text-5xl font-black text-foreground">{dateCol.recentCount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">{tableLabel} added in the last 30 days</p>
                </div>
              )}
            </div>
          </section>

          {/* Across Time */}
          {dateCol && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">
                These {tableLabel} across time
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* 요일별 */}
                {dateCol.dayData.length > 0 && (
                  <ChartCard title={`${colDisplay(dateCol.key)} by day of the week`}>
                    <PurpleBar data={dateCol.dayData} />
                  </ChartCard>
                )}

                {/* 시간별 */}
                {dateCol.hourData && dateCol.hourData.length > 0 && (
                  <ChartCard title={`${colDisplay(dateCol.key)} by hour of the day`}>
                    <PurpleBar data={dateCol.hourData} />
                  </ChartCard>
                )}

                {/* 월별 시계열 (라인) */}
                {dateCol.monthData.length > 1 && (
                  <ChartCard title={`${tableLabel} by ${colDisplay(dateCol.key)}`}>
                    <YellowLine data={dateCol.monthData} />
                  </ChartCard>
                )}

                {/* 분기별 */}
                {dateCol.quarterData && dateCol.quarterData.length > 0 && (
                  <ChartCard title={`${colDisplay(dateCol.key)} by quarter of the year`}>
                    <PurpleBar data={dateCol.quarterData} />
                  </ChartCard>
                )}

                {/* 월별 막대 */}
                {dateCol.monthData.length > 0 && (
                  <ChartCard title={`${colDisplay(dateCol.key)} by month of the year`}>
                    <PurpleBar data={dateCol.monthData} />
                  </ChartCard>
                )}
              </div>
            </section>
          )}

          {/* Distributed */}
          {(numerics.length > 0 || categories.length > 0) && (
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">
                How these {tableLabel} are distributed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 숫자형 히스토그램 (주황) */}
                {numerics.map(col => (
                  <ChartCard key={col.key} title={`${tableLabel} by ${colDisplay(col.key)}`}>
                    <OrangeHistogram data={col.data} />
                  </ChartCard>
                ))}
                {/* 범주형 수평막대 (파랑) */}
                {categories.map(col => (
                  <ChartCard key={col.key} title={`${tableLabel} per ${colDisplay(col.key)}`}>
                    <BlueHBar data={col.data} />
                  </ChartCard>
                ))}
              </div>
            </section>
          )}

          {rowCount === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              이 테이블에 데이터가 없습니다.
            </div>
          )}
        </div>

        {/* ── 우측 사이드바 ── */}
        <aside className="w-64 shrink-0">
          <h3 className="text-lg font-bold text-foreground mb-4 pt-1">더 많은 엑스레이</h3>
          {zoomInItems.length > 0 && (
            <SidebarSection heading="확대" items={zoomInItems} />
          )}
          {relatedItems.length > 0 && (
            <SidebarSection heading="관련된" items={relatedItems} />
          )}
        </aside>
      </div>
    </div>
  );
}
