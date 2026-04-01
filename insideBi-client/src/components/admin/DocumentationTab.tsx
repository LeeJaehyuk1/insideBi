
import * as React from "react";
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";

interface TrainingItem {
  id: string;
  training_data_type: string;
  question?: string;
  content?: string;
}

interface DocumentationTabProps {
  password: string;
}

export function DocumentationTab({ password }: DocumentationTabProps) {
  const [items, setItems] = React.useState<TrainingItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [docText, setDocText] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const headers = { "x-admin-password": password };

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/training", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      const docItems = (data.items as TrainingItem[]).filter(
        (i) => i.training_data_type === "documentation"
      );
      setItems(docItems);
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
    if (!docText.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await apiFetch("/api/admin/training?type=doc", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ documentation: docText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setDocText("");
      setSuccessMsg("추가되었습니다.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가 실패");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 항목을 삭제하시겠습니까?")) return;
    try {
      const res = await apiFetch("/api/admin/training-delete", {
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
        <h3 className="text-sm font-semibold">새 비즈니스 용어/문서 추가</h3>
        <textarea
          placeholder="예: NPL(부실여신비율)은 전체 여신 중 부실여신의 비율로, 3% 초과 시 위험 수준으로 간주합니다."
          value={docText}
          onChange={(e) => setDocText(e.target.value)}
          className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {successMsg && <p className="text-sm text-green-600 dark:text-green-400">{successMsg}</p>}
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={adding || !docText.trim()}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {adding ? "추가 중..." : "추가"}
        </Button>
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {items.length}개 문서
          </p>
          <Button variant="ghost" size="sm" onClick={fetchItems} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </Button>
        </div>

        {items.length === 0 && !loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            등록된 문서가 없습니다.
          </p>
        )}

        {items.map((item) => (
          <div key={item.id} className="rounded-lg border bg-card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate text-muted-foreground">
                  {(item.content ?? "").slice(0, 80)}
                  {(item.content ?? "").length > 80 ? "..." : ""}
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
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {item.content ?? ""}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
