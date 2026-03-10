"use client";

import * as React from "react";
import { Shield, Lock } from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { GoldenSQLTab } from "@/components/admin/GoldenSQLTab";
import { DocumentationTab } from "@/components/admin/DocumentationTab";
import { DDLTab } from "@/components/admin/DDLTab";
import { FeedbackTab } from "@/components/admin/FeedbackTab";
import { useRole } from "@/context/RoleContext";

const TABS = [
  { id: "golden-sql", label: "Golden SQL" },
  { id: "documentation", label: "비즈니스 용어집" },
  { id: "ddl", label: "DDL 관리" },
  { id: "feedback", label: "피드백 검수" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const SESSION_KEY = "admin_auth";

export function AdminClient() {
  const { role } = useRole();
  const [password, setPassword] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabId>("golden-sql");
  const [hydrated, setHydrated] = React.useState(false);

  // sessionStorage hydration (SSR 방지)
  React.useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setPassword(stored);
    setHydrated(true);
  }, []);

  const handleLogin = async (pw: string) => {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "x-admin-password": pw },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ detail: "로그인 실패" }));
      throw new Error(data.detail ?? "로그인 실패");
    }
    sessionStorage.setItem(SESSION_KEY, pw);
    setPassword(pw);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword(null);
  };

  if (!hydrated) return null;

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-base font-semibold">관리자 역할이 필요합니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            사이드바 하단에서 역할을 <strong>관리자</strong>로 변경하세요.
          </p>
        </div>
      </div>
    );
  }

  if (!password) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">AI 학습 데이터 관리</h1>
            <p className="text-sm text-muted-foreground">
              Vanna.ai RAG 학습 데이터를 관리합니다.
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="border-b">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={
                activeTab === tab.id
                  ? "border-b-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary"
                  : "px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div>
        {activeTab === "golden-sql" && <GoldenSQLTab password={password} />}
        {activeTab === "documentation" && <DocumentationTab password={password} />}
        {activeTab === "ddl" && <DDLTab password={password} />}
        {activeTab === "feedback" && <FeedbackTab password={password} />}
      </div>
    </div>
  );
}
