"use client";

import * as React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, LabelList,
} from "recharts";

export interface WaterfallBarData {
  name: string;
  value: number;
  isTotal?: boolean;
}

interface ProcessedBar {
  name: string;
  base: number;
  displayValue: number;
  originalValue: number;
  isTotal: boolean;
  isNegative: boolean;
}

function processWaterfall(data: WaterfallBarData[]): ProcessedBar[] {
  let runningTotal = 0;
  return data.map((d) => {
    if (d.isTotal) {
      return {
        name: d.name,
        base: 0,
        displayValue: d.value,
        originalValue: d.value,
        isTotal: true,
        isNegative: false,
      };
    }
    const base = d.value >= 0 ? runningTotal : runningTotal + d.value;
    runningTotal += d.value;
    return {
      name: d.name,
      base,
      displayValue: Math.abs(d.value),
      originalValue: d.value,
      isTotal: false,
      isNegative: d.value < 0,
    };
  });
}

const BAR_COLORS = {
  positive: "#3b82f6",
  negative: "#ef4444",
  total: "#6b7280",
};

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ProcessedBar }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-2 text-xs shadow">
      <p className="font-medium">{d.name}</p>
      <p className="tabular-nums">
        {d.originalValue >= 0 ? "+" : ""}
        {d.originalValue.toLocaleString()}억
      </p>
    </div>
  );
}

export function WaterfallChart({
  data,
  height = 240,
}: {
  data: WaterfallBarData[];
  height?: number;
}) {
  const processed = processWaterfall(data);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={processed} margin={{ top: 20, right: 16, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} unit="억" />
        <Tooltip content={<CustomTooltip />} />
        {/* Invisible base spacer bar */}
        <Bar dataKey="base" stackId="wf" fill="transparent" />
        {/* Visible value bar */}
        <Bar dataKey="displayValue" stackId="wf" radius={[4, 4, 0, 0]}>
          {processed.map((d, i) => (
            <Cell
              key={i}
              fill={
                d.isTotal
                  ? BAR_COLORS.total
                  : d.isNegative
                  ? BAR_COLORS.negative
                  : BAR_COLORS.positive
              }
            />
          ))}
          <LabelList
            dataKey="originalValue"
            position="top"
            formatter={(v: number) => v.toLocaleString()}
            style={{ fontSize: 9, fill: "currentColor" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
