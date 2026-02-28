"use client";

import * as React from "react";
import { Code, ThumbsUp, ThumbsDown, Bot, Zap } from "lucide-react";
import { ChatMessage } from "@/types/ai";
import { AiChartResult } from "./AiChartResult";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AiChatMessageProps {
  message: ChatMessage;
  onFeedback: (id: string, rating: "up" | "down") => void;
}

export function AiChatMessage({ message, onFeedback }: AiChatMessageProps) {
  const [sqlOpen, setSqlOpen] = React.useState(false);
  const [feedbackGiven, setFeedbackGiven] = React.useState<"up" | "down" | null>(null);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    if (message.status !== "loading") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [message.status]);

  if (message.role === "user") {
    return (
      <div className="flex justify-end px-4 py-1">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.status === "loading") {
    return (
      <div className="flex items-start gap-2.5 px-4 py-1">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary animate-pulse" />
        </div>
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-5/6" />
          <p className="text-[10px] text-muted-foreground pt-0.5">
            SQL 생성 중...
            {elapsed > 0 && ` ${elapsed}초 경과`}
            {elapsed >= 10 && " (CPU 추론, 잠시 기다려 주세요)"}
          </p>
        </div>
      </div>
    );
  }

  // Assistant error
  if (message.status === "error") {
    return (
      <div className="flex items-start gap-2.5 px-4 py-1">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <Bot className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-2.5 text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant success
  return (
    <div className="flex items-start gap-2.5 px-4 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        {/* Summary text */}
        {message.content && (
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
            {message.content}
          </div>
        )}

        {/* Chart */}
        {message.data && message.data.length > 0 && message.chartType && (
          <div className="rounded-xl border bg-background p-3">
            <AiChartResult data={message.data} chartType={message.chartType} />
          </div>
        )}

        {/* Actions: SQL toggle + feedback */}
        <div className="flex items-center gap-2">
          {message.fromCache && (
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              <Zap className="h-2.5 w-2.5" /> 캐시
            </span>
          )}
          {message.sql && (
            <button
              onClick={() => setSqlOpen((o) => !o)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <Code className="h-3 w-3" />
              {sqlOpen ? "SQL 닫기" : "SQL 보기"}
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => {
                if (!feedbackGiven) {
                  setFeedbackGiven("up");
                  onFeedback(message.id, "up");
                }
              }}
              className={cn(
                "rounded-md p-1 transition-colors",
                feedbackGiven === "up"
                  ? "text-green-600 bg-green-50 dark:bg-green-950"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                if (!feedbackGiven) {
                  setFeedbackGiven("down");
                  onFeedback(message.id, "down");
                }
              }}
              className={cn(
                "rounded-md p-1 transition-colors",
                feedbackGiven === "down"
                  ? "text-red-600 bg-red-50 dark:bg-red-950"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* SQL block */}
        {sqlOpen && message.sql && (
          <pre className="overflow-x-auto rounded-lg bg-muted/80 p-3 text-[11px] leading-relaxed text-foreground border">
            {message.sql}
          </pre>
        )}
      </div>
    </div>
  );
}
