/* ── DB / 테이블 카탈로그 ── */

export interface DbInfo {
  id: string;
  label: string;
  description: string;
  schema: string;
}

export interface TableInfo {
  tableId: string;    // URL slug (snake_case)
  label: string;      // Display name (Pascal Case)
  datasetId?: string; // registry ID (hyphen-case) if mock data exists
}

export const DATABASES: DbInfo[] = [
  { id: "railway", label: "railway", description: "InsightBi 리스크 DB", schema: "public" },
  { id: "sample",  label: "Sample Database", description: "예제 데이터베이스", schema: "PUBLIC" },
];

export const DB_TABLES: Record<string, TableInfo[]> = {
  railway: [
    { tableId: "concentration",    label: "Concentration",    datasetId: "concentration" },
    { tableId: "credit_grades",    label: "Credit Grades",    datasetId: "credit-grades" },
    { tableId: "funding_structure",label: "Funding Structure",datasetId: "funding-structure" },
    { tableId: "lcr_gauge",        label: "Lcr Gauge",        datasetId: "lcr-gauge" },
    { tableId: "lcr_nsfr_trend",   label: "Lcr Nsfr Trend",   datasetId: "lcr-nsfr-trend" },
    { tableId: "liquidity_buffer", label: "Liquidity Buffer", datasetId: "liquidity-buffer" },
    { tableId: "maturity_gap",     label: "Maturity Gap",     datasetId: "maturity-gap" },
    { tableId: "ncr_summary",      label: "Ncr Summary",      datasetId: "ncr-summary" },
    { tableId: "ncr_trend",        label: "Ncr Trend",        datasetId: "ncr-trend" },
    { tableId: "npl_summary",      label: "Npl Summary",      datasetId: "npl-summary" },
    { tableId: "npl_trend",        label: "Npl Trend",        datasetId: "npl-trend" },
    { tableId: "pd_lgd_ead",       label: "Pd Lgd Ead",       datasetId: "pd-lgd-ead" },
    { tableId: "risk_composition", label: "Risk Composition", datasetId: "ncr-composition" },
    { tableId: "sector_exposure",  label: "Sector Exposure",  datasetId: "sector-exposure" },
    { tableId: "sensitivity",      label: "Sensitivity",      datasetId: "sensitivity" },
    { tableId: "stress_scenarios", label: "Stress Scenarios", datasetId: "stress-scenarios" },
    { tableId: "td_irncr",         label: "Td Irncr" },
    { tableId: "td_irpos",         label: "Td Irpos" },
    { tableId: "td_irriskcr",      label: "Td Irriskcr" },
    { tableId: "td_irriskmr",      label: "Td Irriskmr" },
    { tableId: "var_summary",      label: "Var Summary",      datasetId: "var-summary" },
    { tableId: "var_trend",        label: "Var Trend",        datasetId: "var-trend" },
  ].sort((a, b) => a.label.localeCompare(b.label)),

  sample: [
    { tableId: "accounts",       label: "Accounts" },
    { tableId: "analytic_events",label: "Analytic Events" },
    { tableId: "feedback",       label: "Feedback" },
    { tableId: "invoices",       label: "Invoices" },
    { tableId: "orders",         label: "Orders" },
    { tableId: "people",         label: "People" },
    { tableId: "products",       label: "Products" },
    { tableId: "reviews",        label: "Reviews" },
  ].sort((a, b) => a.label.localeCompare(b.label)),
};

/* ── TD 테이블 mock 데이터 ── */
function makeRow(stdDate: string, orgCode: number, conSepClcd: string, ncrStressNo: number, portNo: number, objDtlCd: number, itemLclasCd: number, itemMclasCd: number, itemSclasCd: number, itemDtlCd: number, itemLclasNm: string, itemMclasNm: string, itemSclasNm: string, itemDtlNm: string, amount: number) {
  return { std_date: stdDate, org_code: orgCode, con_sep_clcd: conSepClcd, ncr_stress_no: ncrStressNo, port_no: portNo, obj_dtl_cd: objDtlCd, item_lclas_cd: itemLclasCd, item_mclas_cd: itemMclasCd, item_sclas_cd: itemSclasCd, item_dtl_cd: itemDtlCd, item_lclas_nm: itemLclasNm, item_mclas_nm: itemMclasNm, item_sclas_nm: itemSclasNm, item_dtl_nm: itemDtlNm, amount };
}

export const TD_IRNCR_DATA: Record<string, unknown>[] = [
  makeRow("20231130",1,"S",0,10022,10022,20,10,20,20,"총위험액","시장위험액","금리위험액","일반위험액",1250000),
  makeRow("20231130",1,"S",0,10022,10022,20,10,20,30,"총위험액","시장위험액","금리위험액","금리옵션",85000),
  makeRow("20231130",1,"S",0,10022,10022,20,10,20,10,"총위험액","시장위험액","금리위험액","개별위험액",320000),
  makeRow("20231130",1,"S",0,20046,920,20,10,20,20,"총위험액","시장위험액","금리위험액","일반위험액",980000),
  makeRow("20231130",1,"S",0,20046,920,20,10,20,30,"총위험액","시장위험액","금리위험액","금리옵션",65000),
  makeRow("20231130",1,"S",0,20046,920,20,10,20,10,"총위험액","시장위험액","금리위험액","개별위험액",240000),
  makeRow("20231130",1,"S",0,20051,20051,20,10,20,20,"총위험액","시장위험액","금리위험액","일반위험액",1100000),
  makeRow("20231130",1,"S",0,20051,20051,20,10,20,30,"총위험액","시장위험액","금리위험액","금리옵션",72000),
  makeRow("20231130",1,"S",0,20051,20051,20,10,20,10,"총위험액","시장위험액","금리위험액","개별위험액",290000),
  makeRow("20231130",1,"S",0,20052,20052,20,10,20,20,"총위험액","시장위험액","금리위험액","일반위험액",870000),
  makeRow("20231130",1,"S",0,20052,20052,20,10,20,30,"총위험액","시장위험액","금리위험액","금리옵션",58000),
  makeRow("20231130",1,"S",0,20052,20052,20,10,20,10,"총위험액","시장위험액","금리위험액","개별위험액",210000),
  makeRow("20231130",1,"S",0,20053,20053,20,10,20,20,"총위험액","시장위험액","금리위험액","일반위험액",1340000),
  makeRow("20231130",1,"S",0,20053,20053,20,10,20,30,"총위험액","시장위험액","금리위험액","금리옵션",91000),
  makeRow("20231130",1,"S",0,20053,20053,20,10,20,10,"총위험액","시장위험액","금리위험액","개별위험액",360000),
  makeRow("20231130",1,"S",0,30001,30001,20,10,20,20,"총위험액","시장위험액","금리위험액","일반위험액",760000),
  makeRow("20231130",1,"S",0,30001,30001,20,10,20,30,"총위험액","시장위험액","금리위험액","금리옵션",49000),
  makeRow("20231130",1,"S",0,30001,30001,20,10,20,10,"총위험액","시장위험액","금리위험액","개별위험액",185000),
  makeRow("20231130",1,"S",0,30002,30002,30,20,30,30,"총위험액","시장위험액","주식위험액","일반위험액",520000),
  makeRow("20231130",1,"S",0,30002,30002,30,20,30,30,"총위험액","시장위험액","주식위험액","특정주식",134000),
];

export const TD_IRPOS_DATA: Record<string, unknown>[] = Array.from({ length: 20 }, (_, i) => ({
  std_date: "20231130",
  org_code: 1,
  port_no: 10022 + i * 100,
  pos_seq: i + 1,
  asset_cd: `BOND_${String(i + 1).padStart(3, "0")}`,
  isin_cd: `KR${String(720000000 + i * 1000)}`,
  face_value: (100 + i * 10) * 10000,
  book_value: (98 + i * 9.8) * 10000,
  market_value: (99 + i * 10.1) * 10000,
  duration: +(1.5 + i * 0.3).toFixed(2),
  currency: "KRW",
}));

export const TD_IRRISKCR_DATA: Record<string, unknown>[] = Array.from({ length: 20 }, (_, i) => ({
  std_date: "20231130",
  org_code: 1,
  port_no: 10022 + i * 100,
  risk_factor_cd: `RF_${String(i + 1).padStart(3, "0")}`,
  sensitivity_bpv: +(12.5 + i * 2.3).toFixed(2),
  risk_amount: Math.round((50000 + i * 8000) * (1 + Math.random() * 0.2)),
  confidence_level: 99,
  holding_period: 10,
}));

export const TD_IRRISKMR_DATA: Record<string, unknown>[] = Array.from({ length: 20 }, (_, i) => ({
  std_date: "20231130",
  org_code: 1,
  risk_category: ["금리", "주식", "외환", "상품"][i % 4],
  sub_category: ["일반", "특정", "옵션"][i % 3],
  position_amount: Math.round(500000 + i * 75000),
  var_99: Math.round(25000 + i * 3500),
  var_95: Math.round(18000 + i * 2500),
  stress_var: Math.round(45000 + i * 6000),
}));

export const SAMPLE_TABLE_DATA: Record<string, Record<string, unknown>[]> = {
  orders: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    user_id: Math.ceil((i + 1) / 3),
    product_id: (i % 5) + 1,
    quantity: Math.ceil(Math.random() * 5),
    total: +(Math.random() * 200 + 20).toFixed(2),
    status: ["pending","completed","cancelled","shipped"][i % 4],
    created_at: `2026-03-${String(i + 1).padStart(2, "0")}`,
  })),
  people: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    name: `사용자 ${i + 1}`,
    email: `user${i + 1}@example.com`,
    city: ["서울","부산","대구","인천","광주"][i % 5],
    source: ["organic","paid","referral"][i % 3],
    created_at: `2026-0${(i % 3) + 1}-${String(i + 1).padStart(2, "0")}`,
  })),
  products: Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: `상품 ${i + 1}`,
    category: ["전자","의류","식품","가구","스포츠"][i % 5],
    price: +(Math.random() * 500 + 10).toFixed(2),
    rating: +(Math.random() * 2 + 3).toFixed(1),
    vendor: `벤더 ${(i % 4) + 1}`,
  })),
};

export function getTableData(dbId: string, tableId: string): Record<string, unknown>[] {
  if (dbId === "railway") {
    if (tableId === "td_irncr") return TD_IRNCR_DATA;
    if (tableId === "td_irpos") return TD_IRPOS_DATA;
    if (tableId === "td_irriskcr") return TD_IRRISKCR_DATA;
    if (tableId === "td_irriskmr") return TD_IRRISKMR_DATA;
  }
  if (dbId === "sample") {
    return SAMPLE_TABLE_DATA[tableId] ?? [];
  }
  return [];
}

export function getTableInfo(dbId: string, tableId: string): TableInfo | undefined {
  return DB_TABLES[dbId]?.find((t) => t.tableId === tableId);
}

export function getDbInfo(dbId: string): DbInfo | undefined {
  return DATABASES.find((d) => d.id === dbId);
}
