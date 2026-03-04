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
import { Sparkles } from "lucide-react";
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
  question?: string;
}

function useNarrative(data: Record<string, unknown>[], question?: string) {
  const [narrative, setNarrative] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!data || data.length === 0 || !question) return;
    setNarrative(null);
    setLoading(true);
    fetch("/api/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, data }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.narrative) setNarrative(json.narrative);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [data, question]);

  return { narrative, loading };
}

export function AiChartResult({ data, chartType, question }: AiChartResultProps) {
  const { narrative, loading: narrativeLoading } = useNarrative(data, question);

  if (!data || data.length === 0) return null;

  const allKeys = Object.keys(data[0]);
  const numericKeys = allKeys.filter((k) => typeof data[0][k] === "number");
  const stringKeys = allKeys.filter((k) => typeof data[0][k] === "string");

  const xKey = stringKeys[0] ?? allKeys[0];
  const yKeys = numericKeys.length > 0 ? numericKeys : allKeys.slice(1);

  const formatTick = (v: unknown) => {
    if (typeof v === "string" && v.length > 8) return v.slice(0, 8) + "…";
    return String(v);
  };

  const commonProps = {
    data,
    margin: { top: 4, right: 8, left: 0, bottom: 4 },
  };

  let chart: React.ReactNode;

  if (chartType === "pie" && yKeys.length >= 1) {
    const nameKey = xKey;
    const valueKey = yKeys[0];
    chart = (
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
  } else if (chartType === "line") {
    chart = (
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
  } else if (chartType === "area") {
    chart = (
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
  } else {
    chart = (
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

  return (
    <div className="space-y-2">
      {chart}

      {/* Smart Narrative */}
      {(narrativeLoading || narrative) && (
        <div className="flex items-start gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          {narrativeLoading ? (
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-2.5 w-full animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed">{narrative}</p>
          )}
        </div>
      )}
    </div>
  );
}
