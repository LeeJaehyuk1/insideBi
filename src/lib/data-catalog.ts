import { DatasetMeta } from "@/types/builder";

export const dataCatalog: DatasetMeta[] = [
  // 신용리스크
  { id: "npl-trend", label: "NPL 추이", category: "credit", categoryLabel: "신용리스크",
    description: "12개월 NPL 구성 추이", compatibleCharts: ["area", "line"], defaultChart: "area" },
  { id: "credit-grades", label: "신용등급 분포", category: "credit", categoryLabel: "신용리스크",
    description: "7단계 등급별 익스포저", compatibleCharts: ["bar", "pie"], defaultChart: "bar" },
  { id: "sector-exposure", label: "업종별 익스포저", category: "credit", categoryLabel: "신용리스크",
    description: "8개 업종별 익스포저 분포", compatibleCharts: ["pie", "bar"], defaultChart: "pie" },
  { id: "concentration", label: "집중리스크", category: "credit", categoryLabel: "신용리스크",
    description: "PD vs 업종별 비중 산포도", compatibleCharts: ["scatter"], defaultChart: "scatter" },
  { id: "npl-summary", label: "NPL 요약", category: "credit", categoryLabel: "신용리스크",
    description: "NPL 핵심 지표 요약", compatibleCharts: ["kpi", "table"], defaultChart: "kpi" },
  { id: "pd-lgd-ead", label: "PD / LGD / EAD", category: "credit", categoryLabel: "신용리스크",
    description: "신용리스크 측정 지표 카드", compatibleCharts: ["kpi"], defaultChart: "kpi" },

  // 시장리스크
  { id: "var-trend", label: "VaR 추이", category: "market", categoryLabel: "시장리스크",
    description: "최근 60 거래일 VaR 추이", compatibleCharts: ["line", "bar"], defaultChart: "line" },
  { id: "stress-scenarios", label: "스트레스 시나리오", category: "market", categoryLabel: "시장리스크",
    description: "6개 시나리오 손실 분해", compatibleCharts: ["bar", "table"], defaultChart: "bar" },
  { id: "sensitivity", label: "민감도 분석", category: "market", categoryLabel: "시장리스크",
    description: "리스크 요인별 민감도 레이더", compatibleCharts: ["radar"], defaultChart: "radar" },
  { id: "var-summary", label: "VaR 요약", category: "market", categoryLabel: "시장리스크",
    description: "VaR 핵심 지표 카드", compatibleCharts: ["kpi", "table"], defaultChart: "kpi" },

  // 유동성리스크
  { id: "lcr-nsfr-trend", label: "LCR / NSFR 추이", category: "liquidity", categoryLabel: "유동성리스크",
    description: "12개월 LCR/NSFR 추이", compatibleCharts: ["line", "area"], defaultChart: "line" },
  { id: "maturity-gap", label: "만기 갭", category: "liquidity", categoryLabel: "유동성리스크",
    description: "만기 구간별 자산/부채 갭", compatibleCharts: ["bar"], defaultChart: "bar" },
  { id: "liquidity-buffer", label: "유동성 버퍼", category: "liquidity", categoryLabel: "유동성리스크",
    description: "HQLA vs 순현금유출 추이", compatibleCharts: ["area", "line"], defaultChart: "area" },
  { id: "funding-structure", label: "조달구조", category: "liquidity", categoryLabel: "유동성리스크",
    description: "조달원천별 비중", compatibleCharts: ["pie", "bar"], defaultChart: "pie" },
  { id: "lcr-gauge", label: "LCR / NSFR 게이지", category: "liquidity", categoryLabel: "유동성리스크",
    description: "규제비율 반원 게이지", compatibleCharts: ["gauge"], defaultChart: "gauge" },
];

export const CATEGORY_ORDER = ["credit", "market", "liquidity"] as const;

export const categoryMeta = {
  credit: { label: "신용리스크", color: "text-orange-600 dark:text-orange-400" },
  market: { label: "시장리스크", color: "text-blue-600 dark:text-blue-400" },
  liquidity: { label: "유동성리스크", color: "text-teal-600 dark:text-teal-400" },
};

export const chartTypeLabels: Record<string, string> = {
  line: "라인", area: "면적", bar: "막대",
  pie: "파이", scatter: "산포도", radar: "레이더",
  gauge: "게이지", table: "테이블", kpi: "KPI 카드",
};

export function getDataset(id: string): DatasetMeta | undefined {
  return dataCatalog.find((d) => d.id === id);
}
