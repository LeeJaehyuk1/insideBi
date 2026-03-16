"use client";

import * as React from "react";
import Link from "next/link";
import { MessageSquare, Plus, Clock, Trash2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { chartTypeLabels } from "@/lib/data-catalog";
import { dataCatalog } from "@/lib/data-catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

export default function QuestionsPage() {
  const { questions, hydrated, deleteQuestion } = useSavedQuestions();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
            <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">질문</h1>
            <p className="text-sm text-muted-foreground">저장된 데이터 질문 목록</p>
          </div>
        </div>
        <Link
          href="/questions/new"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          새 질문
        </Link>
      </div>

      {/* 목록 */}
      {!hydrated ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : questions.length === 0 ? (
        <div className="mb-card p-12 text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <MessageSquare className="h-7 w-7 text-muted-foreground opacity-50" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">저장된 질문이 없습니다</p>
          <p className="text-xs text-muted-foreground">새 질문을 만들어 데이터를 분석해 보세요</p>
          <Link
            href="/questions/new"
            className="inline-flex items-center gap-1.5 mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            새 질문 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => {
            const dataset = dataCatalog.find((d) => d.id === q.datasetId);
            return (
              <Link
                key={q.id}
                href={`/questions/${q.id}`}
                className="mb-card flex items-center gap-4 p-4 hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950 shrink-0">
                  <MessageSquare className="h-4.5 w-4.5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {q.title}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    {dataset && (
                      <span className="text-xs text-muted-foreground">{dataset.categoryLabel} › {dataset.label}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {chartTypeLabels[q.chartType] ?? q.chartType}
                    </span>
                    {q.filters.length > 0 && (
                      <span className="text-xs text-muted-foreground">필터 {q.filters.length}개</span>
                    )}
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(q.savedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <BookmarkButton
                    item={{ id: q.id, type: "question", name: q.title, href: `/questions/${q.id}` }}
                    className="opacity-0 group-hover:opacity-100"
                  />
                  <button
                    onClick={(e) => { e.preventDefault(); deleteQuestion(q.id); }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="삭제"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
