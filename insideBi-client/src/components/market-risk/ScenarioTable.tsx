import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stressScenarios } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";

export function ScenarioTable() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">스트레스 테스트 시나리오별 손실 (단위: 억원)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">시나리오</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">신용손실</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">시장손실</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">유동성손실</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">총손실</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">충격 후 BIS</th>
              </tr>
            </thead>
            <tbody>
              {stressScenarios.map((s, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-xs font-medium whitespace-pre-line">{s.name}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{s.creditLoss.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{s.marketLoss.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-xs tabular-nums">{s.liquidityLoss.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right text-xs font-semibold tabular-nums text-red-600 dark:text-red-400">{s.total.toLocaleString()}</td>
                  <td className={`px-4 py-2.5 text-right text-xs font-semibold ${s.bisAfter < 10.5 ? "text-red-600 dark:text-red-400" : s.bisAfter < 13 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>
                    {formatPct(s.bisAfter, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
