"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Tooltip,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { sensitivityData } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

export function SensitivityRadar() {
  return (
    <BaseChartWrapper title="시장 민감도 분석" height={300}>
      <RadarChart data={sensitivityData} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid />
        <PolarAngleAxis dataKey="factor" tick={{ fontSize: 11 }} />
        <Radar name="민감도" dataKey="value" stroke={CHART_COLORS.primary} fill={CHART_COLORS.primary} fillOpacity={0.25} />
        <Tooltip formatter={(v: number) => [`${v}점`, "민감도"]} />
      </RadarChart>
    </BaseChartWrapper>
  );
}
