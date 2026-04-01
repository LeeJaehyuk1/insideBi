import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PdLgdEadCards } from "@/components/credit-risk/PdLgdEadCards";
import { NplSummaryTable } from "@/components/credit-risk/NplSummaryTable";
import { ConcentrationRiskPanel } from "@/components/credit-risk/ConcentrationRiskPanel";
import { NplTrendArea } from "@/components/charts/NplTrendArea";
import { CreditGradeBar } from "@/components/charts/CreditGradeBar";
import { ExposureDonutChart } from "@/components/charts/ExposureDonutChart";
import { ConcentrationBubble } from "@/components/charts/ConcentrationBubble";

export default function CreditRiskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">신용리스크</h1>
        <p className="text-muted-foreground text-sm mt-1">NPL / PD / LGD / EAD 현황</p>
      </div>

      {/* PD/LGD/EAD 요약 카드 */}
      <PdLgdEadCards />

      {/* 탭별 상세 */}
      <Tabs defaultValue="npl">
        <TabsList>
          <TabsTrigger value="npl">NPL 추이</TabsTrigger>
          <TabsTrigger value="grade">신용등급 분포</TabsTrigger>
          <TabsTrigger value="sector">업종별 익스포저</TabsTrigger>
          <TabsTrigger value="concentration">집중리스크</TabsTrigger>
        </TabsList>

        <TabsContent value="npl" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <NplTrendArea />
            <NplSummaryTable />
          </div>
        </TabsContent>

        <TabsContent value="grade" className="mt-4">
          <CreditGradeBar />
        </TabsContent>

        <TabsContent value="sector" className="mt-4">
          <ExposureDonutChart />
        </TabsContent>

        <TabsContent value="concentration" className="mt-4 space-y-4">
          <ConcentrationBubble />
          <ConcentrationRiskPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
