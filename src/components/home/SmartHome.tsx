"use client";

import * as React from "react";
import { Bot, RotateCcw, Zap, Code, Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import { AiSearchBar } from "./AiSearchBar";
import { InsightBriefing } from "./InsightBriefing";
import { AiChartResult } from "@/components/ai/AiChartResult";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiChat } from "@/hooks/useAiChat";
import { cn } from "@/lib/utils";

export function SmartHome() {
  const { messages, ask, submitFeedback, clearHistory } = useAiChat();
  const [sqlOpen, setSqlOpen] = React.useState(false);
  const [feedbackGiven, setFeedbackGiven] = React.useState<"up" | "down" | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;

  // 가장 최근 user / assistant 메시지
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const isLoading = messages.some((m) => m.status === "loading");

  const handleSearch = (q: string) => {
    clearHistory();
    setSqlOpen(false);
    setFeedbackGiven(null);
    ask(q);
    // 결과 영역으로 부드럽게 스크롤
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleReset = () => {
    clearHistory();
    setSqlOpen(false);
    setFeedbackGiven(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-8">

      {/* ── Hero (검색 결과 없을 때만) ── */}
      {!hasMessages && (
        <div className="text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">안녕하세요, InsightBi AI입니다</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                금융 리스크 데이터에 대해 자연어로 질문하세요
              </p>
            </div>
          </div>
          <AiSearchBar onSearch={handleSearch} />
        </div>
      )}

      {/* ── 검색 후: compact 검색바 + 초기화 ── */}
      {hasMessages && (
        <div className="flex items-center gap-3" ref={resultRef}>
          <div className="flex-1">
            <AiSearchBar onSearch={handleSearch} compact disabled={isLoading} />
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </button>
        </div>
      )}

      {/* ── 인라인 결과 카드 ── */}
      {hasMessages && (
        <div className="space-y-3">
          {/* 질문 버블 */}
          {lastUser && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {lastUser.content}
              </div>
            </div>
          )}

          {/* 결과 카드 */}
          <div className={cn(
            "rounded-2xl border bg-card p-5 space-y-4 shadow-sm",
            lastAssistant?.status === "error" && "border-red-200 dark:border-red-800"
          )}>
            {/* 로딩 */}
            {isLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                  <span>SQL 생성 및 데이터 조회 중...</span>
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-40 w-full rounded-xl" />
              </div>
            )}

            {/* 에러 */}
            {!isLoading && lastAssistant?.status === "error" && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <Bot className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="whitespace-pre-wrap">{lastAssistant.content}</p>
              </div>
            )}

            {/* 성공 결과 */}
            {!isLoading && lastAssistant?.status === "success" && (
              <>
                {/* 헤더: AI 아이콘 + 캐시 뱃지 */}
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

                {/* 요약 텍스트 */}
                {lastAssistant.content && (
                  <p className="text-sm text-foreground leading-relaxed">{lastAssistant.content}</p>
                )}

                {/* 차트 + Smart Narrative */}
                {lastAssistant.data && lastAssistant.data.length > 0 && lastAssistant.chartType && (
                  <AiChartResult
                    data={lastAssistant.data}
                    chartType={lastAssistant.chartType}
                    question={lastAssistant.question}
                  />
                )}

                {/* SQL 토글 + 피드백 */}
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
                      title="도움이 됐어요"
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
                      title="개선이 필요해요"
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

          {/* 추가 질문 안내 */}
          {!isLoading && lastAssistant?.status === "success" && (
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              위 검색창에서 추가로 질문하거나, 초기화 후 새로운 질문을 입력하세요
            </p>
          )}
        </div>
      )}

      {/* ── 오늘의 주요 인사이트 (결과 없을 때만) ── */}
      {!hasMessages && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">오늘의 주요 인사이트</h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">기준일 2026-02-26</span>
          </div>
          <InsightBriefing onSearch={handleSearch} />
        </div>
      )}
    </div>
  );
}
