export type RiskSeverity = "normal" | "caution" | "warning" | "danger";
export type RiskCategory = "credit" | "market" | "liquidity" | "operational";

export interface KRICard {
  id: string;
  title: string;
  value: number;
  unit: string;
  displayValue: string;
  severity: RiskSeverity;
  trend: "up" | "down" | "stable";
  trendValue: number;
  threshold: { caution: number; warning: number; danger: number };
  description: string;
  category: RiskCategory;
}

export interface Alert {
  id: string;
  severity: RiskSeverity;
  title: string;
  message: string;
  timestamp: string;
  category: RiskCategory;
  isRead: boolean;
}

export interface RiskHeatmapCell {
  row: number;
  col: number;
  label: string;
  likelihood: number;
  impact: number;
  severity: RiskSeverity;
}

export const BIS_THRESHOLDS = {
  npl: { caution: 1.5, warning: 2.0, danger: 3.0 },
  bis: { danger: 8.0, warning: 10.5, caution: 13.0 },
  lcr: { danger: 100, warning: 110, caution: 120 },
  nsfr: { danger: 100, warning: 110, caution: 115 },
} as const;
