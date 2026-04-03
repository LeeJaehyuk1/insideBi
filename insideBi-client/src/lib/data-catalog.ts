import { DatasetMeta } from "@/types/builder";

export const dataCatalog: DatasetMeta[] = [
  {
    id: "td_dmaqfx",
    label: "환율 추이",
    category: "market",
    categoryLabel: "시장 데이터",
    description: "std_date와 currency_code를 기준으로 환율, USD 환율 추이를 비교합니다.",
    compatibleCharts: ["line", "bar", "scatter", "table"],
    defaultChart: "line",
  },
  {
    id: "td_dmaqindex",
    label: "지수 가격 추이",
    category: "market",
    categoryLabel: "시장 데이터",
    description: "index_name별 curr_price, min_price, max_price 흐름을 비교합니다.",
    compatibleCharts: ["line", "bar", "scatter", "table"],
    defaultChart: "line",
  },
  {
    id: "td_dmaqvol",
    label: "변동성 추이",
    category: "market",
    categoryLabel: "시장 데이터",
    description: "underlying_id와 vol, quanto_vol, quanto_rho를 기준으로 변동성을 분석합니다.",
    compatibleCharts: ["line", "bar", "scatter", "table"],
    defaultChart: "line",
  },
];

export const CATEGORY_ORDER = ["market"] as const;

export const categoryMeta = {
  market: { label: "시장 데이터", color: "text-blue-600 dark:text-blue-400" },
};

export const chartTypeLabels: Record<string, string> = {
  line: "라인",
  area: "면적",
  bar: "막대",
  pie: "파이",
  scatter: "산점도",
  radar: "레이더",
  gauge: "게이지",
  table: "테이블",
  kpi: "KPI 카드",
  waterfall: "워터폴 차트",
  bullet: "불릿 차트",
};

export function getDataset(id: string): DatasetMeta | undefined {
  return dataCatalog.find((dataset) => dataset.id === id);
}
