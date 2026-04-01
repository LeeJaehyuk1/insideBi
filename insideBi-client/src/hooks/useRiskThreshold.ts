import { RiskSeverity } from "@/types/risk";

interface ThresholdConfig {
  caution: number;
  warning: number;
  danger: number;
  higherIsBetter?: boolean;
}

export function useRiskThreshold(
  value: number,
  config: ThresholdConfig
): RiskSeverity {
  const { caution, warning, danger, higherIsBetter = false } = config;

  if (higherIsBetter) {
    if (value <= danger) return "danger";
    if (value <= warning) return "warning";
    if (value <= caution) return "caution";
    return "normal";
  } else {
    if (value >= danger) return "danger";
    if (value >= warning) return "warning";
    if (value >= caution) return "caution";
    return "normal";
  }
}

export function getSeverityFromValue(
  value: number,
  config: ThresholdConfig
): RiskSeverity {
  const { caution, warning, danger, higherIsBetter = false } = config;
  if (higherIsBetter) {
    if (value <= danger) return "danger";
    if (value <= warning) return "warning";
    if (value <= caution) return "caution";
    return "normal";
  } else {
    if (value >= danger) return "danger";
    if (value >= warning) return "warning";
    if (value >= caution) return "caution";
    return "normal";
  }
}
