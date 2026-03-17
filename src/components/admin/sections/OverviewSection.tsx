"use client";

import * as React from "react";
import {
  Users, Database, MessageSquare, LayoutTemplate,
  CheckCircle2, AlertCircle, Clock, TrendingUp,
  ShieldCheck, Activity,
} from "lucide-react";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { DATABASES, DB_TABLES } from "@/lib/db-catalog";

const ACTIVITY_LOG = [
  { id: 1, type: "user",     msg: "재혁 이 로그인",               time: "방금 전" },
  { id: 2, type: "question", msg: "'NPL 추이' 질문 저장됨",        time: "5분 전" },
  { id: 3, type: "dashboard",msg: "'신용리스크 대시보드' 수정됨",  time: "12분 전" },
  { id: 4, type: "user",     msg: "뷰어 비활성화됨",              time: "1시간 전" },
  { id: 5, type: "system",   msg: "DB 스키마 동기화 완료",        time: "2시간 전" },
  { id: 6, type: "question", msg: "'VaR 요약' 질문 생성됨",       time: "3시간 전" },
];

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}
function StatCard({ label, value, icon: Icon, color, sub }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function OverviewSection() {
  const { users, hydrated } = useAdminUsers();

  const activeUsers  = users.filter((u) => u.status === "active").length;
  const adminCount   = users.filter((u) => u.role === "admin").length;
  const totalTables  = Object.values(DB_TABLES).reduce((s, t) => s + t.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">시스템 개요</h2>
        <p className="text-sm text-muted-foreground mt-0.5">InsightBi 관리 현황을 한눈에 확인하세요.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="활성 사용자"
          value={hydrated ? activeUsers : "—"}
          icon={Users}
          color="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          sub={`전체 ${hydrated ? users.length : "—"}명`}
        />
        <StatCard
          label="DB 연결"
          value={DATABASES.length}
          icon={Database}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          sub={`테이블 ${totalTables}개`}
        />
        <StatCard
          label="저장된 질문"
          value="12"
          icon={MessageSquare}
          color="bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
          sub="최근 7일 +3개"
        />
        <StatCard
          label="대시보드"
          value="8"
          icon={LayoutTemplate}
          color="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
          sub="활성 5개"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 시스템 상태 */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">시스템 상태</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "애플리케이션 서버",  status: "정상", ok: true },
              { label: "railway DB",         status: "연결됨", ok: true },
              { label: "Sample DB",          status: "연결됨", ok: true },
              { label: "AI 백엔드 (Vanna)",  status: "오프라인", ok: false },
              { label: "캐시 서버",           status: "정상", ok: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className={`flex items-center gap-1.5 text-xs font-medium ${item.ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                  {item.ok
                    ? <CheckCircle2 className="h-3.5 w-3.5" />
                    : <AlertCircle className="h-3.5 w-3.5" />
                  }
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">최근 활동</h3>
          </div>
          <div className="space-y-3">
            {ACTIVITY_LOG.map((log) => {
              const Icon =
                log.type === "user"      ? Users :
                log.type === "question"  ? MessageSquare :
                log.type === "dashboard" ? LayoutTemplate :
                Activity;
              return (
                <div key={log.id} className="flex items-start gap-3 py-1.5 border-b border-border last:border-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.msg}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{log.time}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 역할 분포 */}
      {hydrated && (
        <div className="rounded-xl border border-border bg-background p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">역할 분포</h3>
          </div>
          <div className="flex items-center gap-8">
            {[
              { label: "관리자", role: "admin",  color: "bg-red-500" },
              { label: "편집자", role: "editor", color: "bg-blue-500" },
              { label: "뷰어",   role: "viewer", color: "bg-gray-400" },
            ].map(({ label, role, color }) => {
              const count = users.filter((u) => u.role === role).length;
              const pct   = users.length ? Math.round((count / users.length) * 100) : 0;
              return (
                <div key={role} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${color}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{count}명</p>
                    <p className="text-xs text-muted-foreground">{label} ({pct}%)</p>
                  </div>
                </div>
              );
            })}
            <div className="flex-1 ml-4">
              <div className="h-2.5 rounded-full bg-muted overflow-hidden flex">
                {[
                  { role: "admin",  color: "bg-red-500"  },
                  { role: "editor", color: "bg-blue-500" },
                  { role: "viewer", color: "bg-gray-400" },
                ].map(({ role, color }) => {
                  const count = users.filter((u) => u.role === role).length;
                  const pct   = users.length ? (count / users.length) * 100 : 0;
                  return pct > 0 ? (
                    <div key={role} className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
