"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bot,
  RotateCcw,
  Code,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Zap,
  CreditCard,
  TrendingUp,
  Droplets,
  Target,
  LayoutTemplate,
  FileText,
  ChevronRight,
  Clock,
  BookOpen,
  BarChart3,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { AiSearchBar } from "./AiSearchBar";
import { InsightBriefing } from "./InsightBriefing";
import { AiChartResult } from "@/components/ai/AiChartResult";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiChat } from "@/hooks/useAiChat";
import { reports } from "@/lib/mock-data/reports";
import { QuickActionBar } from "./QuickActionBar";
import { RecentlyViewedSection } from "./RecentlyViewedSection";
import { PinnedSection } from "./PinnedSection";

/* ── 리스크 관리 네비게이션 카드 데이터 ── */
const RISK_PAGES = [
  {
    href: "/credit-risk",
    title: "신용리스크",
    description: "NPL / PD / LGD / EAD",
    icon: CreditCard,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgLight: "bg-blue-50 dark:bg-blue-950",
    stat: "NPL 1.8%",
    statStatus: "caution" as const,
  },
  {
    href: "/market-risk",
    title: "시장리스크",
    description: "VaR / 스트레스 테스트",
    icon: TrendingUp,
    color: "bg-violet-500",
    textColor: "text-violet-600",
    bgLight: "bg-violet-50 dark:bg-violet-950",
    stat: "VaR ₩1,234억",
    statStatus: "normal" as const,
  },
  {
    href: "/liquidity-risk",
    title: "유동성리스크",
    description: "LCR / NSFR / 만기갭",
    icon: Droplets,
    color: "bg-cyan-500",
    textColor: "text-cyan-600",
    bgLight: "bg-cyan-50 dark:bg-cyan-950",
    stat: "LCR 142.3%",
    statStatus: "normal" as const,
  },
  {
    href: "/ncr-risk",
    title: "NCR리스크",
    description: "순자본비율 지표",
    icon: Target,
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    bgLight: "bg-emerald-50 dark:bg-emerald-950",
    stat: "NCR 218.4%",
    statStatus: "normal" as const,
  },
];

const TOOL_PAGES = [
  {
    href: "/questions/new",
    title: "질문",
    description: "데이터셋 선택 → 필터 → 시각화",
    icon: BarChart3,
    color: "bg-violet-500",
    bgLight: "bg-violet-50 dark:bg-violet-950",
  },
  {
    href: "/builder",
    title: "워크스페이스",
    description: "커스텀 대시보드 구성 및 위젯 배치",
    icon: LayoutTemplate,
    color: "bg-orange-500",
    bgLight: "bg-orange-50 dark:bg-orange-950",
  },
  {
    href: "/reports",
    title: "보고서",
    description: "경영진 보고서 조회 및 출력",
    icon: FileText,
    color: "bg-rose-500",
    bgLight: "bg-rose-50 dark:bg-rose-950",
  },
  {
    href: "/browse",
    title: "데이터 탐색",
    description: "스키마 확인 및 데이터 미리보기",
    icon: Database,
    color: "bg-slate-500",
    bgLight: "bg-slate-50 dark:bg-slate-950",
  },
];

const STATUS_BADGE: Record<string, string> = {
  normal:  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  caution: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  warning: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  danger:  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const REPORT_STATUS: Record<string, string> = {
  published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  draft:     "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  review:    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  approved:  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

const REPORT_STATUS_LABEL: Record<string, string> = {
  published: "게시됨", draft: "초안", review: "검토중", approved: "승인됨",
};

/* ── 섹션 헤더 ── */
function SectionHeader({
  title,
  href,
  linkText = "전체 보기",
}: {
  title: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {linkText}
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export function MetaHome() {
  const { messages, ask, submitFeedback, clearHistory } = useAiChat();
  const [sqlOpen, setSqlOpen] = React.useState(false);
  const [feedbackGiven, setFeedbackGiven] = React.useState<"up" | "down" | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const isLoading = messages.some((m) => m.status === "loading");

  const handleSearch = (q: string) => {
    clearHistory();
    setSqlOpen(false);
    setFeedbackGiven(null);
    ask(q);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleReset = () => {
    clearHistory();
    setSqlOpen(false);
    setFeedbackGiven(null);
  };

  const recentReports = reports.slice(0, 4);

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">

      {/* ── Hero ── */}
      <section className="pt-4 pb-2 text-center space-y-5">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">
            안녕하세요,{" "}
            <span className="text-primary">Risk BI</span>입니다
          </h1>
          <p className="text-sm text-muted-foreground">
            금융 리스크 데이터에 대해 무엇이든 물어보세요
          </p>
        </div>
        <AiSearchBar onSearch={handleSearch} />
      </section>

      {/* ── AI 검색 결과 (검색 후 표시) ── */}
      {hasMessages && (
        <section ref={resultRef} className="space-y-4">
          {/* compact 검색바 + 초기화 */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <AiSearchBar onSearch={handleSearch} compact disabled={isLoading} />
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              초기화
            </button>
          </div>

          {/* 질문 버블 */}
          {lastUser && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {lastUser.content}
              </div>
            </div>
          )}

          {/* 결과 카드 */}
          <div
            className={cn(
              "mb-card p-5 space-y-4",
              lastAssistant?.status === "error" && "border-red-200 dark:border-red-800"
            )}
          >
            {isLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                  <span>SQL 생성 및 데이터 조회 중...</span>
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-44 w-full rounded-xl" />
              </div>
            )}

            {!isLoading && lastAssistant?.status === "error" && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <Bot className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap">{lastAssistant.content}</p>
              </div>
            )}

            {!isLoading && lastAssistant?.status === "success" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">AI 분석 결과</span>
                  {lastAssistant.fromCache && (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Zap className="h-2.5 w-2.5" /> 캐시
                    </span>
                  )}
                </div>

                {lastAssistant.content && (
                  <p className="text-sm text-foreground leading-relaxed">{lastAssistant.content}</p>
                )}

                {lastAssistant.data && lastAssistant.data.length > 0 && lastAssistant.chartType && (
                  <AiChartResult
                    data={lastAssistant.data}
                    chartType={lastAssistant.chartType}
                    question={lastAssistant.question}
                  />
                )}

                <div className="flex items-center gap-2">
                  {lastAssistant.sql && (
                    <button
                      onClick={() => setSqlOpen((o) => !o)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Code className="h-3 w-3" />
                      {sqlOpen ? "SQL 닫기" : "SQL 보기"}
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-muted-foreground mr-1">결과가 유용했나요?</span>
                    <button
                      onClick={() => {
                        if (!feedbackGiven) {
                          setFeedbackGiven("up");
                          submitFeedback(lastAssistant.id, "up", lastAssistant.question, lastAssistant.sql);
                        }
                      }}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        feedbackGiven === "up"
                          ? "text-green-600 bg-green-50 dark:bg-green-950"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (!feedbackGiven) {
                          setFeedbackGiven("down");
                          submitFeedback(lastAssistant.id, "down", lastAssistant.question, lastAssistant.sql);
                        }
                      }}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        feedbackGiven === "down"
                          ? "text-red-600 bg-red-50 dark:bg-red-950"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    {feedbackGiven && (
                      <span className="text-xs text-muted-foreground ml-1">
                        {feedbackGiven === "up" ? "감사합니다!" : "피드백 감사합니다."}
                      </span>
                    )}
                  </div>
                </div>

                {sqlOpen && lastAssistant.sql && (
                  <pre className="overflow-x-auto rounded-lg bg-muted/80 p-3 text-[11px] leading-relaxed text-foreground border">
                    {lastAssistant.sql}
                  </pre>
                )}
              </>
            )}
          </div>

          {!isLoading && lastAssistant?.status === "success" && (
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              위 검색창에서 추가로 질문하거나, 초기화 후 새로운 질문을 입력하세요
            </p>
          )}
        </section>
      )}

      {/* ── 주요 지표 (검색 결과 없을 때만) ── */}
      {!hasMessages && (
        <>
          {/* ── 빠른 액션 ── */}
          <section>
            <SectionHeader title="빠른 시작" />
            <QuickActionBar />
          </section>

          {/* ── 즐겨찾기 ── */}
          <PinnedSection />

          {/* ── 최근 방문 ── */}
          <RecentlyViewedSection />

        </>
      )}
    </div>
  );
}
