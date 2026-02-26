"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Legend,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { nplTrend } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

const data = nplTrend.map((d) => ({
  month: d.month.slice(5),
  "추정손실": d.loss,
  "회의": d.doubtful,
  "고정": d.substandard,
}));

export function NplTrendArea() {
  return (
    <BaseChartWrapper title="NPL 구성 추이 (누적 면적)" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={2.0} stroke={CHART_COLORS.danger} strokeDasharray="4 4" label={{ value: "주의", fontSize: 10 }} />
        <Area type="monotone" dataKey="추정손실" stackId="1" stroke="#ef4444" fill="#fee2e2" />
        <Area type="monotone" dataKey="회의" stackId="1" stroke="#f97316" fill="#ffedd5" />
        <Area type="monotone" dataKey="고정" stackId="1" stroke="#3b82f6" fill="#dbeafe" />
      </AreaChart>
    </BaseChartWrapper>
  );
}
