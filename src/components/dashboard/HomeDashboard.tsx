"use client";

import * as React from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { useMyDashboard } from "@/hooks/useMyDashboard";
import { useDashboardLibrary } from "@/hooks/useDashboardLibrary";
import { DashboardPreview } from "@/components/builder/DashboardPreview";
import { DefaultDashboard } from "./DefaultDashboard";

export function HomeDashboard() {
  const { myDashboard, hydrated: myHydrated, clearMyDashboard } = useMyDashboard();
  const { library, hydrated: libHydrated } = useDashboardLibrary();

  // myDashboard가 라이브러리에 실제로 존재하는지 교차검증
  const validMyDashboard =
    myDashboard && library.some((d) => d.name === myDashboard.name)
      ? myDashboard
      : null;

  // stale myDashboard 자동 cleanup (라이브러리에 없는 경우)
  React.useEffect(() => {
    if (myHydrated && libHydrated && myDashboard && !validMyDashboard) {
      clearMyDashboard();
    }
  }, [myHydrated, libHydrated, myDashboard, validMyDashboard, clearMyDashboard]);

  if (!myHydrated || !libHydrated) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm animate-pulse">
        대시보드 불러오는 중...
      </div>
    );
  }

  if (validMyDashboard) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h1 className="text-lg font-bold">{validMyDashboard.name}</h1>
            <p className="text-xs text-muted-foreground">
              저장: {new Date(validMyDashboard.savedAt).toLocaleString("ko-KR")} · 위젯 {validMyDashboard.widgets.length}개
            </p>
          </div>
          <Link
            href="/builder"
            className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-md px-3 py-1.5 transition-colors"
          >
            <Pencil className="h-3 w-3" /> 편집
          </Link>
        </div>
        <DashboardPreview dashboard={validMyDashboard} hideHeader />
      </div>
    );
  }

  return <DefaultDashboard />;
}
