
import { Link } from "react-router-dom";
import {
  Home, CreditCard, TrendingUp, Droplets, Target,
  LayoutTemplate, Shield, Clock, BarChart3, Database, FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

const ICON_MAP: Record<string, React.ElementType> = {
  Home,
  CreditCard,
  TrendingUp,
  Droplets,
  Target,
  LayoutTemplate,
  Shield,
  BarChart3,
  Database,
  FolderOpen,
};

const COLOR_MAP: Record<string, string> = {
  Home: "bg-slate-500",
  CreditCard: "bg-blue-500",
  TrendingUp: "bg-violet-500",
  Droplets: "bg-cyan-500",
  Target: "bg-emerald-500",
  LayoutTemplate: "bg-orange-500",
  Shield: "bg-red-500",
};

export function RecentlyViewedSection() {
  const { items, hydrated } = useRecentlyViewed();

  if (!hydrated || items.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          최근 방문
        </h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? Home;
          const color = COLOR_MAP[item.icon] ?? "bg-slate-500";
          const timeAgo = formatDistanceToNow(new Date(item.visitedAt), {
            addSuffix: true,
            locale: ko,
          });
          return (
            <Link
              key={item.href}
              to={item.href}
              className="flex-shrink-0 flex items-center gap-3 rounded-lg border bg-card px-4 py-3 hover:border-primary/50 hover:shadow-sm transition-all min-w-[200px]"
            >
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0", color)}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">{timeAgo}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
