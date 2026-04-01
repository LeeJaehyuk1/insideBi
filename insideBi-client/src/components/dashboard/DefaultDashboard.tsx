import { kriCards, alerts } from "@/lib/mock-data";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { RiskSummaryCard } from "@/components/dashboard/RiskSummaryCard";
import { RiskHeatMap } from "@/components/charts/RiskHeatMap";
import { KriTrendLine } from "@/components/charts/KriTrendLine";
import { LcrGaugeChart } from "@/components/charts/LcrGaugeChart";

export function DefaultDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">종합 리스크 현황</h1>
        <p className="text-muted-foreground text-sm mt-1">기준일: 2026년 2월 26일</p>
      </div>

      <AlertBanner alerts={alerts} />

      {/* KRI 카드 */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">주요 리스크 지표 (KRI)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kriCards.map((kri) => (
            <RiskSummaryCard key={kri.id} kri={kri} />
          ))}
        </div>
      </section>

      {/* 히트맵 + 규제비율 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskHeatMap />
        <LcrGaugeChart />
      </div>

      {/* KRI 트렌드 */}
      <KriTrendLine />
    </div>
  );
}
