"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { useMyDashboard } from "@/hooks/useMyDashboard";
import { DashboardPreview } from "@/components/builder/DashboardPreview";
import { DefaultDashboard } from "./DefaultDashboard";

export function HomeDashboard() {
  const { myDashboard, hydrated } = useMyDashboard();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm animate-pulse">
        대시보드 불러오는 중...
      </div>
    );
  }

  if (myDashboard) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold">{myDashboard.name}</h1>
            <p className="text-xs text-muted-foreground">
              저장: {new Date(myDashboard.savedAt).toLocaleString("ko-KR")} · 위젯 {myDashboard.widgets.length}개
            </p>
          </div>
          <Link
            href="/builder"
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 transition-colors"
          >
            <Pencil className="h-3 w-3" /> 편집
          </Link>
        </div>
        <DashboardPreview dashboard={myDashboard} hideHeader />
      </div>
    );
  }

  return <DefaultDashboard />;
}
