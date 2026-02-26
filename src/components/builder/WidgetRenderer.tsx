"use client";

import * as React from "react";
import {
  LineChart, AreaChart, BarChart, PieChart, ScatterChart, RadarChart,
  Line, Area, Bar, Pie, Scatter, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PolarGrid, PolarAngleAxis, Cell, ZAxis, ReferenceLine,
} from "recharts";
import { WidgetConfig } from "@/types/builder";
import {
  nplTrend, lcrNsfrTrend, varTimeSeries, creditGrades, sectorExposures,
  concentrationData, stressScenarios, sensitivityData, maturityGap,
  fundingStructure, lcrSummary, pdLgdEad, nplTable, varSummary,
} from "@/lib/mock-data";
import { CHART_COLORS, SECTOR_COLORS } from "@/lib/constants";
import { formatKRW, formatPct } from "@/lib/utils";

const H = 240;

/* ── NPL 추이 ─────────────────────────────────────────────────── */
function NplTrend({ type }: { type: string }) {
  const data = nplTrend.map((d) => ({
    month: d.month.slice(5),
    고정: d.substandard,
    회의: d.doubtful,
    추정손실: d.loss,
    NPL: d.npl,
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
function CreditGrades({ type }: { type: string }) {
  const data = creditGrades.map((g) => ({ ...g, amountT: +(g.amount / 10000).toFixed(1) }));
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
function SectorExposure({ type }: { type: string }) {
  const data = sectorExposures.map((s) => ({ name: s.sector, value: s.amount, pct: s.pct }));
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
function Concentration() {
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
          const d = payload[0].payload;
          return (
            <div className="rounded-lg border bg-background p-2 text-xs shadow">
              <p className="font-medium">{d.name}</p>
              <p>PD: {d.x.toFixed(2)}%</p>
              <p>비중: {d.y.toFixed(1)}%</p>
            </div>
          );
        }} />
        <Scatter data={concentrationData}>
          {concentrationData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );
}

/* ── NPL 요약 테이블 (KPI/table) ──────────────────────────────── */
function NplSummary() {
  const rows = [
    { label: "총여신", value: formatKRW(nplTable.totalLoan) },
    { label: "NPL 금액", value: formatKRW(nplTable.nplAmount), highlight: true },
    { label: "NPL 비율", value: formatPct(nplTable.nplRatio), highlight: true },
    { label: "충당금", value: formatKRW(nplTable.provisionAmount) },
    { label: "충당금 적립률", value: formatPct(nplTable.provisionRatio, 1) },
    { label: "순 NPL 비율", value: formatPct(nplTable.netNpl) },
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
function PdLgdEad() {
  const items = [
    { label: "PD", value: formatPct(pdLgdEad.pd), color: "text-orange-600 dark:text-orange-400" },
    { label: "LGD", value: formatPct(pdLgdEad.lgd, 1), color: "text-red-600 dark:text-red-400" },
    { label: "EAD", value: formatKRW(pdLgdEad.ead), color: "text-blue-600 dark:text-blue-400" },
    { label: "기대손실", value: formatKRW(pdLgdEad.expectedLoss), color: "text-yellow-600 dark:text-yellow-400" },
    { label: "비기대손실", value: formatKRW(pdLgdEad.unexpectedLoss), color: "text-purple-600 dark:text-purple-400" },
    { label: "RWA", value: formatKRW(pdLgdEad.rwa), color: "text-teal-600 dark:text-teal-400" },
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
function VarTrend({ type }: { type: string }) {
  const data = varTimeSeries.slice(-50).map((d) => ({ date: d.date.slice(5), VaR: d.var, PnL: d.pnl }));
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
function StressScenarios({ type }: { type: string }) {
  const data = stressScenarios.map((s) => ({
    name: s.name.replace("\n", " "),
    신용손실: s.creditLoss,
    시장손실: s.marketLoss,
    유동성손실: s.liquidityLoss,
    bisAfter: s.bisAfter,
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
            {stressScenarios.map((s, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-2">{s.name.replace("\n", " ")}</td>
                <td className="px-3 py-2 text-right tabular-nums text-red-600 font-medium">{s.total.toLocaleString()}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-medium ${s.bisAfter < 10.5 ? "text-red-600" : "text-green-600"}`}>{formatPct(s.bisAfter, 1)}</td>
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
function Sensitivity() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <RadarChart data={sensitivityData} cx="50%" cy="50%" outerRadius="70%">
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
function VarSummaryKpi() {
  const items = [
    { label: "현재 VaR", value: formatKRW(varSummary.current), color: "text-blue-600 dark:text-blue-400" },
    { label: "한도 소진율", value: formatPct(varSummary.utilization, 1), color: "text-orange-600 dark:text-orange-400" },
    { label: "20일 평균", value: formatKRW(varSummary.avgLast20), color: "text-muted-foreground" },
    { label: "20일 최대", value: formatKRW(varSummary.maxLast20), color: "text-muted-foreground" },
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
function LcrNsfrTrend({ type }: { type: string }) {
  const data = lcrNsfrTrend.map((d) => ({ month: d.month.slice(5), LCR: d.lcr, NSFR: d.nsfr }));
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
function MaturityGap() {
  return (
    <ResponsiveContainer width="100%" height={H}>
      <BarChart data={maturityGap} margin={{ top: 8, right: 16, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [formatKRW(Math.abs(v))]} />
        <ReferenceLine y={0} stroke="#666" />
        <Bar dataKey="gap" name="만기 갭" radius={[4, 4, 0, 0]}>
          {maturityGap.map((d, i) => (
            <Cell key={i} fill={d.gap >= 0 ? CHART_COLORS.primary : CHART_COLORS.danger} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── 유동성 버퍼 ──────────────────────────────────────────────── */
function LiquidityBuffer({ type }: { type: string }) {
  const data = lcrNsfrTrend.map((d) => ({ month: d.month.slice(5), HQLA: d.hqla, 순현금유출: d.outflow }));
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
function FundingStructure({ type }: { type: string }) {
  const data = fundingStructure.map((f) => ({ name: f.source, value: f.amount, pct: f.pct }));
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
function LcrGauge() {
  const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arcPath = (cx: number, cy: number, r: number, s: number, e: number) => {
    const sp = polarToCartesian(cx, cy, r, s);
    const ep = polarToCartesian(cx, cy, r, e);
    const large = e - s > 180 ? 1 : 0;
    return `M ${sp.x} ${sp.y} A ${r} ${r} 0 ${large} 1 ${ep.x} ${ep.y}`;
  };
  const Gauge = ({ value, label, color, cx }: { value: number; label: string; color: string; cx: number }) => {
    const pct = Math.min(Math.max((value - 0) / 200, 0), 1);
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
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={16} fontWeight="bold" fill={color}>{value.toFixed(1)}%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={10} fill="#64748b">{label}</text>
        <text x={cx - r - 4} y={cy + 14} fontSize={9} textAnchor="middle" fill="#94a3b8">0%</text>
        <text x={cx + r + 4} y={cy + 14} fontSize={9} textAnchor="middle" fill="#94a3b8">200%</text>
      </g>
    );
  };
  return (
    <div className="flex justify-center py-2">
      <svg width={320} height={100} viewBox="0 0 320 100">
        <Gauge value={lcrSummary.lcr} label="LCR" color="#3b82f6" cx={80} />
        <Gauge value={lcrSummary.nsfr} label="NSFR" color="#10b981" cx={240} />
      </svg>
    </div>
  );
}

/* ── Main export ──────────────────────────────────────────────── */
export function WidgetRenderer({ widget }: { widget: WidgetConfig }) {
  const { datasetId, chartType } = widget;

  switch (datasetId) {
    case "npl-trend":        return <NplTrend type={chartType} />;
    case "credit-grades":    return <CreditGrades type={chartType} />;
    case "sector-exposure":  return <SectorExposure type={chartType} />;
    case "concentration":    return <Concentration />;
    case "npl-summary":      return <NplSummary />;
    case "pd-lgd-ead":       return <PdLgdEad />;
    case "var-trend":        return <VarTrend type={chartType} />;
    case "stress-scenarios": return <StressScenarios type={chartType} />;
    case "sensitivity":      return <Sensitivity />;
    case "var-summary":      return <VarSummaryKpi />;
    case "lcr-nsfr-trend":   return <LcrNsfrTrend type={chartType} />;
    case "maturity-gap":     return <MaturityGap />;
    case "liquidity-buffer": return <LiquidityBuffer type={chartType} />;
    case "funding-structure":return <FundingStructure type={chartType} />;
    case "lcr-gauge":        return <LcrGauge />;
    default:
      return (
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          알 수 없는 데이터셋
        </div>
      );
  }
}
