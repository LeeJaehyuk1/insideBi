
import * as React from "react";
import { TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

type Severity = "normal" | "caution" | "warning" | "danger";

interface BriefingItem {
  key: string;
  label: string;
  value: string;
  subValue?: string;
  status: Severity;
  description: string;
  trend?: "up" | "down" | "flat";
}

const STATUS_STYLE: Record<Severity, { badge: string; border: string; icon: string }> = {
  normal:  { badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",  border: "border-green-200 dark:border-green-800",  icon: "text-green-600" },
  caution: { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-800", icon: "text-yellow-600" },
  warning: { badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", icon: "text-orange-600" },
  danger:  { badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",  border: "border-red-200 dark:border-red-800",  icon: "text-red-600" },
};

const STATUS_LABEL: Record<Severity, string> = {
  normal: "정상", caution: "주의", warning: "경고", danger: "위험",
};

const CARD_QUESTIONS: Record<string, string> = {
  fx: "최근 USD/KRW 환율 90일 추이를 보여줘",
  index: "KOSPI 지수 최근 180일 추이를 보여줘",
  vol: "기초자산별 변동성 현황과 추이를 보여줘",
  rho: "콴토 상관계수(quanto_rho) 추이를 보여줘",
};

function BriefingCard({ item, onSearch }: { item: BriefingItem; onSearch?: (q: string) => void }) {
  const style = STATUS_STYLE[item.status];
  const TrendIcon = item.trend === "up" ? TrendingUp : item.trend === "down" ? TrendingDown : Minus;
  const question = CARD_QUESTIONS[item.key];

  return (
    <button
      onClick={() => question && onSearch?.(question)}
      className={cn(
        "w-full text-left rounded-xl border bg-card p-5 space-y-3 transition-all",
        "hover:shadow-md hover:scale-[1.02] active:scale-[0.99]",
        onSearch && question ? "cursor-pointer" : "cursor-default",
        style.border
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-sm font-semibold text-foreground">{item.label}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", style.badge)}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      <div className="space-y-0.5">
        <p className="text-2xl font-bold text-foreground">{item.value}</p>
        {item.subValue && (
          <p className="text-xs text-muted-foreground">{item.subValue}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <TrendIcon className={cn("h-3.5 w-3.5 shrink-0", style.icon)} />
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-5 w-12 rounded-full bg-muted" />
      </div>
      <div className="space-y-1">
        <div className="h-8 w-32 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
      <div className="h-3 w-full rounded bg-muted" />
    </div>
  );
}


interface InsightBriefingProps {
  onSearch?: (question: string) => void;
}

export function InsightBriefing({ onSearch }: InsightBriefingProps = {}) {
  const [items, setItems] = React.useState<BriefingItem[] | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    apiFetch("/api/briefing")
      .then((r) => r.json())
      .then((json) => {
        if (json.items) setItems(json.items);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <AlertCircle className="h-4 w-4" />
        <span>인사이트 데이터를 불러오지 못했습니다. AI 백엔드를 확인하세요.</span>
      </div>
    );
  }

  if (!items) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <BriefingCard key={item.key} item={item} onSearch={onSearch} />
      ))}
    </div>
  );
}
