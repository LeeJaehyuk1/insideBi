"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Legend,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { varTimeSeries } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

// Show last 60 trading days
const data = varTimeSeries.slice(-60).map((d) => ({
  date: d.date.slice(5),
  VaR: d.var,
  PnL: d.pnl,
  한도: d.limit,
}));

export function VaRBarChart() {
  return (
    <BaseChartWrapper title="VaR 추이 (최근 60 거래일)" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={9} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} unit="억" />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine yAxisId="left" y={1500} stroke={CHART_COLORS.danger} strokeDasharray="4 4" label={{ value: "한도", fontSize: 10 }} />
        <Bar yAxisId="right" dataKey="PnL" name="일별 P&L" fill={CHART_COLORS.quaternary} opacity={0.5} />
        <Line yAxisId="left" type="monotone" dataKey="VaR" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
      </ComposedChart>
    </BaseChartWrapper>
  );
}
