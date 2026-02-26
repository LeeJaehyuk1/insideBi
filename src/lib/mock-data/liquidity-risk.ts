import { LcrPoint, MaturityGapPoint } from "@/types/charts";

export const lcrNsfrTrend: LcrPoint[] = [
  { month: "2025-03", lcr: 158.2, nsfr: 124.5, hqla: 48200, outflow: 30470 },
  { month: "2025-04", lcr: 155.8, nsfr: 123.2, hqla: 47800, outflow: 30680 },
  { month: "2025-05", lcr: 153.4, nsfr: 122.8, hqla: 47350, outflow: 30870 },
  { month: "2025-06", lcr: 151.2, nsfr: 122.1, hqla: 46980, outflow: 31070 },
  { month: "2025-07", lcr: 149.8, nsfr: 121.4, hqla: 46720, outflow: 31190 },
  { month: "2025-08", lcr: 148.3, nsfr: 120.8, hqla: 46340, outflow: 31250 },
  { month: "2025-09", lcr: 147.1, nsfr: 120.3, hqla: 46120, outflow: 31360 },
  { month: "2025-10", lcr: 145.9, nsfr: 119.8, hqla: 45840, outflow: 31420 },
  { month: "2025-11", lcr: 144.5, nsfr: 119.2, hqla: 45560, outflow: 31510 },
  { month: "2025-12", lcr: 143.8, nsfr: 118.9, hqla: 45280, outflow: 31490 },
  { month: "2026-01", lcr: 143.1, nsfr: 118.9, hqla: 45120, outflow: 31530 },
  { month: "2026-02", lcr: 142.3, nsfr: 118.7, hqla: 44980, outflow: 31610 },
];

export const lcrSummary = {
  lcr: 142.3,
  nsfr: 118.7,
  hqla: 44980,
  netOutflow: 31610,
  level1: 38420,
  level2a: 4820,
  level2b: 1740,
  lcrThreshold: 100,
  nsfrThreshold: 100,
};

export const maturityGap: MaturityGapPoint[] = [
  { bucket: "1일이내", assets: 18420, liabilities: 22840, gap: -4420 },
  { bucket: "1주이내", assets: 12680, liabilities: 18340, gap: -5660 },
  { bucket: "1개월이내", assets: 24850, liabilities: 28920, gap: -4070 },
  { bucket: "3개월이내", assets: 32480, liabilities: 29840, gap: 2640 },
  { bucket: "6개월이내", assets: 28640, liabilities: 24180, gap: 4460 },
  { bucket: "1년이내", assets: 35920, liabilities: 28460, gap: 7460 },
  { bucket: "1년초과", assets: 98420, liabilities: 99630, gap: -1210 },
];

export const liquidityBuffer = [
  { date: "2026-02", available: 44980, required: 31610, stress: 52840 },
  { date: "2026-03", available: 43200, required: 32100, stress: 53200 },
  { date: "2026-04", available: 42800, required: 32400, stress: 53600 },
  { date: "2026-05", available: 42500, required: 32600, stress: 54100 },
  { date: "2026-06", available: 41800, required: 33000, stress: 54500 },
];

export const fundingStructure = [
  { source: "원화예금", amount: 142580, pct: 48.2, stability: "high" },
  { source: "외화예금", amount: 28420, pct: 9.6, stability: "medium" },
  { source: "발행채권", amount: 48640, pct: 16.4, stability: "high" },
  { source: "콜머니", amount: 8920, pct: 3.0, stability: "low" },
  { source: "RP매도", amount: 15680, pct: 5.3, stability: "low" },
  { source: "자기자본", amount: 28480, pct: 9.6, stability: "high" },
  { source: "기타", amount: 23280, pct: 7.9, stability: "medium" },
];
