import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { top20Borrowers } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";

export function ConcentrationRiskPanel() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">상위 5대 차주 현황</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">순위</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">차주명</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">익스포저</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">비중</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">등급</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">업종</th>
            </tr>
          </thead>
          <tbody>
            {top20Borrowers.map((b) => (
              <tr key={b.rank} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.rank}</td>
                <td className="px-4 py-2.5 text-xs font-medium">{b.name}</td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatKRW(b.amount)}</td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatPct(b.pct)}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted">{b.grade}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-muted-foreground">{b.sector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
