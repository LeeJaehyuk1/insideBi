import * as React from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { ChevronRight, MessageSquare } from "lucide-react";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { NotebookEditor } from "@/components/questions/NotebookEditor";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { getQuestion, hydrated } = useSavedQuestions();

  if (!hydrated) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const question = getQuestion(id);
  if (!question) return <Navigate to="/questions" replace />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/questions" className="hover:text-foreground transition-colors flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          질문
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{question.title}</span>
      </nav>

      <NotebookEditor initialQuestion={question} />
    </div>
  );
}
