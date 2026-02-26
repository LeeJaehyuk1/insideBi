import { DatasetSchema } from "@/types/dataset";

const nplTrendSchema: DatasetSchema = {
  id: "npl-trend",
  defaultDateColumn: "month",
  defaultMeasure: "npl",
  columns: [
    { key: "month", label: "월", type: "date", role: "dimension", aggregatable: false, filterable: true },
    { key: "npl", label: "NPL 비율", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
    { key: "substandard", label: "고정", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
    { key: "doubtful", label: "회의", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
    { key: "loss", label: "추정손실", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
  ],
};

const creditGradesSchema: DatasetSchema = {
  id: "credit-grades",
  defaultMeasure: "amount",
  defaultDimension: "grade",
  columns: [
    { key: "grade", label: "신용등급", type: "string", role: "dimension", aggregatable: false, filterable: true },
    { key: "amount", label: "익스포저", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "count", label: "건수", type: "number", role: "measure", aggregatable: true, filterable: true },
    { key: "pct", label: "비중", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: true },
  ],
};

const sectorExposureSchema: DatasetSchema = {
  id: "sector-exposure",
  defaultMeasure: "amount",
  defaultDimension: "sector",
  columns: [
    { key: "sector", label: "업종", type: "string", role: "dimension", aggregatable: false, filterable: true },
    { key: "amount", label: "익스포저", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "pct", label: "비중", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: true },
    { key: "pd", label: "PD", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
  ],
};

const concentrationSchema: DatasetSchema = {
  id: "concentration",
  defaultMeasure: "z",
  defaultDimension: "name",
  columns: [
    { key: "name", label: "업종명", type: "string", role: "dimension", aggregatable: false, filterable: true },
    { key: "x", label: "PD", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
    { key: "y", label: "비중", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
    { key: "z", label: "익스포저(조)", type: "number", role: "measure", aggregatable: true, filterable: true },
  ],
};

const nplSummarySchema: DatasetSchema = {
  id: "npl-summary",
  defaultMeasure: "nplRatio",
  columns: [
    { key: "totalLoan", label: "총여신", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "nplAmount", label: "NPL 금액", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "nplRatio", label: "NPL 비율", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "substandard", label: "고정", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "doubtful", label: "회의", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "loss", label: "추정손실", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "provisionAmount", label: "충당금", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "provisionRatio", label: "충당금 적립률", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "netNpl", label: "순 NPL 비율", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
  ],
};

const pdLgdEadSchema: DatasetSchema = {
  id: "pd-lgd-ead",
  defaultMeasure: "expectedLoss",
  columns: [
    { key: "pd", label: "PD", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "lgd", label: "LGD", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "ead", label: "EAD", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "expectedLoss", label: "기대손실", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "unexpectedLoss", label: "비기대손실", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "rwa", label: "RWA", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
  ],
};

const varTrendSchema: DatasetSchema = {
  id: "var-trend",
  defaultDateColumn: "date",
  defaultMeasure: "var",
  columns: [
    { key: "date", label: "날짜", type: "date", role: "dimension", aggregatable: false, filterable: true },
    { key: "var", label: "VaR", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "pnl", label: "PnL", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "limit", label: "한도", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
  ],
};

const stressScenariosSchema: DatasetSchema = {
  id: "stress-scenarios",
  defaultMeasure: "total",
  defaultDimension: "name",
  columns: [
    { key: "name", label: "시나리오", type: "string", role: "dimension", aggregatable: false, filterable: true },
    { key: "creditLoss", label: "신용손실", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "marketLoss", label: "시장손실", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "liquidityLoss", label: "유동성손실", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "total", label: "총손실", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "bisAfter", label: "충격후 BIS", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: true },
  ],
};

const sensitivitySchema: DatasetSchema = {
  id: "sensitivity",
  defaultMeasure: "value",
  defaultDimension: "factor",
  columns: [
    { key: "factor", label: "리스크 요인", type: "string", role: "dimension", aggregatable: false, filterable: true },
    { key: "value", label: "민감도 점수", type: "number", role: "measure", aggregatable: true, filterable: true },
    { key: "fullMark", label: "최대값", type: "number", role: "measure", aggregatable: false, filterable: false },
  ],
};

const varSummarySchema: DatasetSchema = {
  id: "var-summary",
  defaultMeasure: "current",
  columns: [
    { key: "current", label: "현재 VaR", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "limit", label: "한도", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "utilization", label: "한도 소진율", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "avgLast20", label: "20일 평균", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "maxLast20", label: "20일 최대", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "breachCount30d", label: "초과 건수(30일)", type: "number", role: "measure", aggregatable: false, filterable: false },
  ],
};

const lcrNsfrTrendSchema: DatasetSchema = {
  id: "lcr-nsfr-trend",
  defaultDateColumn: "month",
  defaultMeasure: "lcr",
  columns: [
    { key: "month", label: "월", type: "date", role: "dimension", aggregatable: false, filterable: true },
    { key: "lcr", label: "LCR", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
    { key: "nsfr", label: "NSFR", type: "percent", role: "measure", unit: "%", aggregatable: true, filterable: true },
    { key: "hqla", label: "HQLA", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "outflow", label: "순현금유출", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
  ],
};

const maturityGapSchema: DatasetSchema = {
  id: "maturity-gap",
  defaultMeasure: "gap",
  defaultDimension: "bucket",
  columns: [
    { key: "bucket", label: "만기 구간", type: "string", role: "dimension", aggregatable: false, filterable: true },
    { key: "assets", label: "자산", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "liabilities", label: "부채", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "gap", label: "갭", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
  ],
};

const liquidityBufferSchema: DatasetSchema = {
  id: "liquidity-buffer",
  defaultDateColumn: "date",
  defaultMeasure: "available",
  columns: [
    { key: "date", label: "날짜", type: "date", role: "dimension", aggregatable: false, filterable: true },
    { key: "available", label: "가용 유동성", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "required", label: "필요 유동성", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "stress", label: "스트레스 시나리오", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
  ],
};

const fundingStructureSchema: DatasetSchema = {
  id: "funding-structure",
  defaultMeasure: "amount",
  defaultDimension: "source",
  columns: [
    { key: "source", label: "조달원천", type: "string", role: "dimension", aggregatable: false, filterable: true },
    { key: "amount", label: "금액", type: "currency", role: "measure", unit: "억원", aggregatable: true, filterable: true },
    { key: "pct", label: "비중", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: true },
    { key: "stability", label: "안정성", type: "string", role: "dimension", aggregatable: false, filterable: true },
  ],
};

const lcrGaugeSchema: DatasetSchema = {
  id: "lcr-gauge",
  defaultMeasure: "lcr",
  columns: [
    { key: "lcr", label: "LCR", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "nsfr", label: "NSFR", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "hqla", label: "HQLA", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "netOutflow", label: "순현금유출", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "level1", label: "Level 1", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "level2a", label: "Level 2A", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "level2b", label: "Level 2B", type: "currency", role: "measure", unit: "억원", aggregatable: false, filterable: false },
    { key: "lcrThreshold", label: "LCR 기준", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
    { key: "nsfrThreshold", label: "NSFR 기준", type: "percent", role: "measure", unit: "%", aggregatable: false, filterable: false },
  ],
};

export const datasetSchemas: Record<string, DatasetSchema> = {
  "npl-trend": nplTrendSchema,
  "credit-grades": creditGradesSchema,
  "sector-exposure": sectorExposureSchema,
  "concentration": concentrationSchema,
  "npl-summary": nplSummarySchema,
  "pd-lgd-ead": pdLgdEadSchema,
  "var-trend": varTrendSchema,
  "stress-scenarios": stressScenariosSchema,
  "sensitivity": sensitivitySchema,
  "var-summary": varSummarySchema,
  "lcr-nsfr-trend": lcrNsfrTrendSchema,
  "maturity-gap": maturityGapSchema,
  "liquidity-buffer": liquidityBufferSchema,
  "funding-structure": fundingStructureSchema,
  "lcr-gauge": lcrGaugeSchema,
};

export function getDatasetSchema(id: string): DatasetSchema | undefined {
  if (datasetSchemas[id]) return datasetSchemas[id];
  // 커스텀 데이터셋: 런타임 스키마에서 동적 조회
  if (id.startsWith("custom-")) {
    // lazy import to avoid circular: getCustomDatasetSchema is side-effect free
    if (typeof window !== "undefined") {
      const { getCustomDatasetSchema } = require("@/lib/custom-dataset-runtime");
      return getCustomDatasetSchema(id);
    }
  }
  return undefined;
}
