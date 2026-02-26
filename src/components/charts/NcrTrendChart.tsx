"use client";

import {
    ComposedChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceLine, Legend, Area
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { ncrTrendData } from "@/lib/mock-data";
import { CHART_COLORS } from "@/lib/constants";

export function NcrTrendChart() {
    return (
        <BaseChartWrapper title="영업용순자본비율(NCR) 추이" height={300}>
            <ComposedChart data={ncrTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 50', 'dataMax + 50']} unit="%" />
                <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={150} stroke={CHART_COLORS.danger} strokeDasharray="4 4" label={{ value: "규제비율(150%)", fontSize: 10, position: 'insideTopLeft' }} />
                <ReferenceLine y={500} stroke={CHART_COLORS.quaternary} strokeDasharray="4 4" label={{ value: "목표비율(500%)", fontSize: 10, position: 'insideTopLeft' }} />

                <Area type="monotone" dataKey="limit" name="규제한도" fill={CHART_COLORS.danger} opacity={0.1} stroke="none" />
                <Line type="monotone" dataKey="ncr" name="NCR" stroke={CHART_COLORS.primary} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </ComposedChart>
        </BaseChartWrapper>
    );
}
