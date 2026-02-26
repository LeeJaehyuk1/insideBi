"use client";

import * as React from "react";

export interface BulletItem {
  label: string;
  value: number;
  target?: number;   // vertical target marker
  low?: number;      // upper bound of "danger" zone (red band)
  mid?: number;      // upper bound of "caution" zone (yellow band)
  max?: number;      // scale maximum
  unit?: string;
  color?: string;
}

function BulletBar({ item }: { item: BulletItem }) {
  const safeMax = item.max ?? Math.max(item.value * 1.4, (item.target ?? 0) * 1.2, 1);
  const pct = (v: number) => `${Math.min((v / safeMax) * 100, 100).toFixed(1)}%`;

  const low = item.low ?? safeMax * 0.35;
  const mid = item.mid ?? safeMax * 0.65;
  const barColor = item.color ?? "#3b82f6";

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-24 shrink-0 text-right text-xs text-muted-foreground truncate">
        {item.label}
      </span>

      <div className="relative flex-1 h-5">
        {/* Background bands: danger → caution → good (left to right = worse to better) */}
        <div className="absolute inset-y-1 left-0 right-0 rounded bg-red-100 dark:bg-red-950/40" />
        <div
          className="absolute inset-y-1 left-0 rounded bg-yellow-100 dark:bg-yellow-950/40"
          style={{ width: pct(mid) }}
        />
        <div
          className="absolute inset-y-1 left-0 rounded bg-green-100 dark:bg-green-950/40"
          style={{ width: pct(low) }}
        />

        {/* Actual value bar */}
        <div
          className="absolute inset-y-1.5 left-0 rounded transition-all"
          style={{ width: pct(item.value), backgroundColor: barColor }}
        />

        {/* Target marker */}
        {item.target !== undefined && (
          <div
            className="absolute inset-y-0 w-0.5 bg-foreground/70"
            style={{ left: pct(item.target) }}
          />
        )}
      </div>

      <span className="w-20 shrink-0 text-right text-xs font-medium tabular-nums">
        {item.value.toLocaleString()}
        {item.unit ? ` ${item.unit}` : ""}
      </span>
    </div>
  );
}

export function BulletChart({
  items,
  height = 240,
}: {
  items: BulletItem[];
  height?: number;
}) {
  return (
    <div
      className="flex flex-col justify-center px-3 py-2"
      style={{ minHeight: height }}
    >
      {items.map((item, i) => (
        <BulletBar key={i} item={item} />
      ))}

      {/* Legend */}
      <div className="mt-3 flex justify-end gap-3">
        {[
          { cls: "bg-red-100 dark:bg-red-950/40", label: "위험" },
          { cls: "bg-yellow-100 dark:bg-yellow-950/40", label: "주의" },
          { cls: "bg-green-100 dark:bg-green-950/40", label: "양호" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`h-2 w-8 rounded ${cls}`} />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="h-3 w-0.5 bg-foreground/70" />
          <span className="text-[10px] text-muted-foreground">목표</span>
        </div>
      </div>
    </div>
  );
}
