import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fundingStructure } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";

const stabilityLabel: Record<string, string> = {
  high: "안정",
  medium: "보통",
  low: "불안정",
};

const stabilityColor: Record<string, string> = {
  high: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-red-600 dark:text-red-400",
};

export function FundingGapTable() {
  const total = fundingStructure.reduce((s, f) => s + f.amount, 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">조달구조 현황</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">조달원천</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">금액</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">비중</th>
              <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">안정성</th>
            </tr>
          </thead>
          <tbody>
            {fundingStructure.map((f) => (
              <tr key={f.source} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2.5 text-xs font-medium">{f.source}</td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatKRW(f.amount)}</td>
                <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatPct(f.pct, 1)}</td>
                <td className={`px-4 py-2.5 text-center text-xs font-medium ${stabilityColor[f.stability]}`}>
                  {stabilityLabel[f.stability]}
                </td>
              </tr>
            ))}
            <tr className="border-t bg-muted/30 font-semibold">
              <td className="px-4 py-2.5 text-xs">합계</td>
              <td className="px-4 py-2.5 text-right text-xs tabular-nums">{formatKRW(total)}</td>
              <td className="px-4 py-2.5 text-right text-xs">100%</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
