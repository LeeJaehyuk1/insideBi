export interface ReportMeta {
  id: string;
  title: string;
  type: "monthly" | "quarterly" | "annual" | "stress" | "regulatory";
  period: string;
  createdAt: string;
  author: string;
  status: "draft" | "review" | "approved" | "published";
  pages: number;
  summary: string;
}

export const reports: ReportMeta[] = [
  {
    id: "RPT-2026-02",
    title: "2026년 2월 종합 리스크 관리 보고서",
    type: "monthly",
    period: "2026년 2월",
    createdAt: "2026-02-26",
    author: "리스크관리부",
    status: "published",
    pages: 28,
    summary: "2026년 2월 신용·시장·유동성 리스크 종합 현황 및 주요 이슈 보고",
  },
  {
    id: "RPT-2026-Q1",
    title: "2026년 1분기 리스크 현황 보고서",
    type: "quarterly",
    period: "2026년 1분기",
    createdAt: "2026-02-15",
    author: "리스크관리부",
    status: "draft",
    pages: 52,
    summary: "1분기 리스크 지표 분석 및 경영진 보고용 요약 자료",
  },
  {
    id: "RPT-2026-01",
    title: "2026년 1월 종합 리스크 관리 보고서",
    type: "monthly",
    period: "2026년 1월",
    createdAt: "2026-01-31",
    author: "리스크관리부",
    status: "published",
    pages: 26,
    summary: "2026년 1월 리스크 지표 현황 및 규제비율 점검",
  },
  {
    id: "RPT-2025-STRESS",
    title: "2025년 하반기 스트레스 테스트 결과 보고서",
    type: "stress",
    period: "2025년 하반기",
    createdAt: "2026-01-15",
    author: "리스크관리부",
    status: "approved",
    pages: 45,
    summary: "6개 위기 시나리오에 대한 스트레스 테스트 결과 및 자본 충분성 분석",
  },
  {
    id: "RPT-2025-ANNUAL",
    title: "2025년 연간 리스크 관리 보고서",
    type: "annual",
    period: "2025년",
    createdAt: "2026-01-10",
    author: "리스크관리부",
    status: "published",
    pages: 124,
    summary: "2025년 리스크 관리 체계 운영 성과 및 2026년 리스크 관리 계획",
  },
  {
    id: "RPT-2025-REG",
    title: "2025년 4분기 감독당국 제출 보고서",
    type: "regulatory",
    period: "2025년 4분기",
    createdAt: "2026-01-20",
    author: "준법감시부",
    status: "published",
    pages: 38,
    summary: "금융감독원 제출용 리스크 지표 및 자본비율 보고",
  },
];

export const getReportById = (id: string) => reports.find((r) => r.id === id);
