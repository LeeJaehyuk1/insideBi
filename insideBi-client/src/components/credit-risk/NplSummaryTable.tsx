import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nplTable } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";
import { RiskStatusBadge } from "@/components/dashboard/RiskStatusBadge";

export function NplSummaryTable() {
  const rows = [
    { label: "총여신", value: formatKRW(nplTable.totalLoan), sub: "" },
    { label: "고정이하여신 (NPL)", value: formatKRW(nplTable.nplAmount), sub: `비율 ${formatPct(nplTable.nplRatio)}` },
    { label: "고정 (Substandard)", value: formatKRW(nplTable.substandard), sub: "" },
    { label: "회의 (Doubtful)", value: formatKRW(nplTable.doubtful), sub: "" },
    { label: "추정손실 (Loss)", value: formatKRW(nplTable.loss), sub: "" },
    { label: "대손충당금", value: formatKRW(nplTable.provisionAmount), sub: `적립률 ${formatPct(nplTable.provisionRatio, 1)}` },
    { label: "순NPL비율", value: formatPct(nplTable.netNpl), sub: "충당금 차감 후" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">NPL 현황 요약</CardTitle>
          <RiskStatusBadge severity="caution" size="sm" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">구분</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">금액</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-2.5 text-xs">{row.label}</td>
                <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums">{row.value}</td>
                <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{row.sub}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
