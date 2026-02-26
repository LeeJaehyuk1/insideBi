import { Card, CardContent } from "@/components/ui/card";
import { lcrSummary } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";
import { RiskStatusBadge } from "@/components/dashboard/RiskStatusBadge";

export function RegulatoryRatioCard() {
  const lcrSeverity = lcrSummary.lcr >= 120 ? "normal" as const : lcrSummary.lcr >= 110 ? "caution" as const : lcrSummary.lcr >= 100 ? "warning" as const : "danger" as const;
  const nsfrSeverity = lcrSummary.nsfr >= 115 ? "caution" as const : lcrSummary.nsfr >= 110 ? "warning" as const : lcrSummary.nsfr >= 100 ? "warning" as const : "danger" as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">유동성커버리지비율 (LCR)</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">규제 최저치: 100%</p>
            </div>
            <RiskStatusBadge severity={lcrSeverity} size="sm" />
          </div>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatPct(lcrSummary.lcr, 1)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground">HQLA</p>
              <p className="text-sm font-semibold">{formatKRW(lcrSummary.hqla)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground">순현금유출</p>
              <p className="text-sm font-semibold">{formatKRW(lcrSummary.netOutflow)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">순안정자금조달비율 (NSFR)</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">규제 최저치: 100%</p>
            </div>
            <RiskStatusBadge severity={nsfrSeverity} size="sm" />
          </div>
          <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{formatPct(lcrSummary.nsfr, 1)}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "1등급 (Level1)", value: formatKRW(lcrSummary.level1) },
              { label: "2A등급", value: formatKRW(lcrSummary.level2a) },
              { label: "2B등급", value: formatKRW(lcrSummary.level2b) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 p-2">
                <p className="text-xs text-muted-foreground truncate">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
