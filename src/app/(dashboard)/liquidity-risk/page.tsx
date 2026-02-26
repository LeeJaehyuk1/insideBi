import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegulatoryRatioCard } from "@/components/liquidity-risk/RegulatoryRatioCard";
import { FundingGapTable } from "@/components/liquidity-risk/FundingGapTable";
import { LcrGaugeChart } from "@/components/charts/LcrGaugeChart";
import { MaturityGapChart } from "@/components/charts/MaturityGapChart";
import { LiquidityBufferArea } from "@/components/charts/LiquidityBufferArea";

export default function LiquidityRiskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">유동성리스크</h1>
        <p className="text-muted-foreground text-sm mt-1">LCR / NSFR / 만기갭 / 조달구조</p>
      </div>

      {/* 규제비율 요약 */}
      <RegulatoryRatioCard />

      {/* 게이지 */}
      <LcrGaugeChart />

      {/* 탭 */}
      <Tabs defaultValue="trend">
        <TabsList>
          <TabsTrigger value="trend">LCR/NSFR 추이</TabsTrigger>
          <TabsTrigger value="gap">만기 갭</TabsTrigger>
          <TabsTrigger value="buffer">유동성 버퍼</TabsTrigger>
          <TabsTrigger value="funding">조달구조</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="mt-4">
          <LiquidityBufferArea />
        </TabsContent>

        <TabsContent value="gap" className="mt-4">
          <MaturityGapChart />
        </TabsContent>

        <TabsContent value="buffer" className="mt-4">
          <LiquidityBufferArea />
        </TabsContent>

        <TabsContent value="funding" className="mt-4">
          <FundingGapTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
