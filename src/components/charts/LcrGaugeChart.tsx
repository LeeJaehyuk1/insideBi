"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { lcrSummary } from "@/lib/mock-data";

interface GaugeProps {
  value: number;
  min?: number;
  max?: number;
  label: string;
  unit?: string;
  thresholds: { value: number; color: string }[];
  color: string;
}

function SemiCircleGauge({ value, min = 0, max = 200, label, unit = "%", thresholds, color }: GaugeProps) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const angle = -180 + pct * 180;
  const r = 70;
  const cx = 90;
  const cy = 90;

  const polarToCartesian = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const arcPath = (startAngle: number, endAngle: number, radius: number) => {
    const s = polarToCartesian(startAngle, radius);
    const e = polarToCartesian(endAngle, radius);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const needleEnd = polarToCartesian(angle, r - 12);

  return (
    <div className="flex flex-col items-center">
      <svg width={180} height={105} viewBox="0 0 180 105">
        {/* Background arc */}
        <path d={arcPath(-180, 0, r)} fill="none" stroke="currentColor" strokeWidth={14} className="text-muted/30" strokeLinecap="round" />
        {/* Color fill arc */}
        <path d={arcPath(-180, -180 + pct * 180, r)} fill="none" stroke={color} strokeWidth={14} strokeLinecap="round" />
        {/* Threshold ticks */}
        {thresholds.map((t, i) => {
          const tp = (t.value - min) / (max - min);
          const tickAngle = -180 + tp * 180;
          const outer = polarToCartesian(tickAngle, r + 10);
          const inner = polarToCartesian(tickAngle, r - 10);
          return (
            <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={t.color} strokeWidth={2} />
          );
        })}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleEnd.x} y2={needleEnd.y}
          stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="text-foreground" />
        <circle cx={cx} cy={cy} r={4} fill="currentColor" className="text-foreground" />
        {/* Value text */}
        <text x={cx} y={cy - 10} textAnchor="middle" fontSize={18} fontWeight="bold" fill={color}>
          {value.toFixed(1)}{unit}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={10} fill="currentColor" className="text-muted-foreground">
          {label}
        </text>
        {/* Scale labels */}
        <text x={12} y={98} fontSize={9} textAnchor="middle" fill="currentColor" className="text-muted-foreground">{min}%</text>
        <text x={cx} y={22} fontSize={9} textAnchor="middle" fill="currentColor" className="text-muted-foreground">{Math.round((min+max)/2)}%</text>
        <text x={168} y={98} fontSize={9} textAnchor="middle" fill="currentColor" className="text-muted-foreground">{max}%</text>
      </svg>
    </div>
  );
}

export function LcrGaugeChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">규제비율 게이지</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SemiCircleGauge
              value={lcrSummary.lcr}
              max={200}
              label="LCR"
              color="#3b82f6"
              thresholds={[
                { value: 100, color: "#ef4444" },
                { value: 110, color: "#f97316" },
                { value: 120, color: "#eab308" },
              ]}
            />
            <p className="text-center text-xs text-muted-foreground">규제최저: 100%</p>
          </div>
          <div>
            <SemiCircleGauge
              value={lcrSummary.nsfr}
              max={200}
              label="NSFR"
              color="#10b981"
              thresholds={[
                { value: 100, color: "#ef4444" },
                { value: 110, color: "#f97316" },
                { value: 115, color: "#eab308" },
              ]}
            />
            <p className="text-center text-xs text-muted-foreground">규제최저: 100%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
