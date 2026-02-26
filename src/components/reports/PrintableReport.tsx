import { kriCards, nplTable, varSummary, lcrSummary, stressScenarios } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";
import { RiskStatusBadge } from "@/components/dashboard/RiskStatusBadge";
import { ReportMeta } from "@/lib/mock-data";

interface PrintableReportProps {
  report: ReportMeta;
}

export function PrintableReport({ report }: PrintableReportProps) {
  return (
    <div className="space-y-8 print:space-y-6">
      {/* Header */}
      <div className="border-b pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground mt-1">{report.summary}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>작성: {report.author}</p>
            <p>날짜: {report.createdAt}</p>
            <p>쪽수: {report.pages}p</p>
          </div>
        </div>
      </div>

      {/* KRI Summary */}
      <section>
        <h2 className="text-lg font-semibold mb-4">1. 주요 리스크 지표 (KRI) 요약</h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted/50">
              <th className="border px-3 py-2 text-left text-xs">지표</th>
              <th className="border px-3 py-2 text-right text-xs">현재값</th>
              <th className="border px-3 py-2 text-center text-xs">상태</th>
              <th className="border px-3 py-2 text-center text-xs">추세</th>
              <th className="border px-3 py-2 text-left text-xs">설명</th>
            </tr>
          </thead>
          <tbody>
            {kriCards.map((k) => (
              <tr key={k.id} className="border-b">
                <td className="border px-3 py-2 text-xs font-medium">{k.title}</td>
                <td className="border px-3 py-2 text-right text-xs font-bold tabular-nums">{k.displayValue}</td>
                <td className="border px-3 py-2 text-center">
                  <RiskStatusBadge severity={k.severity} size="sm" />
                </td>
                <td className="border px-3 py-2 text-center text-xs">
                  {k.trend === "up" ? "▲" : k.trend === "down" ? "▼" : "→"} {k.trendValue > 0 ? "+" : ""}{k.trendValue}
                </td>
                <td className="border px-3 py-2 text-xs text-muted-foreground">{k.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Credit Risk */}
      <section className="print-break">
        <h2 className="text-lg font-semibold mb-4">2. 신용리스크 현황</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "NPL 비율", value: formatPct(nplTable.nplRatio) },
            { label: "대손충당금 적립률", value: formatPct(nplTable.provisionRatio, 1) },
            { label: "순 NPL 비율", value: formatPct(nplTable.netNpl) },
          ].map((item) => (
            <div key={item.label} className="border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Market Risk */}
      <section>
        <h2 className="text-lg font-semibold mb-4">3. 시장리스크 현황</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { label: "일일 VaR", value: formatKRW(varSummary.current) },
            { label: "한도 대비 소진율", value: formatPct(varSummary.utilization, 1) },
            { label: "20일 평균 VaR", value: formatKRW(varSummary.avgLast20) },
          ].map((item) => (
            <div key={item.label} className="border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Liquidity Risk */}
      <section>
        <h2 className="text-lg font-semibold mb-4">4. 유동성리스크 현황</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[
            { label: "LCR", value: formatPct(lcrSummary.lcr, 1), threshold: "규제최저: 100%" },
            { label: "NSFR", value: formatPct(lcrSummary.nsfr, 1), threshold: "규제최저: 100%" },
          ].map((item) => (
            <div key={item.label} className="border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">{item.label} ({item.threshold})</p>
              <p className="text-xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stress Test */}
      <section>
        <h2 className="text-lg font-semibold mb-4">5. 스트레스 테스트 결과</h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-muted/50">
              <th className="border px-3 py-2 text-left text-xs">시나리오</th>
              <th className="border px-3 py-2 text-right text-xs">총손실(억)</th>
              <th className="border px-3 py-2 text-right text-xs">충격 후 BIS</th>
            </tr>
          </thead>
          <tbody>
            {stressScenarios.map((s, i) => (
              <tr key={i} className="border-b">
                <td className="border px-3 py-2 text-xs">{s.name.replace("\n", " ")}</td>
                <td className="border px-3 py-2 text-right text-xs font-semibold tabular-nums">{s.total.toLocaleString()}</td>
                <td className={`border px-3 py-2 text-right text-xs font-semibold ${s.bisAfter < 10.5 ? "text-red-600" : "text-green-600"}`}>
                  {formatPct(s.bisAfter, 1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
