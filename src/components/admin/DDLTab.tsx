"use client";

import * as React from "react";
import { RefreshCw, DatabaseZap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DDLTabProps {
  password: string;
}

export function DDLTab({ password }: DDLTabProps) {
  const [ddlContent, setDdlContent] = React.useState<string | null>(null);
  const [loadingDdl, setLoadingDdl] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [syncResult, setSyncResult] = React.useState<string>("");
  const [error, setError] = React.useState("");

  const headers = { "x-admin-password": password };

  const fetchDdl = React.useCallback(async () => {
    setLoadingDdl(true);
    setError("");
    try {
      // ddl.sql은 공개 경로에 없으므로 훈련 데이터에서 DDL 타입을 가져옴
      const res = await fetch("/api/admin/training", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      const ddlItems = (data.items ?? []).filter(
        (i: { training_data_type: string }) => i.training_data_type === "ddl"
      );
      if (ddlItems.length === 0) {
        setDdlContent("(아직 DDL이 학습되지 않았습니다. 동기화 버튼을 눌러 학습하세요.)");
      } else {
        setDdlContent(
          ddlItems.map((i: { content?: string }) => i.content ?? "").join("\n\n")
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoadingDdl(false);
    }
  }, [password]);

  React.useEffect(() => {
    fetchDdl();
  }, [fetchDdl]);

  const handleSync = async () => {
    if (!confirm("ddl.sql 파일을 파싱하여 DDL 전체를 재학습합니다. 계속하시겠습니까?")) return;
    setSyncing(true);
    setError("");
    setSyncResult("");
    try {
      const res = await fetch("/api/admin/ddl-sync", {
        method: "POST",
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setSyncResult(`동기화 완료: ${data.trained_count}개 테이블 DDL 학습됨`);
      fetchDdl();
    } catch (e) {
      setError(e instanceof Error ? e.message : "동기화 실패");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">DDL 관리</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            ai-backend/training/ddl.sql 기반으로 스키마를 재학습합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchDdl} disabled={loadingDdl}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loadingDdl ? "animate-spin" : ""}`} />
            새로고침
          </Button>
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            <DatabaseZap className="h-3.5 w-3.5 mr-1" />
            {syncing ? "동기화 중..." : "DDL 동기화"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/50 px-3 py-2">
          {error}
        </p>
      )}
      {syncResult && (
        <p className="text-sm text-green-600 dark:text-green-400 rounded-md border border-green-200 bg-green-50 dark:bg-green-950/50 px-3 py-2">
          {syncResult}
        </p>
      )}

      <div className="rounded-lg border bg-muted/30 overflow-hidden">
        <div className="border-b px-4 py-2 bg-muted/50">
          <p className="text-xs font-mono text-muted-foreground">학습된 DDL (ChromaDB)</p>
        </div>
        <pre className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto overflow-y-auto max-h-[500px] whitespace-pre-wrap text-foreground">
          {loadingDdl ? "불러오는 중..." : (ddlContent ?? "")}
        </pre>
      </div>
    </div>
  );
}
