"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { maturityGap } from "@/lib/mock-data";
import { formatKRW } from "@/lib/utils";

const data = maturityGap.map((d) => ({ ...d, gap: d.gap }));

export function MaturityGapChart() {
  return (
    <BaseChartWrapper title="만기 갭 분석 (자산-부채)" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="bucket" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip formatter={(v: number) => [formatKRW(Math.abs(v)), ""]} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <ReferenceLine y={0} stroke="#666" />
        <Bar dataKey="gap" name="만기 갭" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.gap >= 0 ? "#3b82f6" : "#ef4444"} />
          ))}
        </Bar>
      </BarChart>
    </BaseChartWrapper>
  );
}
