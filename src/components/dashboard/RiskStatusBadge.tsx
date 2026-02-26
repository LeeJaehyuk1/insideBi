import { cn } from "@/lib/utils";
import { SEVERITY_COLORS } from "@/lib/constants";
import { RiskSeverity } from "@/types/risk";

const labels: Record<RiskSeverity, string> = {
  normal: "정상",
  caution: "주의",
  warning: "경보",
  danger: "위험",
};

interface RiskStatusBadgeProps {
  severity: RiskSeverity;
  className?: string;
  size?: "sm" | "md";
}

export function RiskStatusBadge({ severity, className, size = "md" }: RiskStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        SEVERITY_COLORS[severity].badge,
        className
      )}
    >
      {labels[severity]}
    </span>
  );
}
