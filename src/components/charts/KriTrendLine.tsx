"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend, ResponsiveContainer,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { nplTrend } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

const data = nplTrend.map((d) => ({
  month: d.month.slice(5),
  NPL: d.npl,
  고정: d.substandard,
  회의: d.doubtful,
  추정손실: d.loss,
}));

export function KriTrendLine() {
  return (
    <BaseChartWrapper title="NPL 비율 추이 (12개월)" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} domain={[0, 3]} unit="%" />
        <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={2.0} stroke={CHART_COLORS.danger} strokeDasharray="4 4" label={{ value: "경보", fontSize: 10, fill: CHART_COLORS.danger }} />
        <ReferenceLine y={1.5} stroke={CHART_COLORS.quinary} strokeDasharray="4 4" label={{ value: "주의", fontSize: 10, fill: CHART_COLORS.quinary }} />
        <Line type="monotone" dataKey="NPL" stroke={CHART_COLORS.danger} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="고정" stroke={CHART_COLORS.primary} strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="회의" stroke={CHART_COLORS.quinary} strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="추정손실" stroke={CHART_COLORS.quaternary} strokeWidth={1.5} dot={false} />
      </LineChart>
    </BaseChartWrapper>
  );
}
