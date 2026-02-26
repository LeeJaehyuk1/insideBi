"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { heatmapRisks, heatmapAxisLabels } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { SEVERITY_COLORS } from "@/lib/constants";
import { RiskSeverity } from "@/types/risk";

const cellColor: Record<RiskSeverity, string> = {
  normal: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700",
  caution: "bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700",
  warning: "bg-orange-100 dark:bg-orange-900 border-orange-300 dark:border-orange-700",
  danger: "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700",
};

const cellTextColor: Record<RiskSeverity, string> = {
  normal: "text-green-800 dark:text-green-200",
  caution: "text-yellow-800 dark:text-yellow-200",
  warning: "text-orange-800 dark:text-orange-200",
  danger: "text-red-800 dark:text-red-200",
};

export function RiskHeatMap() {
  const grid: Record<string, (typeof heatmapRisks)[0]> = {};
  heatmapRisks.forEach((r) => {
    grid[`${r.row}-${r.col}`] = r;
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">리스크 히트맵 (발생가능성 × 영향도)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          {/* Y axis label */}
          <div className="flex flex-col items-center justify-center w-6">
            <span className="text-[10px] text-muted-foreground rotate-[-90deg] whitespace-nowrap">영향도 (Impact) →</span>
          </div>

          <div className="flex-1">
            {/* Grid */}
            <div className="grid gap-1.5" style={{ gridTemplateRows: "repeat(5, 1fr)", gridTemplateColumns: "auto repeat(5, 1fr)" }}>
              {[5, 4, 3, 2, 1].map((row) => (
                <React.Fragment key={row}>
                  {/* Row label */}
                  <div className="flex items-center justify-end pr-2">
                    <span className="text-[10px] text-muted-foreground">{heatmapAxisLabels.y[row - 1]}</span>
                  </div>

                  {[1, 2, 3, 4, 5].map((col) => {
                    const cell = grid[`${row}-${col}`];
                    const baseSeverity: RiskSeverity =
                      row + col >= 9 ? "danger" :
                      row + col >= 7 ? "warning" :
                      row + col >= 5 ? "caution" : "normal";
                    const severity = cell?.severity ?? baseSeverity;

                    return (
                      <div
                        key={col}
                        className={cn(
                          "relative flex items-center justify-center rounded-lg border p-1 min-h-[60px] text-center",
                          cellColor[severity]
                        )}
                      >
                        {cell && (
                          <p className={cn("text-[10px] font-medium leading-tight whitespace-pre-line", cellTextColor[severity])}>
                            {cell.label}
                          </p>
                        )}
                        {!cell && (
                          <span className="text-[10px] opacity-30">{row + col >= 8 ? "●" : "○"}</span>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* X axis labels */}
            <div className="grid gap-1.5 mt-2" style={{ gridTemplateColumns: "auto repeat(5, 1fr)" }}>
              <div />
              {heatmapAxisLabels.x.map((label) => (
                <div key={label} className="text-center">
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-1">발생가능성 (Likelihood) →</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {(["normal", "caution", "warning", "danger"] as RiskSeverity[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={cn("h-3 w-3 rounded", cellColor[s].split(" ")[0])} />
              <span className="text-[10px] text-muted-foreground">
                {s === "normal" ? "낮음" : s === "caution" ? "주의" : s === "warning" ? "경보" : "위험"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
