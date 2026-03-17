"use client";

import * as React from "react";
import { GoldenSQLTab } from "@/components/admin/GoldenSQLTab";
import { DocumentationTab } from "@/components/admin/DocumentationTab";
import { DDLTab } from "@/components/admin/DDLTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { MonitoringTab } from "@/components/admin/MonitoringTab";
import { cn } from "@/lib/utils";

const AI_TABS = [
  { id: "golden-sql",    label: "Golden SQL",    description: "Q-SQL 학습 데이터" },
  { id: "documentation", label: "비즈니스 용어집", description: "용어 & 문서 학습" },
  { id: "ddl",           label: "DDL 관리",       description: "스키마 학습 데이터" },
  { id: "feedback",      label: "피드백 검수",     description: "사용자 피드백 관리" },
  { id: "monitoring",    label: "모니터링",        description: "AI 사용 통계" },
] as const;

type AiTabId = (typeof AI_TABS)[number]["id"];

interface Props {
  password: string;
}

export function AiSection({ password }: Props) {
  const [activeTab, setActiveTab] = React.useState<AiTabId>("golden-sql");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">AI 관리</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Vanna.ai RAG 학습 데이터 및 AI 모니터링을 관리합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="border-b border-border">
        <div className="flex gap-0">
          {AI_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === "golden-sql"    && <GoldenSQLTab    password={password} />}
        {activeTab === "documentation" && <DocumentationTab password={password} />}
        {activeTab === "ddl"           && <DDLTab           password={password} />}
        {activeTab === "feedback"      && <FeedbackTab      password={password} />}
        {activeTab === "monitoring"    && <MonitoringTab    password={password} />}
      </div>
    </div>
  );
}
