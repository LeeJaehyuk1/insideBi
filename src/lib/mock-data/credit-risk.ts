import { NplTrendPoint, CreditGradePoint, SectorExposure } from "@/types/charts";

export const nplTrend: NplTrendPoint[] = [
  { month: "2025-03", npl: 1.52, substandard: 0.92, doubtful: 0.41, loss: 0.19 },
  { month: "2025-04", npl: 1.55, substandard: 0.94, doubtful: 0.42, loss: 0.19 },
  { month: "2025-05", npl: 1.58, substandard: 0.95, doubtful: 0.43, loss: 0.20 },
  { month: "2025-06", npl: 1.61, substandard: 0.97, doubtful: 0.44, loss: 0.20 },
  { month: "2025-07", npl: 1.64, substandard: 0.98, doubtful: 0.45, loss: 0.21 },
  { month: "2025-08", npl: 1.67, substandard: 1.00, doubtful: 0.45, loss: 0.22 },
  { month: "2025-09", npl: 1.70, substandard: 1.02, doubtful: 0.46, loss: 0.22 },
  { month: "2025-10", npl: 1.72, substandard: 1.03, doubtful: 0.47, loss: 0.22 },
  { month: "2025-11", npl: 1.75, substandard: 1.05, doubtful: 0.47, loss: 0.23 },
  { month: "2025-12", npl: 1.78, substandard: 1.07, doubtful: 0.48, loss: 0.23 },
  { month: "2026-01", npl: 1.80, substandard: 1.08, doubtful: 0.48, loss: 0.24 },
  { month: "2026-02", npl: 1.82, substandard: 1.09, doubtful: 0.49, loss: 0.24 },
];

export const nplTable = {
  totalLoan: 185420,
  nplAmount: 3375,
  nplRatio: 1.82,
  substandard: 2019,
  doubtful: 907,
  loss: 449,
  provisionAmount: 2940,
  provisionRatio: 87.1,
  netNpl: 0.24,
};

export const pdLgdEad = {
  pd: 1.24,
  lgd: 42.3,
  ead: 185420,
  expectedLoss: 972,
  unexpectedLoss: 3240,
  rwa: 98350,
};

export const creditGrades: CreditGradePoint[] = [
  { grade: "AAA", amount: 24580, count: 328, pct: 13.3 },
  { grade: "AA", amount: 38920, count: 612, pct: 21.0 },
  { grade: "A", amount: 45230, count: 1842, pct: 24.4 },
  { grade: "BBB", amount: 32180, count: 4231, pct: 17.4 },
  { grade: "BB", amount: 25640, count: 8562, pct: 13.8 },
  { grade: "B", amount: 13280, count: 12840, pct: 7.2 },
  { grade: "CCC이하", amount: 5590, count: 6218, pct: 3.0 },
];

export const sectorExposures: SectorExposure[] = [
  { sector: "제조업", amount: 42850, pct: 23.1, pd: 1.12 },
  { sector: "부동산", amount: 38920, pct: 21.0, pd: 2.31 },
  { sector: "도소매", amount: 24680, pct: 13.3, pd: 1.85 },
  { sector: "금융서비스", amount: 22140, pct: 11.9, pd: 0.48 },
  { sector: "건설업", amount: 18560, pct: 10.0, pd: 2.67 },
  { sector: "IT/통신", amount: 15230, pct: 8.2, pd: 0.92 },
  { sector: "운수/물류", amount: 12840, pct: 6.9, pd: 1.43 },
  { sector: "기타", amount: 10200, pct: 5.5, pd: 1.78 },
];

export const concentrationData = sectorExposures.map((s) => ({
  name: s.sector,
  x: s.pd,
  y: s.pct,
  z: s.amount / 1000,
}));

export const top20Borrowers = [
  { rank: 1, name: "A전자", amount: 4850, pct: 2.62, grade: "AA", sector: "제조업" },
  { rank: 2, name: "B건설", amount: 3920, pct: 2.12, grade: "BBB", sector: "건설업" },
  { rank: 3, name: "C그룹", amount: 3680, pct: 1.99, grade: "A", sector: "제조업" },
  { rank: 4, name: "D부동산", amount: 3210, pct: 1.73, grade: "BB", sector: "부동산" },
  { rank: 5, name: "E통신", amount: 2940, pct: 1.59, grade: "A", sector: "IT/통신" },
];
