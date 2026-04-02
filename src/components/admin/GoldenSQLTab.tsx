"use client";

import * as React from "react";
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, RotateCcw, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrainingItem {
  id: string;
  training_data_type: string;
  question?: string;
  content?: string;
}

interface GoldenSQLTabProps {
  password: string;
}

export function GoldenSQLTab({ password }: GoldenSQLTabProps) {
  const [items, setItems] = React.useState<TrainingItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [sql, setSql] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [retraining, setRetraining] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const headers = { "x-admin-password": password };

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/training", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      // SQL 타입만 필터
      const sqlItems = (data.items as TrainingItem[]).filter(
        (i) => i.training_data_type === "sql"
      );
      setItems(sqlItems);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [password]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAdd = async () => {
    if (!question.trim() || !sql.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/admin/training?type=sql", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ question, sql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setQuestion("");
      setSql("");
      setSuccessMsg("추가되었습니다.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setAdding(false);
    }
  };

  const handleRetrainAll = async () => {
    if (!confirm("ChromaDB를 전체 재학습합니다. 시간이 걸릴 수 있습니다. 진행하시겠습니까?")) return;
    setRetraining(true);
    setError("");
    try {
      const res = await fetch("/api/admin/retrain-all", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSuccessMsg("전체 재학습 완료! 목록을 새로고침합니다.");
      setTimeout(() => setSuccessMsg(""), 4000);
      fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "재학습 실패");
    } finally {
      setRetraining(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`등록된 Q-SQL 쌍 ${items.length}개를 전부 삭제합니다. 계속하시겠습니까?`)) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/training-delete-all", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSuccessMsg(`${data.deleted}개 삭제 완료.`);
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch("/api/admin/training-delete", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    }
  };

  return (
    <div className="space-y-6">
      {/* 추가 폼 */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold">새 Q-SQL 쌍 추가</h3>
        <Input
          placeholder="질문 (예: 지난 12개월 NPL 비율 추이)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <textarea
          placeholder="SQL (예: SELECT month, npl_ratio FROM npl_trend ORDER BY month)"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {successMsg && <p className="text-sm text-green-600 dark:text-green-400">{successMsg}</p>}
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={adding || !question.trim() || !sql.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {adding ? "추가 중..." : "추가"}
        </Button>
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {items.length}개 Q-SQL 쌍
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              disabled={deleting || items.length === 0}
              className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Eraser className="h-3.5 w-3.5 mr-1" />
              {deleting ? "삭제 중..." : "전체 삭제"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetrainAll}
              disabled={retraining}
              className="text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950"
            >
              <RotateCcw className={`h-3.5 w-3.5 mr-1 ${retraining ? "animate-spin" : ""}`} />
              {retraining ? "재학습 중..." : "전체 재학습"}
            </Button>
            <Button variant="ghost" size="sm" onClick={fetchItems} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </Button>
          </div>
        </div>

        {items.length === 0 && !loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            등록된 Q-SQL 쌍이 없습니다.
          </p>
        )}

        {items.map((item) => (
          <div key={item.id} className="rounded-lg border bg-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.question ?? "(질문 없음)"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                {expandedId === item.id
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </div>
            {expandedId === item.id && (
              <div className="border-t bg-muted/30 px-4 py-3">
                <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap text-foreground">
                  {item.content ?? ""}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
