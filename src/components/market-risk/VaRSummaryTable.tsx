import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { varSummary, positionSummary } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export function VaRSummaryTable() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">VaR 요약 (99%, 1일)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">현재 VaR</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatKRW(varSummary.current)}</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>한도 대비 {formatPct(varSummary.utilization, 1)}</span>
              <span>한도 {formatKRW(varSummary.limit)}</span>
            </div>
            <Progress value={varSummary.utilization} className="h-2" />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: "20일 평균", value: formatKRW(varSummary.avgLast20) },
              { label: "20일 최대", value: formatKRW(varSummary.maxLast20) },
              { label: "30일 한도초과", value: `${varSummary.breachCount30d}회` },
              { label: "한도 잔여", value: formatKRW(varSummary.limit - varSummary.current) },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">포지션 요약</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">자산군</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">매수</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">매도</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">순포지션</th>
              </tr>
            </thead>
            <tbody>
              {positionSummary.map((p) => (
                <tr key={p.category} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-xs font-medium">{p.category}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatKRW(p.longPosition)}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatKRW(p.shortPosition)}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-medium tabular-nums ${p.netPosition >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
                    {p.netPosition >= 0 ? "+" : ""}{formatKRW(p.netPosition)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
