import * as React from "react";
import { DDLTab } from "@/components/admin/DDLTab";
import { DocumentationTab } from "@/components/admin/DocumentationTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { GoldenSQLTab } from "@/components/admin/GoldenSQLTab";
import { MonitoringTab } from "@/components/admin/MonitoringTab";
import { cn } from "@/lib/utils";

const AI_TABS = [
  { id: "golden-sql", label: "Golden SQL", description: "질문-쿼리 학습 데이터를 관리합니다." },
  { id: "documentation", label: "문서 학습", description: "용어집과 설명 문서를 관리합니다." },
  { id: "ddl", label: "DDL 관리", description: "스키마 학습 데이터와 동기화를 관리합니다." },
  { id: "feedback", label: "피드백 검토", description: "사용자 피드백과 승인 흐름을 관리합니다." },
  { id: "monitoring", label: "모니터링", description: "AI 사용 현황과 통계를 확인합니다." },
] as const;

type AiTabId = (typeof AI_TABS)[number]["id"];

interface Props {
  password: string;
}

export function AiSection({ password }: Props) {
  const [activeTab, setActiveTab] = React.useState<AiTabId>("golden-sql");
  const active = AI_TABS.find((tab) => tab.id === activeTab) ?? AI_TABS[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">AI 관리</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          AI 학습 데이터, 피드백, 운영 상태를 한 곳에서 관리합니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {AI_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-4">
          <p className="text-sm font-semibold text-foreground">{active.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">{active.description}</p>
        </div>

        {activeTab === "golden-sql" && <GoldenSQLTab password={password} />}
        {activeTab === "documentation" && <DocumentationTab password={password} />}
        {activeTab === "ddl" && <DDLTab password={password} />}
        {activeTab === "feedback" && <FeedbackTab password={password} />}
        {activeTab === "monitoring" && <MonitoringTab password={password} />}
      </div>
    </div>
  );
}
