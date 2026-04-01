
import { Link } from "react-router-dom";
import {
  LayoutTemplate, Clock, Home, Share2, Trash2, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavedDashboard } from "@/types/builder";
import { BookmarkButton } from "@/components/ui/BookmarkButton";

interface DashboardGalleryProps {
  items: SavedDashboard[];
  homeName: string | null;
  onDelete: (name: string) => void;
  onSetHome: (dashboard: SavedDashboard) => void;
  onClearHome: () => void;
}

export function DashboardGallery({
  items,
  homeName,
  onDelete,
  onSetHome,
  onClearHome,
}: DashboardGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="py-24 text-center text-muted-foreground space-y-3">
        <LayoutTemplate className="h-12 w-12 mx-auto opacity-20" />
        <p className="text-sm">저장된 대시보드가 없습니다</p>
        <Link
          to="/builder"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <LayoutTemplate className="h-4 w-4" />
          새 대시보드 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((dashboard) => {
        const isHome = homeName === dashboard.name;
        const widgetCount = dashboard.widgets?.length ?? 0;
        const savedAt = new Date(dashboard.savedAt).toLocaleDateString("ko-KR", {
          year: "numeric", month: "long", day: "numeric",
        });

        return (
          <div
            key={dashboard.name}
            className={cn(
              "group relative rounded-xl border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all",
              isHome && "border-primary/40 bg-primary/5"
            )}
          >
            {/* 홈 배지 */}
            {isHome && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                <Home className="h-2.5 w-2.5" />
                홈
              </div>
            )}

            {/* 아이콘 + 이름 */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <LayoutTemplate className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{dashboard.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  위젯 {widgetCount}개
                </p>
              </div>
            </div>

            {/* 저장일 */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
              <Clock className="h-3 w-3" />
              {savedAt}
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center gap-2">
              <Link
                to={`/dashboards/new?name=${encodeURIComponent(dashboard.name)}`}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                열기
              </Link>
              <BookmarkButton
                item={{ id: `dashboard-${dashboard.name}`, type: "dashboard", name: dashboard.name, href: `/dashboards/new?name=${encodeURIComponent(dashboard.name)}` }}
                className="rounded-lg border p-1.5 h-auto w-auto"
                size="sm"
              />
              <button
                onClick={() => isHome ? onClearHome() : onSetHome(dashboard)}
                title={isHome ? "홈에서 제거" : "홈으로 설정"}
                className={cn(
                  "flex items-center justify-center rounded-lg border p-1.5 transition-colors",
                  isHome
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <Home className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`"${dashboard.name}"을(를) 삭제하시겠습니까?`)) {
                    onDelete(dashboard.name);
                  }
                }}
                title="삭제"
                className="flex items-center justify-center rounded-lg border p-1.5 text-muted-foreground hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
