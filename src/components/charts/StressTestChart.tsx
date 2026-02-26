"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { stressScenarios } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

const data = stressScenarios.map((s) => ({
  name: s.name.replace("\n", " "),
  신용손실: s.creditLoss,
  시장손실: s.marketLoss,
  유동성손실: s.liquidityLoss,
}));

export function StressTestChart() {
  return (
    <BaseChartWrapper title="스트레스 시나리오별 손실 분해 (억원)" height={320}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" interval={0} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [`${v.toLocaleString()}억`]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="신용손실" stackId="a" fill={CHART_COLORS.danger} />
        <Bar dataKey="시장손실" stackId="a" fill={CHART_COLORS.quinary} />
        <Bar dataKey="유동성손실" stackId="a" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </BaseChartWrapper>
  );
}
