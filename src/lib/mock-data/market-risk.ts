import { VaRPoint, StressScenario } from "@/types/charts";

// Generate 250 trading days of VaR data
function generateVaRSeries(): VaRPoint[] {
  const data: VaRPoint[] = [];
  const today = new Date("2026-02-26");
  let var_ = 1150;
  const limit = 1500;
  for (let i = 249; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    var_ += (Math.random() - 0.48) * 40;
    var_ = Math.max(800, Math.min(1480, var_));
    const pnl = (Math.random() - 0.45) * 400 - 50;
    data.push({
      date: date.toISOString().slice(0, 10),
      var: Math.round(var_),
      pnl: Math.round(pnl),
      limit,
    });
  }
  return data;
}

export const varTimeSeries = generateVaRSeries();

export const varSummary = {
  current: 1250,
  limit: 1500,
  utilization: 83.3,
  avgLast20: 1198,
  maxLast20: 1385,
  breachCount30d: 0,
  delta: 680,
  gamma: -42,
  vega: 890,
  rho: 125,
};

export const stressScenarios: StressScenario[] = [
  {
    name: "글로벌 금융위기\n(2008년 유형)",
    creditLoss: 8420,
    marketLoss: 4850,
    liquidityLoss: 1200,
    total: 14470,
    bisAfter: 11.8,
  },
  {
    name: "코로나19\n(2020년 유형)",
    creditLoss: 5680,
    marketLoss: 6320,
    liquidityLoss: 980,
    total: 12980,
    bisAfter: 12.4,
  },
  {
    name: "금리 급등\n(+300bp)",
    creditLoss: 2340,
    marketLoss: 8960,
    liquidityLoss: 450,
    total: 11750,
    bisAfter: 12.8,
  },
  {
    name: "부동산 폭락\n(-30%)",
    creditLoss: 9840,
    marketLoss: 2180,
    liquidityLoss: 680,
    total: 12700,
    bisAfter: 12.5,
  },
  {
    name: "환율 급등\n(+20%)",
    creditLoss: 1250,
    marketLoss: 5640,
    liquidityLoss: 320,
    total: 7210,
    bisAfter: 13.9,
  },
  {
    name: "복합 위기\n시나리오",
    creditLoss: 12480,
    marketLoss: 9230,
    liquidityLoss: 2100,
    total: 23810,
    bisAfter: 9.2,
  },
];

export const sensitivityData = [
  { factor: "금리리스크", value: 85, fullMark: 100 },
  { factor: "환율리스크", value: 72, fullMark: 100 },
  { factor: "주식리스크", value: 58, fullMark: 100 },
  { factor: "신용스프레드", value: 67, fullMark: 100 },
  { factor: "원자재리스크", value: 34, fullMark: 100 },
  { factor: "변동성리스크", value: 61, fullMark: 100 },
];

export const positionSummary = [
  { category: "채권", longPosition: 125840, shortPosition: 48320, netPosition: 77520, pvbp: -4820 },
  { category: "FX", longPosition: 38920, shortPosition: 34580, netPosition: 4340, delta: 4340 },
  { category: "주식", longPosition: 24680, shortPosition: 8920, netPosition: 15760, beta: 1.12 },
  { category: "파생상품", longPosition: 182400, shortPosition: 176800, netPosition: 5600, gamma: -42 },
];
