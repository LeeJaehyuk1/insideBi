export const ncrSummary = {
    currentNcr: 642.5,
    limitNcr: 150.0,
    netOperatingCapital: 425300,
    totalRisk: 66194,
    marketRisk: 32000,
    creditRisk: 29500,
    operationalRisk: 4694,
    warningLevel: 200,
    targetLevel: 500,
    changeFromLastMonth: 24.3,
};

export const ncrTrendData = [
    { month: "2025-03", ncr: 580.2, limit: 150 },
    { month: "2025-04", ncr: 592.5, limit: 150 },
    { month: "2025-05", ncr: 610.1, limit: 150 },
    { month: "2025-06", ncr: 605.4, limit: 150 },
    { month: "2025-07", ncr: 615.8, limit: 150 },
    { month: "2025-08", ncr: 620.3, limit: 150 },
    { month: "2025-09", ncr: 608.9, limit: 150 },
    { month: "2025-10", ncr: 612.4, limit: 150 },
    { month: "2025-11", ncr: 598.6, limit: 150 },
    { month: "2025-12", ncr: 625.1, limit: 150 },
    { month: "2026-01", ncr: 618.2, limit: 150 },
    { month: "2026-02", ncr: 642.5, limit: 150 },
];

export const riskComposition = [
    { name: "시장위험액", value: 32000, percentage: 48.3 },
    { name: "신용위험액", value: 29500, percentage: 44.6 },
    { name: "운영위험액", value: 4694, percentage: 7.1 },
];

export const netCapitalComponents = [
    { category: "영업용순자본", type: "총액", amount: 425300 },
    { category: "자본총계", type: "기본자본", amount: 380500 },
    { category: "차감항목", type: "차감", amount: -45200 },
    { category: "가산항목", type: "가산", amount: 90000 },
];
