import * as React from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Edit3, MessageSquare, Play } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useSavedQuestions } from "@/hooks/useSavedQuestions";
import { Skeleton } from "@/components/ui/skeleton";
import type { SavedQuestion } from "@/types/question";

function executeQuestion(question: SavedQuestion, values: Record<string, string>) {
  return apiFetch("/api/db-query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sql: question.sql,
      params: question.params.map((param) => values[param.key] ?? param.defaultValue ?? ""),
    }),
  });
}

export default function QuestionDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuestion, hydrated } = useSavedQuestions();
  const question = getQuestion(id);
  const [values, setValues] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<{ rows?: Record<string, unknown>[]; columns?: { name: string }[]; rowCount?: number } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!question) return;
    setValues(Object.fromEntries(question.params.map((param) => [param.key, param.defaultValue ?? ""])));
  }, [question]);

  if (!hydrated) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!question) return <Navigate to="/questions" replace />;

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await executeQuestion(question, values);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "실행에 실패했습니다.");
      setResult(json);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "실행에 실패했습니다.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const columns = result?.columns?.map((column) => column.name) ?? Object.keys(result?.rows?.[0] ?? {});

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link to="/questions" className="hover:text-foreground transition-colors flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          질문
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{question.title}</span>
      </nav>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{question.title}</h1>
            {question.description && <p className="text-sm text-muted-foreground">{question.description}</p>}
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>저장일 {new Date(question.savedAt).toLocaleDateString("ko-KR")}</span>
              <span>수정일 {new Date(question.updatedAt).toLocaleDateString("ko-KR")}</span>
              <span>차트 {question.visualization.type}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/questions/new?id=${question.id}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Edit3 className="h-4 w-4" />
              편집
            </button>
            <button
              onClick={run}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {loading ? "실행 중..." : "실행"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-2 text-sm font-semibold text-foreground">SQL</p>
              <pre className="overflow-auto text-xs leading-6 text-muted-foreground">{question.sql}</pre>
            </div>

            <div className="rounded-xl border border-border bg-background p-4">
              <p className="mb-3 text-sm font-semibold text-foreground">Parameters</p>
              {question.params.length === 0 ? (
                <p className="text-sm text-muted-foreground">파라미터 없음</p>
              ) : (
                <div className="space-y-3">
                  {question.params.map((param) => (
                    <div key={param.key}>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">{param.key}</label>
                      <input
                        type={param.type === "number" ? "number" : param.type === "date" ? "date" : "text"}
                        value={values[param.key] ?? ""}
                        onChange={(event) => setValues((prev) => ({ ...prev, [param.key]: event.target.value }))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {!result ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-background text-sm text-muted-foreground">
                실행 후 결과가 표시됩니다.
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background overflow-auto">
                <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">Result</span>
                  <span className="text-muted-foreground">{result.rowCount ?? result.rows?.length ?? 0} rows</span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {columns.map((column) => (
                        <th key={column} className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(result.rows ?? []).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                        {columns.map((column) => (
                          <td key={column} className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                            {row[column] === null || row[column] === undefined ? "null" : String(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
