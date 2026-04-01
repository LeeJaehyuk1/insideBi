
import * as React from "react";
import { ThumbsUp, ThumbsDown, CheckCircle, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  message_id: string;
  rating: "up" | "down";
  question: string;
  sql: string;
  approved: boolean;
  timestamp: string;
}

interface FeedbackTabProps {
  password: string;
}

export function FeedbackTab({ password }: FeedbackTabProps) {
  const [items, setItems] = React.useState<FeedbackItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [editedSql, setEditedSql] = React.useState<Record<string, string>>({});
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const headers = { "x-admin-password": password };

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/feedback", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      // 최신 순 정렬
      const sorted = [...(data.items as FeedbackItem[])].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setItems(sorted);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  }, [password]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleApprove = async (item: FeedbackItem) => {
    const sql = editedSql[item.message_id] ?? item.sql;
    if (!item.question || !sql) {
      setError("질문 또는 SQL이 비어 있습니다. 피드백 전송 시 질문/SQL을 포함해야 합니다.");
      return;
    }
    setProcessingId(item.message_id);
    setError("");
    try {
      const res = await fetch("/api/admin/feedback-approve", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: item.message_id,
          question: item.question,
          sql,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "승인 실패");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("이 피드백을 삭제하시겠습니까?")) return;
    setProcessingId(messageId);
    try {
      const res = await fetch("/api/admin/feedback-delete", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: messageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      fetchItems();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제 실패");
    } finally {
      setProcessingId(null);
    }
  };

  const upCount = items.filter((i) => i.rating === "up").length;
  const downCount = items.filter((i) => i.rating === "down").length;
  const pendingCount = items.filter((i) => !i.approved).length;

  return (
    <div className="space-y-4">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border bg-card px-4 py-3 text-center">
          <p className="text-2xl font-bold text-green-600">{upCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">긍정 피드백</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 text-center">
          <p className="text-2xl font-bold text-red-600">{downCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">부정 피드백</p>
        </div>
        <div className="rounded-lg border bg-card px-4 py-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">미검수</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">총 {items.length}개 피드백</p>
        <Button variant="ghost" size="sm" onClick={fetchItems} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/50 px-3 py-2">
          {error}
        </p>
      )}

      {items.length === 0 && !loading && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          피드백이 없습니다. AI 패널에서 👍/👎 버튼을 눌러 피드백을 남겨보세요.
        </p>
      )}

      {items.map((item) => {
        const isExpanded = expandedId === item.message_id;
        const sqlValue = editedSql[item.message_id] ?? item.sql;
        const isProcessing = processingId === item.message_id;

        return (
          <div
            key={item.message_id}
            className={cn(
              "rounded-lg border bg-card overflow-hidden",
              item.approved && "opacity-60"
            )}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : item.message_id)}
            >
              {/* 피드백 아이콘 */}
              {item.rating === "up" ? (
                <ThumbsUp className="h-4 w-4 shrink-0 text-green-600" />
              ) : (
                <ThumbsDown className="h-4 w-4 shrink-0 text-red-500" />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.question || "(질문 없음)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString("ko-KR")}
                  {item.approved && (
                    <span className="ml-2 text-green-600 font-medium">✓ 승인됨</span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!item.approved && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={(e) => { e.stopPropagation(); handleApprove(item); }}
                    disabled={isProcessing}
                    title="승인하여 Golden SQL로 학습"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.message_id); }}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </div>

            {isExpanded && (
              <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">질문</p>
                  <p className="text-sm">{item.question || "(없음)"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    SQL {!item.approved && "(수정 가능)"}
                  </p>
                  {item.approved ? (
                    <pre className="text-[11px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                      {sqlValue}
                    </pre>
                  ) : (
                    <textarea
                      value={sqlValue}
                      onChange={(e) =>
                        setEditedSql((prev) => ({
                          ...prev,
                          [item.message_id]: e.target.value,
                        }))
                      }
                      className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-[11px] font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  )}
                </div>
                {!item.approved && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(item)}
                    disabled={isProcessing || !item.question || !sqlValue}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {isProcessing ? "처리 중..." : "승인 및 학습"}
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
