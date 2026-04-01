import { RiskHeatmapCell } from "@/types/risk";

export const heatmapRisks: RiskHeatmapCell[] = [
  { row: 5, col: 2, label: "신용집중\n리스크", likelihood: 2, impact: 5, severity: "warning" },
  { row: 5, col: 3, label: "대출\n부실화", likelihood: 3, impact: 5, severity: "danger" },
  { row: 4, col: 1, label: "금리\n급등", likelihood: 1, impact: 4, severity: "caution" },
  { row: 4, col: 3, label: "유동성\n위기", likelihood: 3, impact: 4, severity: "danger" },
  { row: 4, col: 4, label: "환율\n급변", likelihood: 4, impact: 4, severity: "danger" },
  { row: 3, col: 2, label: "운영\n리스크", likelihood: 2, impact: 3, severity: "caution" },
  { row: 3, col: 3, label: "VaR\n한도초과", likelihood: 3, impact: 3, severity: "warning" },
  { row: 3, col: 5, label: "규제\n변화", likelihood: 5, impact: 3, severity: "warning" },
  { row: 2, col: 2, label: "IT\n장애", likelihood: 2, impact: 2, severity: "caution" },
  { row: 2, col: 4, label: "평판\n리스크", likelihood: 4, impact: 2, severity: "caution" },
  { row: 1, col: 3, label: "자연재해", likelihood: 3, impact: 1, severity: "normal" },
  { row: 1, col: 5, label: "경기\n침체", likelihood: 5, impact: 1, severity: "caution" },
];

export const heatmapAxisLabels = {
  x: ["매우낮음", "낮음", "보통", "높음", "매우높음"],
  y: ["매우낮음", "낮음", "보통", "높음", "매우높음"],
};
