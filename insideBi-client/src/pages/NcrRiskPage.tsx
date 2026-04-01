import { NcrSummaryTable } from "@/components/ncr-risk/NcrSummaryTable";
import { NcrTrendChart } from "@/components/charts/NcrTrendChart";
import { RiskCompositionDonut } from "@/components/charts/RiskCompositionDonut";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NcrRiskPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">NCR리스크</h1>
                <p className="text-muted-foreground text-sm mt-1">영업용순자본비율 및 총위험액 현황</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NcrSummaryTable />

                <div className="space-y-6">
                    <Tabs defaultValue="trend">
                        <TabsList>
                            <TabsTrigger value="trend">NCR 추이</TabsTrigger>
                            <TabsTrigger value="composition">위험액 구성</TabsTrigger>
                        </TabsList>

                        <TabsContent value="trend" className="mt-4">
                            <NcrTrendChart />
                        </TabsContent>

                        <TabsContent value="composition" className="mt-4">
                            <RiskCompositionDonut />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
