"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

const COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.quinary,
  CHART_COLORS.danger,
];

interface AiChartResultProps {
  data: Record<string, unknown>[];
  chartType: string;
}

export function AiChartResult({ data, chartType }: AiChartResultProps) {
  if (!data || data.length === 0) return null;

  const allKeys = Object.keys(data[0]);
  const numericKeys = allKeys.filter((k) => typeof data[0][k] === "number");
  const stringKeys = allKeys.filter((k) => typeof data[0][k] === "string");

  // Determine axis keys
  const xKey = stringKeys[0] ?? allKeys[0];
  const yKeys = numericKeys.length > 0 ? numericKeys : allKeys.slice(1);

  // Format long tick labels
  const formatTick = (v: unknown) => {
    if (typeof v === "string" && v.length > 8) return v.slice(0, 8) + "…";
    return String(v);
  };

  const commonProps = {
    data,
    margin: { top: 4, right: 8, left: 0, bottom: 4 },
  };

  if (chartType === "pie" && yKeys.length >= 1) {
    const nameKey = xKey;
    const valueKey = yKeys[0];
    return (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={70}
            label={({ name, percent }) =>
              `${formatTick(name)} ${(percent * 100).toFixed(1)}%`
            }
            labelLine={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tickFormatter={formatTick} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={48} />
          <Tooltip />
          {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          {yKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={xKey} tickFormatter={formatTick} tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} width={48} />
          <Tooltip />
          {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
          {yKeys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length] + "33"}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tickFormatter={formatTick} tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} width={48} />
        <Tooltip />
        {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10 }} />}
        {yKeys.map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
