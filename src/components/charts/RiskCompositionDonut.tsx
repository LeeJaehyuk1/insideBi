"use client";

import {
    PieChart, Pie, Cell, Tooltip, Legend
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { riskComposition } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

const COLORS = [CHART_COLORS.secondary, CHART_COLORS.tertiary, CHART_COLORS.quaternary];

export function RiskCompositionDonut() {
    return (
        <BaseChartWrapper title="총위험액 구성" height={300}>
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie
                    data={riskComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    labelLine={true}
                >
                    {riskComposition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toLocaleString()}백만`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
        </BaseChartWrapper>
    );
}
