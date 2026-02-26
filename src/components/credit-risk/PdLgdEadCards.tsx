import { Card, CardContent } from "@/components/ui/card";
import { pdLgdEad } from "@/lib/mock-data";
import { formatKRW, formatPct } from "@/lib/utils";

const metrics = [
  { label: "PD (부도확률)", value: formatPct(pdLgdEad.pd), desc: "Expected Default Frequency", color: "text-orange-600 dark:text-orange-400" },
  { label: "LGD (부도시손실률)", value: formatPct(pdLgdEad.lgd, 1), desc: "Loss Given Default", color: "text-red-600 dark:text-red-400" },
  { label: "EAD (부도시익스포저)", value: formatKRW(pdLgdEad.ead), desc: "Exposure at Default", color: "text-blue-600 dark:text-blue-400" },
  { label: "기대손실 (EL)", value: formatKRW(pdLgdEad.expectedLoss), desc: "PD × LGD × EAD", color: "text-yellow-600 dark:text-yellow-400" },
  { label: "비기대손실 (UL)", value: formatKRW(pdLgdEad.unexpectedLoss), desc: "99.9% 신뢰수준", color: "text-purple-600 dark:text-purple-400" },
  { label: "위험가중자산 (RWA)", value: formatKRW(pdLgdEad.rwa), desc: "Credit Risk RWA", color: "text-teal-600 dark:text-teal-400" },
];

export function PdLgdEadCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className={`text-xl font-bold mt-1 ${m.color}`}>{m.value}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">{m.desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
