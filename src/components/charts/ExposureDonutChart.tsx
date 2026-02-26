"use client";

import {
  PieChart, Pie, Cell, Tooltip, Legend,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { sectorExposures } from "@/lib/mock-data";
import { SECTOR_COLORS } from "@/lib/constants";
import { formatKRW } from "@/lib/utils";

const data = sectorExposures.map((s) => ({ name: s.sector, value: s.amount, pct: s.pct }));

export function ExposureDonutChart() {
  return (
    <BaseChartWrapper title="업종별 익스포저 분포" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [formatKRW(v), "익스포저"]} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
        />
      </PieChart>
    </BaseChartWrapper>
  );
}
