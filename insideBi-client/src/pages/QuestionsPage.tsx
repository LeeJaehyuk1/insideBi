import * as React from "react";
import { Link } from "react-router-dom";
import { Clock3, FileCode2, Plus, Trash2 } from "lucide-react";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { Skeleton } from "@/components/ui/skeleton";

export default function QuestionsPage() {
  const { questions, hydrated, deleteQuestion } = useSavedQuestions();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Questions</h1>
          <p className="text-sm text-muted-foreground">저장된 SQL 질문 목록입니다.</p>
        </div>
        <Link
          to="/questions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          새 질문
        </Link>
      </div>

      {!hydrated ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <Skeleton key={item} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="text-base font-semibold text-foreground">저장된 질문이 없습니다.</p>
          <p className="mt-2 text-sm text-muted-foreground">SQL Editor에서 첫 질문을 만들어 저장하세요.</p>
          <Link
            to="/questions/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            SQL Editor 열기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <div
              key={question.id}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <FileCode2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <Link to={`/questions/${question.id}`} className="block text-lg font-semibold text-foreground hover:text-primary">
                  {question.title}
                </Link>
                {question.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{question.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>차트 {question.visualization.type}</span>
                  <span>파라미터 {question.params.length}개</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(question.updatedAt).toLocaleDateString("ko-KR")}
                  </span>
                </div>
                <pre className="mt-3 overflow-hidden text-ellipsis whitespace-pre-wrap rounded-lg bg-muted/35 p-3 text-xs text-muted-foreground">
                  {question.sql}
                </pre>
              </div>
              <button
                onClick={() => deleteQuestion(question.id)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
