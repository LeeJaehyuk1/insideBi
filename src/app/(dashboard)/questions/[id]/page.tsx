"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { NotebookEditor } from "@/components/questions/NotebookEditor";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  const { getQuestion, hydrated } = useSavedQuestions();

  if (!hydrated) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const question = getQuestion(params.id);
  if (!question) notFound();

  return (
    <div className="space-y-4">
      {/* 브레드크럼 */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/questions/new" className="hover:text-foreground transition-colors flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          질문
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium truncate">{question.title}</span>
      </nav>

      <NotebookEditor initialQuestion={question} />
    </div>
  );
}
