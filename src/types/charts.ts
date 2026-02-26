export interface TimeSeriesPoint {
  date: string;
  value: number;
  limit?: number;
}

export interface NplTrendPoint {
  month: string;
  npl: number;
  substandard: number;
  doubtful: number;
  loss: number;
}

export interface VaRPoint {
  date: string;
  var: number;
  pnl: number;
  limit: number;
}

export interface CreditGradePoint {
  grade: string;
  amount: number;
  count: number;
  pct: number;
}

export interface SectorExposure {
  sector: string;
  amount: number;
  pct: number;
  pd: number;
}

export interface StressScenario {
  name: string;
  creditLoss: number;
  marketLoss: number;
  liquidityLoss: number;
  total: number;
  bisAfter: number;
}

export interface MaturityGapPoint {
  bucket: string;
  assets: number;
  liabilities: number;
  gap: number;
}

export interface LcrPoint {
  month: string;
  lcr: number;
  nsfr: number;
  hqla: number;
  outflow: number;
}
