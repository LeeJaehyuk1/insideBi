"use client";

import * as React from "react";
import { BarChart2, MessageSquare, ThumbsUp, ThumbsDown, Zap, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MonitoringData {
  feedback: { total: number; up: number; down: number; satisfaction_rate: number };
  chat: { total_queries: number; success: number; error: number; success_rate: number };
  top_feedback_questions: { question: string; count: number }[];
  top_chat_questions: { question: string; count: number }[];
  cache_size: number;
}

interface Props {
  password: string;
}

export function MonitoringTab({ password }: Props) {
  const [data, setData] = React.useState<MonitoringData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetch("/api/admin/monitoring", {
      headers: { "x-admin-password": password },
    })
      .then((r) => r.ok ? r.json() : r.json().then((e) => Promise.reject(e.detail ?? "오류")))
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [password]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive py-8 justify-center">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      title: "총 AI 쿼리",
      value: data.chat.total_queries,
      sub: `성공 ${data.chat.success} / 오류 ${data.chat.error}`,
      badge: `성공률 ${data.chat.success_rate}%`,
      badgeColor: data.chat.success_rate >= 80 ? "text-green-600" : "text-orange-600",
      icon: MessageSquare,
    },
    {
      title: "총 피드백",
      value: data.feedback.total,
      sub: `👍 ${data.feedback.up}  /  👎 ${data.feedback.down}`,
      badge: `만족도 ${data.feedback.satisfaction_rate}%`,
      badgeColor: data.feedback.satisfaction_rate >= 70 ? "text-green-600" : "text-red-600",
      icon: ThumbsUp,
    },
    {
      title: "SQL 캐시",
      value: data.cache_size,
      sub: "메모리 캐시 항목 수",
      badge: "Golden SQL 포함",
      badgeColor: "text-blue-600",
      icon: Zap,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((c) => (
          <Card key={c.title}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{c.title}</p>
                <p className="text-2xl font-bold tabular-nums">{c.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
                <p className={`text-xs font-medium mt-1 ${c.badgeColor}`}>{c.badge}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 인기 질문 (피드백 기반) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-primary" />
              인기 질문 (피드백)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.top_feedback_questions.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">피드백 데이터 없음</p>
            ) : (
              <div className="divide-y">
                {data.top_feedback_questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <p className="flex-1 text-xs truncate">{q.question}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{q.count}회</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" />
              인기 질문 (채팅 히스토리)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.top_chat_questions.length === 0 ? (
              <p className="px-4 py-6 text-xs text-muted-foreground text-center">채팅 히스토리 없음</p>
            ) : (
              <div className="divide-y">
                {data.top_chat_questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <p className="flex-1 text-xs truncate">{q.question}</p>
                    <span className="text-xs text-muted-foreground shrink-0">{q.count}회</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
