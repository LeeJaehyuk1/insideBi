"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ZAxis, Cell,
} from "recharts";
import { BaseChartWrapper } from "./BaseChartWrapper";
import { concentrationData } from "@/lib/mock-data";
import { SECTOR_COLORS } from "@/lib/constants";

export function ConcentrationBubble() {
  return (
    <BaseChartWrapper title="집중리스크 산포도 (PD × 익스포저 비중)" height={300}>
      <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="x" name="PD" unit="%" type="number" tick={{ fontSize: 11 }} label={{ value: "PD (%)", position: "bottom", fontSize: 11 }} />
        <YAxis dataKey="y" name="비중" unit="%" tick={{ fontSize: 11 }} label={{ value: "비중(%)", angle: -90, position: "insideLeft", fontSize: 11 }} />
        <ZAxis dataKey="z" range={[200, 2000]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0].payload;
            return (
              <div className="rounded-lg border bg-background p-2 text-xs shadow">
                <p className="font-medium">{d.name}</p>
                <p>PD: {d.x.toFixed(2)}%</p>
                <p>비중: {d.y.toFixed(1)}%</p>
              </div>
            );
          }}
        />
        <Scatter data={concentrationData} fill={SECTOR_COLORS[0]}>
          {concentrationData.map((_, i) => (
            <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
          ))}
        </Scatter>
      </ScatterChart>
    </BaseChartWrapper>
  );
}
