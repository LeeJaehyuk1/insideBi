"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { creditGrades } from "@/lib/mock-data";
import { formatKRW } from "@/lib/utils";

const gradeColors: Record<string, string> = {
  AAA: "#16a34a", AA: "#22c55e", A: "#86efac",
  BBB: "#facc15", BB: "#f97316", B: "#ef4444", "CCC이하": "#7f1d1d",
};

const data = creditGrades.map((g) => ({
  ...g,
  amountB: Math.round(g.amount / 100) / 10,
}));

export function CreditGradeBar() {
  return (
    <BaseChartWrapper title="신용등급 분포 (익스포저)" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="grade" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit="조" />
        <Tooltip
          formatter={(v: number, name: string) => [
            name === "amountB" ? `${v.toFixed(1)}조원` : `${v.toFixed(1)}%`,
            name === "amountB" ? "익스포저" : "비중",
          ]}
        />
        <Bar dataKey="amountB" name="익스포저" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.grade} fill={gradeColors[d.grade] ?? "#3b82f6"} />
          ))}
        </Bar>
      </BarChart>
    </BaseChartWrapper>
  );
}
