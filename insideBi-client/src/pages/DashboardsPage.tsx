
import * as React from "react";
import { Link } from "react-router-dom";
import { LayoutTemplate, Plus, RefreshCw } from "lucide-react";
import { useDashboardLibrary } from "@/hooks/useDashboardLibrary";
import { useMyDashboard } from "@/hooks/useMyDashboard";
import { DashboardGallery } from "@/components/builder/DashboardGallery";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardsPage() {
  const { library, hydrated, deleteDashboard } = useDashboardLibrary();
  const { myDashboard, setMyDashboard, clearMyDashboard } = useMyDashboard();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <LayoutTemplate className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">대시보드</h1>
            <p className="text-sm text-muted-foreground">저장된 커스텀 대시보드 목록</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            새로고침
          </button>
          <Link
            to="/builder"
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            새 대시보드
          </Link>
        </div>
      </div>

      {/* 목록 */}
      {!hydrated ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <DashboardGallery
          items={library}
          homeName={myDashboard?.name ?? null}
          onDelete={deleteDashboard}
          onSetHome={setMyDashboard}
          onClearHome={clearMyDashboard}
        />
      )}
    </div>
  );
}
