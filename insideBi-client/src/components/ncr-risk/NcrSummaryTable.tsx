import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ncrSummary, netCapitalComponents } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";

export function NcrSummaryTable() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">NCR 요약</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">현재 NCR</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {formatPct(ncrSummary.currentNcr)}
                            </span>
                            <span className={`text-xs ${ncrSummary.changeFromLastMonth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {ncrSummary.changeFromLastMonth > 0 ? '▲' : '▼'} {Math.abs(ncrSummary.changeFromLastMonth).toFixed(1)}%p
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {[
                            { label: "영업용순자본", value: formatKRW(ncrSummary.netOperatingCapital) },
                            { label: "총위험액", value: formatKRW(ncrSummary.totalRisk) },
                            { label: "목표비율", value: formatPct(ncrSummary.targetLevel) },
                            { label: "규제비율", value: formatPct(ncrSummary.limitNcr) },
                        ].map((item) => (
                            <div key={item.label} className="rounded-lg bg-muted/50 p-3 flex flex-col justify-center items-center">
                                <p className="text-xs text-muted-foreground">{item.label}</p>
                                <p className="text-sm font-semibold mt-0.5">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">영업용순자본 상세</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">구분</th>
                                <th className="px-4 py-2 text-center text-xs font-medium text-muted-foreground">유형</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">금액</th>
                            </tr>
                        </thead>
                        <tbody>
                            {netCapitalComponents.map((p) => (
                                <tr key={p.category} className="border-b last:border-0 hover:bg-muted/30">
                                    <td className="px-4 py-2.5 text-xs font-medium">{p.category}</td>
                                    <td className="px-4 py-2.5 text-center text-xs">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.type === '가산' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                p.type === '차감' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            }`}>
                                            {p.type}
                                        </span>
                                    </td>
                                    <td className={`px-4 py-2.5 text-right text-xs font-medium tabular-nums ${p.type === '차감' ? 'text-red-600 dark:text-red-400' : ''}`}>
                                        {formatKRW(p.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
