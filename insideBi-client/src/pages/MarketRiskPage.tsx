import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaRSummaryTable } from "@/components/market-risk/VaRSummaryTable";
import { ScenarioTable } from "@/components/market-risk/ScenarioTable";
import { VaRBarChart } from "@/components/charts/VaRBarChart";
import { StressTestChart } from "@/components/charts/StressTestChart";
import { SensitivityRadar } from "@/components/charts/SensitivityRadar";

export default function MarketRiskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">시장리스크</h1>
        <p className="text-muted-foreground text-sm mt-1">VaR / 스트레스 테스트 / 민감도 분석</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VaRSummaryTable />

        <Tabs defaultValue="var">
          <TabsList>
            <TabsTrigger value="var">VaR 추이</TabsTrigger>
            <TabsTrigger value="stress">스트레스</TabsTrigger>
            <TabsTrigger value="sensitivity">민감도</TabsTrigger>
          </TabsList>

          <TabsContent value="var" className="mt-4">
            <VaRBarChart />
          </TabsContent>

          <TabsContent value="stress" className="mt-4">
            <StressTestChart />
          </TabsContent>

          <TabsContent value="sensitivity" className="mt-4">
            <SensitivityRadar />
          </TabsContent>
        </Tabs>
      </div>

      <ScenarioTable />
    </div>
  );
}
