export const BIS_THRESHOLDS = {
  npl: { caution: 1.5, warning: 2.0, danger: 3.0 },
  bis: { danger: 8.0, warning: 10.5, caution: 13.0 },
  lcr: { danger: 100, warning: 110, caution: 120 },
  nsfr: { danger: 100, warning: 110, caution: 115 },
  var_limit: 1500,
  leverage: { danger: 3.0, warning: 3.5, caution: 4.0 },
} as const;

export const SEVERITY_COLORS = {
  normal: {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-300 dark:border-green-700",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    hex: "#22c55e",
    chart: "#16a34a",
  },
  caution: {
    bg: "bg-yellow-100 dark:bg-yellow-950",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-300 dark:border-yellow-700",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    hex: "#eab308",
    chart: "#ca8a04",
  },
  warning: {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-300 dark:border-orange-700",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    hex: "#f97316",
    chart: "#ea580c",
  },
  danger: {
    bg: "bg-red-100 dark:bg-red-950",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-700",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    hex: "#ef4444",
    chart: "#dc2626",
  },
} as const;

export const NAV_ITEMS = [
  {
    title: "종합 리스크 현황",
    href: "/",
    icon: "LayoutDashboard",
    description: "KRI 종합 현황판",
  },
  {
    title: "신용리스크",
    href: "/credit-risk",
    icon: "CreditCard",
    description: "NPL / PD / LGD / EAD",
  },
  {
    title: "시장리스크",
    href: "/market-risk",
    icon: "TrendingUp",
    description: "VaR / 스트레스 테스트",
  },
  {
    title: "유동성리스크",
    href: "/liquidity-risk",
    icon: "Droplets",
    description: "LCR / NSFR / 만기갭",
  },
  {
    title: "NCR리스크",
    href: "/ncr-risk",
    icon: "Target",
    description: "순자본비율 및 기타 지표",
  },
  {
    title: "보고서",
    href: "/reports",
    icon: "FileText",
    description: "경영진 보고서",
  },
  {
    title: "대시보드 빌더",
    href: "/builder",
    icon: "LayoutTemplate",
    description: "커스텀 대시보드 구성",
  },
] as const;

export const CHART_COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  tertiary: "#06b6d4",
  quaternary: "#10b981",
  quinary: "#f59e0b",
  danger: "#ef4444",
  grid: "#e2e8f0",
  gridDark: "#334155",
};

export const SECTOR_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#6366f1",
];
