/**
 * 자동 대시보드 생성 유틸리티
 * 테이블 정보를 분석하여 위젯 구성을 자동 생성합니다.
 */

import { DB_TABLES } from "@/lib/db-catalog";
import { dataCatalog } from "@/lib/data-catalog";
import type { ChartType } from "@/types/builder";

export interface AutoWidget {
  id: string;
  title: string;
  datasetId: string;
  chartType: ChartType;
}

export interface AutoDashboardConfig {
  tableLabel: string;
  tableId: string;
  dbId: string;
  generatedAt: string;
  widgets: AutoWidget[];
}

const AUTO_DASHBOARD_KEY = "insightbi_auto_dashboard_v1";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

/** 카테고리별 KPI/요약 데이터셋 */
const CATEGORY_SUMMARY: Record<string, string> = {
  credit:    "npl-summary",
  market:    "var-summary",
  liquidity: "lcr-gauge",
  ncr:       "ncr-summary",
};

/** 카테고리 내 관련 데이터셋 (주 데이터셋 외 추가로 보여줄 것들) */
const CATEGORY_PEERS: Record<string, string[]> = {
  credit:    ["credit-grades", "sector-exposure", "npl-trend"],
  market:    ["var-trend", "stress-scenarios", "sensitivity"],
  liquidity: ["lcr-nsfr-trend", "maturity-gap", "liquidity-buffer"],
  ncr:       ["ncr-trend", "ncr-composition", "ncr-capital"],
};

/**
 * 테이블 → 자동 위젯 목록 생성
 */
export function buildAutoWidgets(
  dbId: string,
  tableId: string,
  tableLabel: string,
): AutoWidget[] {
  const tables = DB_TABLES[dbId] ?? [];
  const tableInfo = tables.find((t) => t.tableId === tableId);
  const datasetId = tableInfo?.datasetId;

  const widgets: AutoWidget[] = [];

  if (datasetId) {
    const ds = dataCatalog.find((d) => d.id === datasetId);
    if (ds) {
      // 1. 기본 차트 (defaultChart)
      widgets.push({
        id: uid(),
        title: `${ds.label}`,
        datasetId,
        chartType: ds.defaultChart as ChartType,
      });

      // 2. 두 번째 호환 차트 (다른 관점)
      const secondChart = ds.compatibleCharts.find((c) => c !== ds.defaultChart);
      if (secondChart && !["kpi", "gauge", "scatter"].includes(secondChart)) {
        widgets.push({
          id: uid(),
          title: `${ds.label} (${chartTypeKo(secondChart)})`,
          datasetId,
          chartType: secondChart as ChartType,
        });
      }

      // 3. 카테고리 요약 KPI
      const summaryId = CATEGORY_SUMMARY[ds.category];
      if (summaryId && summaryId !== datasetId) {
        const summaryDs = dataCatalog.find((d) => d.id === summaryId);
        if (summaryDs) {
          widgets.push({
            id: uid(),
            title: summaryDs.label,
            datasetId: summaryId,
            chartType: summaryDs.defaultChart as ChartType,
          });
        }
      }

      // 4. 카테고리 내 연관 데이터셋 1~2개
      const peers = (CATEGORY_PEERS[ds.category] ?? []).filter((id) => id !== datasetId);
      for (const peerId of peers.slice(0, 2)) {
        const peerDs = dataCatalog.find((d) => d.id === peerId);
        if (peerDs) {
          widgets.push({
            id: uid(),
            title: peerDs.label,
            datasetId: peerId,
            chartType: peerDs.defaultChart as ChartType,
          });
        }
      }
    }
  } else {
    // datasetId 매핑 없음 → 테이블명에서 카테고리 추론
    const category = inferCategory(tableId, tableLabel);
    const categoryDatasets = dataCatalog.filter((d) => d.category === category);
    const fallback = categoryDatasets.length > 0 ? categoryDatasets : dataCatalog.slice(0, 4);

    for (const ds of fallback.slice(0, 4)) {
      widgets.push({
        id: uid(),
        title: ds.label,
        datasetId: ds.id,
        chartType: ds.defaultChart as ChartType,
      });
    }
  }

  return widgets;
}

function inferCategory(tableId: string, tableLabel: string): string {
  const combined = `${tableId} ${tableLabel}`.toLowerCase();
  if (/credit|npl|pd|lgd|ead|irncr|등급|신용/.test(combined)) return "credit";
  if (/var|market|stress|sensitivity|시장|irriskmr/.test(combined)) return "market";
  if (/lcr|nsfr|liquidity|maturity|buffer|유동/.test(combined)) return "liquidity";
  if (/ncr|capital|composition|irpos|irriskcr|순자본/.test(combined)) return "ncr";
  return "credit"; // default fallback
}

function chartTypeKo(ct: string): string {
  const map: Record<string, string> = {
    line: "선", area: "영역", bar: "막대", pie: "파이",
    scatter: "산포도", radar: "레이더", kpi: "KPI", table: "테이블",
  };
  return map[ct] ?? ct;
}

/** localStorage에 자동 대시보드 설정 저장 */
export function saveAutoDashboard(config: AutoDashboardConfig) {
  try {
    localStorage.setItem(AUTO_DASHBOARD_KEY, JSON.stringify(config));
  } catch {}
}

/** localStorage에서 자동 대시보드 설정 읽기 (1회 사용 후 삭제) */
export function consumeAutoDashboard(): AutoDashboardConfig | null {
  try {
    const raw = localStorage.getItem(AUTO_DASHBOARD_KEY);
    if (!raw) return null;
    localStorage.removeItem(AUTO_DASHBOARD_KEY);
    return JSON.parse(raw) as AutoDashboardConfig;
  } catch {
    return null;
  }
}
