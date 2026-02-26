"use client";

import * as React from "react";
import {
  LineChart, AreaChart, BarChart, PieChart, ScatterChart, RadarChart,
  Line, Area, Bar, Pie, Scatter, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, Cell, ZAxis, ReferenceLine,
} from "recharts";
import { WidgetConfig, AxisMapping, ThresholdConfig } from "@/types/builder";
import { useDataset } from "@/hooks/useDataset";
import { getDatasetSchema } from "@/lib/dataset-schemas";
import { mergeGlobalFilter } from "@/lib/filter-utils";
import { CHART_COLORS, SECTOR_COLORS } from "@/lib/constants";
import { formatKRW, formatPct } from "@/lib/utils";
import { WaterfallChart, WaterfallBarData } from "@/components/charts/WaterfallChart";
import { BulletChart, BulletItem } from "@/components/charts/BulletChart";
import { isCustomDataset } from "@/lib/custom-dataset-runtime";


const H = 240;

type RawRow = Record<string, unknown>;

/** Generic multi-series colour palette */
const SERIES_COLORS = [
  "#3b82f6", "#10b981", "#f97316", "#ef4444", "#8b5cf6", "#06b6d4",
];

/* ── Loading skeleton ─────────────────────────────────────────── */
function DataSkeleton() {
  return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
      <div className="animate-pulse text-xs">데이터 로딩 중...</div>
    </div>
  );
}

/* ── Generic chart (axisMapping 적용 시) ────────────────────────
   Handles: line | area | bar | pie
   All other chart types fall through to hardcoded sub-components.
─────────────────────────────────────────────────────────────── */
function GenericChart({
  chartType,
  data,
  axisMapping,
  thresholds,
}: {
  chartType: string;
  data: RawRow[];
  axisMapping: AxisMapping;
  thresholds?: ThresholdConfig[];
}) {
  const { x, y } = axisMapping;

  const thresholdLines = thresholds?.map((t) => (
    <ReferenceLine
      key={t.id}
      y={t.value}
      stroke={t.color}
      strokeDasharray="4 4"
      label={{
        value: t.label ?? String(t.value),
        position: "right",
        fontSize: 10,
        fill: t.color,
      }}
    />
  ));

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <PieChart>
          <Pie
            data={data}
            dataKey={y[0]}
            nameKey={x}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={x} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {thresholdLines}
          {y.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
              fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              fillOpacity={0.2}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "bar") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={x} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {thresholdLines}
          {y.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={SERIES_COLORS[i % SERIES_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Default: line
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={x} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {thresholdLines}
        {y.map((key, i) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── Waterfall renderer ──────────────────────────────────────── */
function WaterfallRenderer({
  data,
  axisMapping,
}: {
  data: RawRow[];
  axisMapping?: AxisMapping;
}) {
  if (!axisMapping || axisMapping.y.length === 0 || data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        MappingPanel에서 Y축 컬럼을 설정하세요
      </div>
    );
  }

  const row = data[0];
  const bars: WaterfallBarData[] = axisMapping.y.map((key) => {
    const col = key;
    return { name: col, value: (row[key] as number) ?? 0 };
  });
  const total = bars.reduce((s, b) => s + b.value, 0);
  bars.push({ name: "합계", value: total, isTotal: true });

  return <WaterfallChart data={bars} height={H} />;
}

/* ── Bullet renderer ─────────────────────────────────────────── */
function BulletRenderer({
  data,
  axisMapping,
  thresholds,
}: {
  data: RawRow[];
  axisMapping?: AxisMapping;
  thresholds?: ThresholdConfig[];
}) {
  const target = thresholds?.[0]?.value;

  if (!axisMapping || axisMapping.y.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        MappingPanel에서 Y축 컬럼을 설정하세요
      </div>
    );
  }

  let items: BulletItem[];

  if (data.length === 1) {
    // Scalar: each Y key becomes one bullet row
    const row = data[0];
    items = axisMapping.y.map((key) => ({
      label: key,
      value: (row[key] as number) ?? 0,
      target,
    }));
  } else {
    // Array: each data row becomes one bullet row
    items = data.map((row) => ({
      label: axisMapping.x ? ((row[axisMapping.x] as string) ?? "?") : "?",
      value: (row[axisMapping.y[0]] as number) ?? 0,
      target,
    }));
  }

  return <BulletChart items={items} height={H} />;
}

/* ── NPL 추이 ─────────────────────────────────────────────────── */
function NplTrend({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.map((d) => ({
    month: (d.month as string).slice(5),
    고정: d.substandard as number,
    회의: d.doubtful as number,
    추정손실: d.loss as number,
    NPL: d.npl as number,
  }));
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={2.0} stroke={CHART_COLORS.danger} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="NPL" stroke={CHART_COLORS.danger} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="고정" stroke={CHART_COLORS.primary} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="추정손실" stackId="1" stroke="#ef4444" fill="#fee2e2" />
        <Area type="monotone" dataKey="회의" stackId="1" stroke="#f97316" fill="#ffedd5" />
        <Area type="monotone" dataKey="고정" stackId="1" stroke="#3b82f6" fill="#dbeafe" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── 신용등급 ─────────────────────────────────────────────────── */
const gradeColors: Record<string, string> = {
  AAA: "#16a34a", AA: "#22c55e", A: "#86efac",
  BBB: "#facc15", BB: "#f97316", B: "#ef4444", "CCC이하": "#7f1d1d",
};
function CreditGrades({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.map((g) => ({
    grade: g.grade as string,
    amount: g.amount as number,
    count: g.count as number,
    pct: g.pct as number,
    amountT: +((g.amount as number) / 10000).toFixed(1),
  }));
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="grade" cx="50%" cy="50%"
            innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.map((d) => <Cell key={d.grade} fill={gradeColors[d.grade] ?? "#3b82f6"} />)}
          </Pie>
          <Tooltip formatter={(v: number) => [formatKRW(v)]} />
          <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="조" />
        <Tooltip formatter={(v: number) => [`${v}조원`]} />
        <Bar dataKey="amountT" name="익스포저" radius={[4, 4, 0, 0]}>
          {data.map((d) => <Cell key={d.grade} fill={gradeColors[d.grade] ?? "#3b82f6"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 업종별 익스포저 ───────────────────────────────────────────── */
function SectorExposure({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.map((s) => ({ name: s.sector as string, value: s.amount as number, pct: s.pct as number }));
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 60, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} unit="억" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={56} />
          <Tooltip formatter={(v: number) => [formatKRW(v)]} />
          <Bar dataKey="value" name="익스포저" radius={[0, 4, 4, 0]}>
            {data.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={55} outerRadius={90} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => [formatKRW(v), "익스포저"]} />
        <Legend layout="vertical" align="right" verticalAlign="middle"
          formatter={(v) => <span style={{ fontSize: 10 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── 집중리스크 산포도 ──────────────────────────────────────────── */
function Concentration({ rawData }: { rawData: RawRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <ScatterChart margin={{ top: 8, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" name="PD" unit="%" type="number" tick={{ fontSize: 11 }}
          label={{ value: "PD (%)", position: "bottom", fontSize: 11 }} />
        <YAxis dataKey="y" name="비중" unit="%" tick={{ fontSize: 11 }} />
        <ZAxis dataKey="z" range={[200, 1500]} />
        <Tooltip content={({ payload }) => {
          if (!payload?.length) return null;
          const d = payload[0].payload as { name: string; x: number; y: number };
          return (
            <div className="rounded-lg border bg-background p-2 text-xs shadow">
              <p className="font-medium">{d.name}</p>
              <p>PD: {d.x.toFixed(2)}%</p>
              <p>비중: {d.y.toFixed(1)}%</p>
            </div>
          );
        }} />
        <Scatter data={rawData}>
          {rawData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── NPL 요약 테이블 (KPI/table) ──────────────────────────────── */
function NplSummary({ rawData }: { rawData: RawRow[] }) {
  const s = (rawData[0] ?? {}) as RawRow;
  const rows = [
    { label: "총여신", value: formatKRW(s.totalLoan as number) },
    { label: "NPL 금액", value: formatKRW(s.nplAmount as number), highlight: true },
    { label: "NPL 비율", value: formatPct(s.nplRatio as number), highlight: true },
    { label: "충당금", value: formatKRW(s.provisionAmount as number) },
    { label: "충당금 적립률", value: formatPct(s.provisionRatio as number, 1) },
    { label: "순 NPL 비율", value: formatPct(s.netNpl as number) },
  ];
  return (
    <div className="p-3">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b last:border-0">
              <td className="py-2 text-xs text-muted-foreground">{r.label}</td>
              <td className={`py-2 text-right text-xs font-medium tabular-nums ${r.highlight ? "text-orange-600 dark:text-orange-400" : ""}`}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── PD / LGD / EAD ──────────────────────────────────────────── */
function PdLgdEad({ rawData }: { rawData: RawRow[] }) {
  const s = (rawData[0] ?? {}) as RawRow;
  const items = [
    { label: "PD", value: formatPct(s.pd as number), color: "text-orange-600 dark:text-orange-400" },
    { label: "LGD", value: formatPct(s.lgd as number, 1), color: "text-red-600 dark:text-red-400" },
    { label: "EAD", value: formatKRW(s.ead as number), color: "text-blue-600 dark:text-blue-400" },
    { label: "기대손실", value: formatKRW(s.expectedLoss as number), color: "text-yellow-600 dark:text-yellow-400" },
    { label: "비기대손실", value: formatKRW(s.unexpectedLoss as number), color: "text-purple-600 dark:text-purple-400" },
    { label: "RWA", value: formatKRW(s.rwa as number), color: "text-teal-600 dark:text-teal-400" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className={`text-base font-bold mt-0.5 ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── VaR 추이 ─────────────────────────────────────────────────── */
function VarTrend({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.slice(-50).map((d) => ({ date: (d.date as string).slice(5), VaR: d.var as number, PnL: d.pnl as number }));
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={9} />
          <YAxis tick={{ fontSize: 11 }} unit="억" />
          <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
          <ReferenceLine y={1500} stroke={CHART_COLORS.danger} strokeDasharray="4 4" />
          <Bar dataKey="VaR" fill={CHART_COLORS.primary} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={9} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
        <ReferenceLine y={1500} stroke={CHART_COLORS.danger} strokeDasharray="4 4" />
        <Line type="monotone" dataKey="VaR" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 스트레스 시나리오 ─────────────────────────────────────────── */
function StressScenarios({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.map((s) => ({
    name: (s.name as string).replace("\n", " "),
    신용손실: s.creditLoss as number,
    시장손실: s.marketLoss as number,
    유동성손실: s.liquidityLoss as number,
    bisAfter: s.bisAfter as number,
  }));
  if (type === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">시나리오</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">총손실</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">충격후BIS</th>
            </tr>
          </thead>
          <tbody>
            {rawData.map((s, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-2">{(s.name as string).replace("\n", " ")}</td>
                <td className="px-3 py-2 text-right tabular-nums text-red-600 font-medium">{(s.total as number).toLocaleString()}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${(s.bisAfter as number) < 10.5 ? "text-red-600" : "text-green-600"}`}>{formatPct(s.bisAfter as number, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H + 30}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 10, bottom: 50 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="신용손실" stackId="a" fill={CHART_COLORS.danger} />
        <Bar dataKey="시장손실" stackId="a" fill={CHART_COLORS.quinary} />
        <Bar dataKey="유동성손실" stackId="a" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 민감도 레이더 ─────────────────────────────────────────────── */
function Sensitivity({ rawData }: { rawData: RawRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <RadarChart data={rawData} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid />
        <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
        <Radar name="민감도" dataKey="value" stroke={CHART_COLORS.primary}
          fill={CHART_COLORS.primary} fillOpacity={0.25} />
        <Tooltip formatter={(v: number) => [`${v}점`, "민감도"]} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/* ── VaR 요약 KPI ─────────────────────────────────────────────── */
function VarSummaryKpi({ rawData }: { rawData: RawRow[] }) {
  const s = (rawData[0] ?? {}) as RawRow;
  const items = [
    { label: "현재 VaR", value: formatKRW(s.current as number), color: "text-blue-600 dark:text-blue-400" },
    { label: "한도 소진율", value: formatPct(s.utilization as number, 1), color: "text-orange-600 dark:text-orange-400" },
    { label: "20일 평균", value: formatKRW(s.avgLast20 as number), color: "text-muted-foreground" },
    { label: "20일 최대", value: formatKRW(s.maxLast20 as number), color: "text-muted-foreground" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 p-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className={`text-base font-bold mt-0.5 ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

/* ── LCR / NSFR 추이 ──────────────────────────────────────────── */
function LcrNsfrTrend({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.map((d) => ({ month: (d.month as string).slice(5), LCR: d.lcr as number, NSFR: d.nsfr as number }));
  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="%" />
          <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={100} stroke={CHART_COLORS.danger} strokeDasharray="4 4" />
          <Area type="monotone" dataKey="LCR" stroke={CHART_COLORS.primary} fill="#dbeafe" fillOpacity={0.5} />
          <Area type="monotone" dataKey="NSFR" stroke={CHART_COLORS.quaternary} fill="#d1fae5" fillOpacity={0.5} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={100} stroke={CHART_COLORS.danger} strokeDasharray="4 4" />
        <Line type="monotone" dataKey="LCR" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="NSFR" stroke={CHART_COLORS.quaternary} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ── 만기 갭 ──────────────────────────────────────────────────── */
function MaturityGap({ rawData }: { rawData: RawRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={rawData} margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [formatKRW(Math.abs(v))]} />
        <ReferenceLine y={0} stroke="#666" />
        <Bar dataKey="gap" name="만기 갭" radius={[4, 4, 0, 0]}>
          {rawData.map((d, i) => (
            <Cell key={i} fill={(d.gap as number) >= 0 ? CHART_COLORS.primary : CHART_COLORS.danger} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 유동성 버퍼 ──────────────────────────────────────────────── */
function LiquidityBuffer({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.map((d) => ({
    month: (d.date as string).slice(0, 7),
    HQLA: d.available as number,
    순현금유출: d.required as number,
  }));
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} unit="억" />
          <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="HQLA" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="순현금유출" stroke={CHART_COLORS.danger} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H}>
      <AreaChart data={data} margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="HQLA" stroke={CHART_COLORS.primary} fill="#dbeafe" fillOpacity={0.6} />
        <Area type="monotone" dataKey="순현금유출" stroke={CHART_COLORS.danger} fill="#fee2e2" fillOpacity={0.4} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── 조달구조 ─────────────────────────────────────────────────── */
function FundingStructure({ type, rawData }: { type: string; rawData: RawRow[] }) {
  const data = rawData.map((f) => ({ name: f.source as string, value: f.amount as number, pct: f.pct as number }));
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={H}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
          <YAxis tick={{ fontSize: 11 }} unit="억" />
          <Tooltip formatter={(v: number) => [formatKRW(v)]} />
          <Bar dataKey="value" name="금액" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={H}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%"
          innerRadius={50} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number) => [formatKRW(v), "금액"]} />
        <Legend layout="vertical" align="right" verticalAlign="middle"
          formatter={(v) => <span style={{ fontSize: 10 }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/* ── LCR / NSFR 게이지 ─────────────────────────────────────────── */
function LcrGauge({ rawData }: { rawData: RawRow[] }) {
  const s = (rawData[0] ?? {}) as RawRow;
  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arcPath = (cx: number, cy: number, r: number, st: number, e: number) => {
    const sp = polarToCartesian(cx, cy, r, st);
    const ep = polarToCartesian(cx, cy, r, e);
    const large = e - st > 180 ? 1 : 0;
    return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${large} 1 ${ep.x} ${ep.y}`;
  };
  const Gauge = ({ value, label, color, cx }: { value: number; label: string; color: string; cx: number }) => {
    const safeValue = (typeof value === "number" && isFinite(value)) ? value : 0;
    const pct = Math.min(Math.max((safeValue - 0) / 200, 0), 1);
    const angle = -180 + pct * 180;
    const cy = 80;
    const r = 60;
    const needle = polarToCartesian(cx, cy, r - 12, angle);
    return (
      <g>
        <path d={arcPath(cx, cy, r, -180, 0)} fill="none" stroke="#e2e8f0" strokeWidth={12} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, -180, -180 + pct * 180)} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" />
        {[100, 110, 120].map((t) => {
          const tp = t / 200;
          const ta = -180 + tp * 180;
          const o = polarToCartesian(cx, cy, r + 8, ta);
          const inn = polarToCartesian(cx, cy, r - 8, ta);
          return <line key={t} x1={inn.x} y1={inn.y} x2={o.x} y2={o.y} stroke="#ef4444" strokeWidth={1.5} />;
        })}
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#1e293b" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={4} fill="#1e293b" />
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={16} fontWeight="bold" fill={color}>{safeValue.toFixed(1)}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#64748b">{label}</text>
        <text x={cx - r - 4} y={cy + 14} fontSize={9} textAnchor="middle" fill="#94a3b8">0%</text>
        <text x={cx + r + 4} y={cy + 14} fontSize={9} textAnchor="middle" fill="#94a3b8">200%</text>
      </g>
    );
  };
  return (
    <div className="flex justify-center py-2">
      <svg width={320} height={100} viewBox="0 0 320 100">
        <Gauge value={(s.lcr as number) ?? 0} label="LCR" color="#3b82f6" cx={80} />
        <Gauge value={(s.nsfr as number) ?? 0} label="NSFR" color="#10b981" cx={240} />
      </svg>
    </div>
  );
}

/* ── Custom Dataset renderer ──────────────────────────────────── */
function CustomDatasetRenderer({
  data,
  chartType,
  axisMapping,
  thresholds,
}: {
  data: RawRow[];
  chartType: string;
  axisMapping?: AxisMapping;
  thresholds?: ThresholdConfig[];
}) {
  // 데이터 없음 (SQL only)
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
        <div className="text-xs font-medium">SQL 데이터셋</div>
        <p className="text-[10px] text-center px-4">
          실제 DB 연결 시 데이터가 표시됩니다<br />
          (쿼리가 저장되었습니다)
        </p>
      </div>
    );
  }

  // axisMapping 설정된 경우: GenericChart로 렌더링
  if (axisMapping && axisMapping.y.length > 0) {
    if (chartType === "waterfall") {
      return <WaterfallRenderer data={data} axisMapping={axisMapping} />;
    }
    if (chartType === "bullet") {
      return <BulletRenderer data={data} axisMapping={axisMapping} thresholds={thresholds} />;
    }
    if (["line", "area", "bar", "pie", "scatter"].includes(chartType)) {
      return (
        <GenericChart
          chartType={chartType}
          data={data}
          axisMapping={axisMapping}
          thresholds={thresholds}
        />
      );
    }
  }

  // axisMapping 없음 또는 table 차트: 자동 테이블 미리보기
  if (chartType === "table" || !axisMapping || axisMapping.y.length === 0) {
    const columns = data.length > 0 ? Object.keys(data[0]) : [];
    if (columns.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">
          데이터가 없습니다
        </div>
      );
    }
    const preview = data.slice(0, 8);

    return (
      <div className="overflow-auto h-full">
        {(!axisMapping || axisMapping.y.length === 0) && chartType !== "table" && (
          <div className="text-[10px] text-amber-600 dark:text-amber-400 px-3 pt-2 pb-1">
            ⚙️ 위젯 설정에서 X / Y 축을 지정하면 차트로 전환됩니다
          </div>
        )}
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-muted/30 border-b">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, ri) => (
              <tr key={ri} className={`border-b last:border-0 ${ri % 2 === 0 ? "" : "bg-muted/10"}`}>
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1.5 tabular-nums whitespace-nowrap max-w-[120px] truncate">
                    {String(row[col] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 8 && (
          <p className="text-[9px] text-muted-foreground text-center py-1.5">
            … 외 {data.length - 8}개 행 (드릴다운으로 전체 확인)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">
      위젯 설정에서 축을 구성하세요
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────── */
export function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const { datasetId, chartType, queryParams, axisMapping, thresholds, globalFilter } = widget;
  const schema = getDatasetSchema(datasetId);
  const mergedParams = mergeGlobalFilter(globalFilter, queryParams, schema);
  const { data, isLoading } = useDataset({ datasetId, ...mergedParams });

  if (isLoading) return <DataSkeleton />;

  // ── 커스텀 데이터셋 (custom-*) 전용 렌더러
  if (isCustomDataset(datasetId)) {
    return (
      <CustomDatasetRenderer
        data={data}
        chartType={chartType}
        axisMapping={axisMapping}
        thresholds={thresholds}
      />
    );
  }

  // ── New chart types (always delegated to dedicated renderers)
  if (chartType === "waterfall") {
    return <WaterfallRenderer data={data} axisMapping={axisMapping} />;
  }
  if (chartType === "bullet") {
    return <BulletRenderer data={data} axisMapping={axisMapping} thresholds={thresholds} />;
  }

  // ── Generic chart (axisMapping set + generic chart type)
  if (
    axisMapping &&
    axisMapping.y.length > 0 &&
    ["line", "area", "bar", "pie"].includes(chartType)
  ) {
    return (
      <GenericChart
        chartType={chartType}
        data={data}
        axisMapping={axisMapping}
        thresholds={thresholds}
      />
    );
  }

  // ── Hardcoded dataset-specific renderers
  switch (datasetId) {
    case "npl-trend": return <NplTrend type={chartType} rawData={data} />;
    case "credit-grades": return <CreditGrades type={chartType} rawData={data} />;
    case "sector-exposure": return <SectorExposure type={chartType} rawData={data} />;
    case "concentration": return <Concentration rawData={data} />;
    case "npl-summary": return <NplSummary rawData={data} />;
    case "pd-lgd-ead": return <PdLgdEad rawData={data} />;
    case "var-trend": return <VarTrend type={chartType} rawData={data} />;
    case "stress-scenarios": return <StressScenarios type={chartType} rawData={data} />;
    case "sensitivity": return <Sensitivity rawData={data} />;
    case "var-summary": return <VarSummaryKpi rawData={data} />;
    case "lcr-nsfr-trend": return <LcrNsfrTrend type={chartType} rawData={data} />;
    case "maturity-gap": return <MaturityGap rawData={data} />;
    case "liquidity-buffer": return <LiquidityBuffer type={chartType} rawData={data} />;
    case "funding-structure": return <FundingStructure type={chartType} rawData={data} />;
    case "lcr-gauge": return <LcrGauge rawData={data} />;
    default:
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          알 수 없는 데이터셋
        </div>
      );
  }
}
