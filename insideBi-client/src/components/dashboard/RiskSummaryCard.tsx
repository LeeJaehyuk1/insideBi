import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { KRICard } from "@/types/risk";
import { SEVERITY_COLORS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { RiskStatusBadge } from "./RiskStatusBadge";

interface RiskSummaryCardProps {
  kri: KRICard;
}

const TrendIcon = ({ trend }: { trend: KRICard["trend"] }) => {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5" />;
  return <Minus className="h-3.5 w-3.5" />;
};

export function RiskSummaryCard({ kri }: RiskSummaryCardProps) {
  const colors = SEVERITY_COLORS[kri.severity];
  const trendColor =
    kri.trend === "up"
      ? kri.category === "credit" || kri.category === "market"
        ? "text-red-500"
        : "text-green-500"
      : kri.trend === "down"
      ? kri.category === "credit" || kri.category === "market"
        ? "text-green-500"
        : "text-red-500"
      : "text-muted-foreground";

  return (
    <Card className={cn("border-l-4", colors.border.replace("border-", "border-l-"))}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-muted-foreground">{kri.title}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{kri.description}</p>
          </div>
          <RiskStatusBadge severity={kri.severity} size="sm" />
        </div>

        <div className="flex items-end justify-between">
          <p className={cn("text-2xl font-bold", colors.text)}>
            {kri.displayValue}
          </p>
          <div className={cn("flex items-center gap-1 text-xs", trendColor)}>
            <TrendIcon trend={kri.trend} />
            <span>
              {kri.trendValue > 0 ? "+" : ""}
              {kri.trendValue}
              {kri.unit}
            </span>
          </div>
        </div>

        {/* Threshold bar */}
        <div className="mt-3 space-y-1">
          <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("absolute left-0 top-0 h-full rounded-full transition-all", colors.text.replace("text-", "bg-"))}
              style={{
                width: `${Math.min(
                  (kri.value / kri.threshold.danger) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span>임계값: {kri.threshold.warning}{kri.unit}</span>
            <span>{kri.threshold.danger}{kri.unit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
