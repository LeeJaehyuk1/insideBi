
import * as React from "react";
import {
  LayoutDashboard, Table2, User2, Clock, Activity,
  TrendingUp, Download, Eye, Search, ChevronUp, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── 타입 ── */
type Period = "today" | "7d" | "30d" | "90d";

interface ContentItem {
  id: string;
  name: string;
  type: "dashboard" | "question";
  views: number;
  uniqueUsers: number;
  lastViewed: string;
  trend: number; // %
}

interface UserActivity {
  id: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  queries: number;
  views: number;
  lastActive: string;
}

interface ActivityLog {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "view" | "create" | "edit" | "delete" | "login" | "query";
}

/* ── Mock 데이터 ── */
const CONTENT_DATA: Record<Period, ContentItem[]> = {
  today: [
    { id: "1", name: "리스크 종합 현황", type: "dashboard", views: 34, uniqueUsers: 12, lastViewed: "14:31", trend: 18 },
    { id: "2", name: "NPL 비율 추이",    type: "question",  views: 21, uniqueUsers: 8,  lastViewed: "14:15", trend: 5  },
    { id: "3", name: "신용리스크 대시보드", type: "dashboard", views: 18, uniqueUsers: 7, lastViewed: "13:55", trend: -3 },
    { id: "4", name: "업종별 익스포저",   type: "question",  views: 15, uniqueUsers: 6,  lastViewed: "13:40", trend: 12 },
    { id: "5", name: "시장리스크 현황",   type: "dashboard", views: 11, uniqueUsers: 4,  lastViewed: "12:30", trend: 0  },
  ],
  "7d": [
    { id: "1", name: "리스크 종합 현황", type: "dashboard", views: 210, uniqueUsers: 18, lastViewed: "오늘", trend: 22 },
    { id: "2", name: "신용리스크 대시보드", type: "dashboard", views: 178, uniqueUsers: 15, lastViewed: "오늘", trend: 8 },
    { id: "3", name: "NPL 비율 추이",    type: "question",  views: 134, uniqueUsers: 12, lastViewed: "오늘", trend: -5 },
    { id: "4", name: "업종별 익스포저",   type: "question",  views: 98,  uniqueUsers: 9,  lastViewed: "어제", trend: 14 },
    { id: "5", name: "유동성 현황",       type: "dashboard", views: 76,  uniqueUsers: 7,  lastViewed: "어제", trend: 3  },
  ],
  "30d": [
    { id: "1", name: "리스크 종합 현황", type: "dashboard", views: 890, uniqueUsers: 20, lastViewed: "오늘", trend: 31 },
    { id: "2", name: "신용리스크 대시보드", type: "dashboard", views: 720, uniqueUsers: 18, lastViewed: "오늘", trend: 15 },
    { id: "3", name: "NPL 비율 추이",    type: "question",  views: 560, uniqueUsers: 14, lastViewed: "오늘", trend: -8 },
    { id: "4", name: "업종별 익스포저",   type: "question",  views: 430, uniqueUsers: 11, lastViewed: "어제", trend: 20 },
    { id: "5", name: "유동성 현황",       type: "dashboard", views: 310, uniqueUsers: 9,  lastViewed: "어제", trend: 7  },
  ],
  "90d": [
    { id: "1", name: "리스크 종합 현황", type: "dashboard", views: 2400, uniqueUsers: 20, lastViewed: "오늘", trend: 45 },
    { id: "2", name: "신용리스크 대시보드", type: "dashboard", views: 2100, uniqueUsers: 19, lastViewed: "오늘", trend: 28 },
    { id: "3", name: "NPL 비율 추이",    type: "question",  views: 1560, uniqueUsers: 15, lastViewed: "오늘", trend: -4 },
    { id: "4", name: "업종별 익스포저",   type: "question",  views: 1230, uniqueUsers: 13, lastViewed: "어제", trend: 37 },
    { id: "5", name: "유동성 현황",       type: "dashboard", views: 980,  uniqueUsers: 10, lastViewed: "어제", trend: 12 },
  ],
};

const USER_DATA: Record<Period, UserActivity[]> = {
  today: [
    { id: "1", name: "재혁 이",    role: "admin",  queries: 24, views: 41, lastActive: "방금 전" },
    { id: "2", name: "편집자",      role: "editor", queries: 12, views: 28, lastActive: "5분 전"  },
    { id: "3", name: "리스크 관리자", role: "viewer", queries: 3,  views: 19, lastActive: "30분 전" },
    { id: "4", name: "뷰어",        role: "viewer", queries: 0,  views: 8,  lastActive: "1시간 전" },
  ],
  "7d": [
    { id: "1", name: "재혁 이",    role: "admin",  queries: 148, views: 230, lastActive: "오늘" },
    { id: "2", name: "편집자",      role: "editor", queries: 87,  views: 165, lastActive: "오늘" },
    { id: "3", name: "리스크 관리자", role: "viewer", queries: 21, views: 112, lastActive: "오늘" },
    { id: "4", name: "뷰어",        role: "viewer", queries: 3,  views: 45,  lastActive: "어제" },
  ],
  "30d": [
    { id: "1", name: "재혁 이",    role: "admin",  queries: 520, views: 890, lastActive: "오늘" },
    { id: "2", name: "편집자",      role: "editor", queries: 310, views: 620, lastActive: "오늘" },
    { id: "3", name: "리스크 관리자", role: "viewer", queries: 78, views: 450, lastActive: "오늘" },
    { id: "4", name: "뷰어",        role: "viewer", queries: 12, views: 190, lastActive: "어제" },
  ],
  "90d": [
    { id: "1", name: "재혁 이",    role: "admin",  queries: 1560, views: 2400, lastActive: "오늘" },
    { id: "2", name: "편집자",      role: "editor", queries: 980,  views: 1780, lastActive: "오늘" },
    { id: "3", name: "리스크 관리자", role: "viewer", queries: 230, views: 1200, lastActive: "오늘" },
    { id: "4", name: "뷰어",        role: "viewer", queries: 45,  views: 560,  lastActive: "어제" },
  ],
};

const ACTIVITY_LOGS: ActivityLog[] = [
  { id: "1",  user: "재혁 이",    action: "대시보드 조회",       target: "리스크 종합 현황",    time: "방금 전",  type: "view"   },
  { id: "2",  user: "편집자",      action: "질문 생성",          target: "NPL 비율 분석 v2",    time: "3분 전",   type: "create" },
  { id: "3",  user: "재혁 이",    action: "SQL 쿼리 실행",       target: "td_irncr",           time: "7분 전",   type: "query"  },
  { id: "4",  user: "리스크 관리자", action: "대시보드 조회",     target: "신용리스크 대시보드",  time: "15분 전",  type: "view"   },
  { id: "5",  user: "편집자",      action: "질문 수정",          target: "업종별 익스포저",      time: "28분 전",  type: "edit"   },
  { id: "6",  user: "뷰어",        action: "로그인",             target: "시스템",              time: "1시간 전", type: "login"  },
  { id: "7",  user: "재혁 이",    action: "컬렉션 생성",         target: "2026 Q1 분석",        time: "2시간 전", type: "create" },
  { id: "8",  user: "편집자",      action: "대시보드 수정",      target: "시장리스크 현황",      time: "3시간 전", type: "edit"   },
  { id: "9",  user: "리스크 관리자", action: "질문 조회",         target: "유동성 비율 추이",     time: "4시간 전", type: "view"   },
  { id: "10", user: "재혁 이",    action: "사용자 권한 변경",    target: "뷰어 → 편집자",        time: "5시간 전", type: "edit"   },
];

const ACTION_COLORS: Record<ActivityLog["type"], string> = {
  view:   "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  create: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  edit:   "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  delete: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  login:  "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  query:  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const ROLE_COLORS: Record<UserActivity["role"], string> = {
  admin:  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  editor: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  viewer: "bg-muted text-muted-foreground",
};

const PERIOD_LABELS: Record<Period, string> = { today: "오늘", "7d": "7일", "30d": "30일", "90d": "90일" };

function Card({ icon: Icon, title, description, children, action }: {
  icon: React.ElementType; title: string; description?: string;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── 요약 통계 카드 ── */
function SummaryStats({ period }: { period: Period }) {
  const content = CONTENT_DATA[period];
  const users = USER_DATA[period];
  const totalViews = content.reduce((s, c) => s + c.views, 0);
  const totalQueries = users.reduce((s, u) => s + u.queries, 0);
  const activeUsers = users.filter((u) => u.views > 0).length;

  const stats = [
    { label: "총 조회수", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-500" },
    { label: "쿼리 실행", value: totalQueries.toLocaleString(), icon: Search, color: "text-orange-500" },
    { label: "활성 사용자", value: `${activeUsers}명`, icon: User2, color: "text-emerald-500" },
    { label: "인기 콘텐츠", value: content[0]?.name ?? "-", icon: TrendingUp, color: "text-primary", small: true },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("h-4 w-4 shrink-0", s.color)} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className={cn("font-bold text-foreground", s.small ? "text-sm truncate" : "text-xl")}>{s.value}</p>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */
export function AuditSection() {
  const [period, setPeriod] = React.useState<Period>("7d");
  const [logSearch, setLogSearch] = React.useState("");

  const content = CONTENT_DATA[period];
  const users = USER_DATA[period];
  const logs = ACTIVITY_LOGS.filter((l) => {
    if (!logSearch) return true;
    return l.user.includes(logSearch) || l.action.includes(logSearch) || l.target.includes(logSearch);
  });

  const handleExport = () => {
    const csv = [
      "사용자,액션,대상,시간",
      ...ACTIVITY_LOGS.map((l) => `${l.user},${l.action},${l.target},${l.time}`),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `insightbi-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">감사 로그 & 사용 통계</h2>
          <p className="text-xs text-muted-foreground mt-0.5">사용자 활동과 콘텐츠 사용 현황을 모니터링합니다</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 기간 필터 */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                  period === p
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
          >
            <Download className="h-3.5 w-3.5" />CSV 내보내기
          </button>
        </div>
      </div>

      {/* ── 요약 통계 ── */}
      <SummaryStats period={period} />

      {/* ── 인기 콘텐츠 ── */}
      <Card icon={TrendingUp} title="인기 콘텐츠 Top 5" description={`${PERIOD_LABELS[period]} 기준 조회수`}>
        <div className="space-y-1">
          {content.map((item, i) => {
            const TypeIcon = item.type === "dashboard" ? LayoutDashboard : Table2;
            const maxViews = content[0]?.views ?? 1;
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors group">
                <span className="text-sm font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                <TypeIcon className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
                    <div className="flex items-center gap-3 ml-2 shrink-0 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />{item.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User2 className="h-3 w-3" />{item.uniqueUsers}명
                      </span>
                      <span className={cn(
                        "flex items-center gap-0.5 font-medium",
                        item.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : item.trend < 0 ? "text-red-500" : "text-muted-foreground"
                      )}>
                        {item.trend > 0 ? <ChevronUp className="h-3 w-3" /> : item.trend < 0 ? <ChevronDown className="h-3 w-3" /> : null}
                        {Math.abs(item.trend)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-500"
                      style={{ width: `${(item.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── 활성 사용자 ── */}
      <Card icon={User2} title="활성 사용자" description={`${PERIOD_LABELS[period]} 기준`}>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <span className="text-xs font-bold text-primary">{u.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{u.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_COLORS[u.role])}>
                    {u.role === "admin" ? "관리자" : u.role === "editor" ? "편집자" : "뷰어"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>쿼리 {u.queries}회</span>
                  <span>·</span>
                  <span>조회 {u.views}회</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{u.lastActive}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">활동 지수</div>
                <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (u.queries + u.views) / 3)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 활동 로그 ── */}
      <Card
        icon={Activity}
        title="활동 로그"
        description={`최근 ${ACTIVITY_LOGS.length}개 이벤트`}
        action={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={logSearch} onChange={(e) => setLogSearch(e.target.value)}
              placeholder="검색..."
              className="w-36 rounded-lg border border-input bg-background pl-7 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        }
      >
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/30 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted shrink-0">
                <span className="text-xs font-bold text-foreground">{log.user[0]}</span>
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{log.user}</span>
                <span className={cn("rounded-md px-2 py-0.5 text-[10px] font-semibold shrink-0", ACTION_COLORS[log.type])}>
                  {log.action}
                </span>
                <span className="text-sm text-muted-foreground truncate">{log.target}</span>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                <Clock className="h-3 w-3" />{log.time}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
