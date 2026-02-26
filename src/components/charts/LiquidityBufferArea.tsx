"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { lcrNsfrTrend } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

const data = lcrNsfrTrend.map((d) => ({
  month: d.month.slice(5),
  HQLA: d.hqla,
  순현금유출: d.outflow,
}));

export function LiquidityBufferArea() {
  return (
    <BaseChartWrapper title="HQLA vs 순현금유출 추이 (억원)" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Area type="monotone" dataKey="HQLA" stroke={CHART_COLORS.primary} fill="#dbeafe" fillOpacity={0.6} />
        <Area type="monotone" dataKey="순현금유출" stroke={CHART_COLORS.danger} fill="#fee2e2" fillOpacity={0.4} />
      </AreaChart>
    </BaseChartWrapper>
  );
}
