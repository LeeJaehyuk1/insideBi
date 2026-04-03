import * as React from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Bot,
  ChevronRight,
  Clock,
  Code,
  FileText,
  LayoutTemplate,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AiSearchBar } from "./AiSearchBar";
import { InsightBriefing } from "./InsightBriefing";
import { AiChartResult } from "@/components/ai/AiChartResult";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiChat } from "@/hooks/useAiChat";
import { useMyDashboard } from "@/hooks/useMyDashboard";
import { reports } from "@/lib/mock-data/reports";
import { QuickActionBar } from "./QuickActionBar";
import { RecentlyViewedSection } from "./RecentlyViewedSection";
import { PinnedSection } from "./PinnedSection";

const WORKSPACE_PAGES = [
  {
    href: "/questions",
    title: "Questions",
    description: "Browse and revisit saved SQL queries.",
    icon: FileText,
    color: "bg-blue-500",
    stat: "Shared SQL work",
  },
  {
    href: "/dashboards",
    title: "Dashboards",
    description: "Open published dashboards and tracked views.",
    icon: LayoutTemplate,
    color: "bg-violet-500",
    stat: "Popular views",
  },
  {
    href: "/dashboards/new",
    title: "New Dashboard",
    description: "Compose dashboard layouts and widgets.",
    icon: BarChart3,
    color: "bg-cyan-500",
    stat: "Visual editing",
  },
  {
    href: "/reports",
    title: "Reports",
    description: "Review generated reports and summaries.",
    icon: BookOpen,
    color: "bg-emerald-500",
    stat: "Recent results",
  },
];

const TOOL_PAGES = [
  {
    href: "/questions/new",
    title: "New Question",
    description: "Write SQL and start a new analysis.",
    icon: FileText,
    color: "bg-violet-500",
  },
  {
    href: "/questions",
    title: "Questions",
    description: "Search previous SQL and run it again.",
    icon: FileText,
    color: "bg-blue-500",
  },
  {
    href: "/dashboards/new",
    title: "New Dashboard",
    description: "Design dashboards with reusable widgets.",
    icon: LayoutTemplate,
    color: "bg-orange-500",
  },
  {
    href: "/reports",
    title: "Reports",
    description: "Inspect report output and exports.",
    icon: BookOpen,
    color: "bg-rose-500",
  },
];

const REPORT_STATUS: Record<string, string> = {
  published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
};

const REPORT_STATUS_LABEL: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  review: "In review",
  approved: "Approved",
};

function SectionHeader({
  title,
  to,
  linkText = "View all",
}: {
  title: string;
  to?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-xs text-primary hover:underline">
          {linkText}
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

const PROVIDER_STYLES = {
  groq: {
    active: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    dot: "bg-orange-400",
    label: "Groq",
  },
  gemini: {
    active: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    dot: "bg-blue-400",
    label: "Gemini",
  },
  claude: {
    active: "border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    dot: "bg-purple-400",
    label: "Claude",
  },
} as const;

export function MetaHome() {
  const { messages, ask, submitFeedback, clearHistory, provider, setProvider, providers } = useAiChat();
  const { myDashboard, hydrated: myDashboardHydrated } = useMyDashboard();
  const [sqlOpen, setSqlOpen] = React.useState(false);
  const [feedbackGiven, setFeedbackGiven] = React.useState<"up" | "down" | null>(null);
  const resultRef = React.useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const isLoading = messages.some((message) => message.status === "loading");
  const recentReports = reports.slice(0, 4);

  const handleSearch = (query: string) => {
    clearHistory();
    setSqlOpen(false);
    setFeedbackGiven(null);
    ask(query);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const handleReset = () => {
    clearHistory();
    setSqlOpen(false);
    setFeedbackGiven(null);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-12">
      <section className="space-y-5 pb-2 pt-4 text-center">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold text-foreground">
            <span className="text-primary">Inside BI</span> Workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            Ask in natural language or jump directly into your SQL workflow.
          </p>
        </div>
        <AiSearchBar onSearch={handleSearch} />

        <div className="flex items-center justify-center gap-2">
          {(["groq", "gemini", "claude"] as const).map((item) => {
            const meta = providers.find((providerItem) => providerItem.id === item);
            const style = PROVIDER_STYLES[item];
            const isActive = provider === item;
            const isUnavailable = providers.length > 0 && meta?.available === false;
            return (
              <button
                key={item}
                onClick={() => !isUnavailable && setProvider(item)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive ? style.active : "border-border text-muted-foreground hover:bg-muted",
                  isUnavailable && "cursor-not-allowed opacity-35",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    isActive ? style.dot : "bg-muted-foreground/40",
                  )}
                />
                {style.label}
              </button>
            );
          })}
        </div>
      </section>

      {hasMessages && (
        <section ref={resultRef} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <AiSearchBar onSearch={handleSearch} compact disabled={isLoading} />
            </div>
            <button
              onClick={handleReset}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>

          {lastUser && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                {lastUser.content}
              </div>
            </div>
          )}

          <div className={cn("mb-card space-y-4 p-5", lastAssistant?.status === "error" && "border-red-200 dark:border-red-800")}>
            {isLoading && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bot className="h-4 w-4 animate-pulse text-primary" />
                  <span>Generating analysis...</span>
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-44 w-full rounded-xl" />
              </div>
            )}

            {!isLoading && lastAssistant?.status === "error" && (
              <div className="text-sm text-red-600 dark:text-red-400">{lastAssistant.content}</div>
            )}

            {!isLoading && lastAssistant?.status === "success" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">AI Result</span>
                  {lastAssistant.provider && (
                    <span className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
                      {{ groq: "Groq", gemini: "Gemini", claude: "Claude" }[lastAssistant.provider]}
                    </span>
                  )}
                  {lastAssistant.fromCache && (
                    <span className="ml-1 flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <Zap className="h-2.5 w-2.5" />
                      Cache
                    </span>
                  )}
                </div>

                {lastAssistant.content && (
                  <p className="text-sm leading-relaxed text-foreground">{lastAssistant.content}</p>
                )}

                {lastAssistant.data && lastAssistant.data.length > 0 && lastAssistant.chartType && (
                  <AiChartResult
                    data={lastAssistant.data}
                    chartType={lastAssistant.chartType}
                    question={lastAssistant.question}
                  />
                )}

                <div className="flex items-center gap-2">
                  {lastAssistant.sql && (
                    <button
                      onClick={() => setSqlOpen((open) => !open)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Code className="h-3 w-3" />
                      {sqlOpen ? "Hide SQL" : "View SQL"}
                    </button>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <span className="mr-1 text-xs text-muted-foreground">Was this helpful?</span>
                    <button
                      onClick={() => {
                        if (!feedbackGiven) {
                          setFeedbackGiven("up");
                          submitFeedback(lastAssistant.id, "up", lastAssistant.question, lastAssistant.sql);
                        }
                      }}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        feedbackGiven === "up"
                          ? "bg-green-50 text-green-600 dark:bg-green-950"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (!feedbackGiven) {
                          setFeedbackGiven("down");
                          submitFeedback(lastAssistant.id, "down", lastAssistant.question, lastAssistant.sql);
                        }
                      }}
                      className={cn(
                        "rounded-md p-1.5 transition-colors",
                        feedbackGiven === "down"
                          ? "bg-red-50 text-red-600 dark:bg-red-950"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {sqlOpen && lastAssistant.sql && (
                  <pre className="overflow-x-auto rounded-lg border bg-muted/80 p-3 text-[11px] leading-relaxed text-foreground">
                    {lastAssistant.sql}
                  </pre>
                )}
              </>
            )}
          </div>

          {!isLoading && lastAssistant?.status === "success" && (
            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              Ask a follow-up question or reset to start a new query.
            </p>
          )}
        </section>
      )}

      {!hasMessages && (
        <>
          {myDashboardHydrated && myDashboard && (
            <section>
              <SectionHeader title="Home Dashboard" to="/dashboards" linkText="라이브러리 열기" />
              <div className="mb-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <LayoutTemplate className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">{myDashboard.name}</p>
                      <p className="text-xs text-muted-foreground">
                        위젯 {myDashboard.widgets?.length ?? 0}개 · {format(new Date(myDashboard.savedAt), "yyyy-MM-dd")} 저장
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    홈 대시보드로 지정된 항목입니다. 여기에서 바로 다시 열 수 있습니다.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/dashboards/new?name=${encodeURIComponent(myDashboard.name)}`}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    대시보드 열기
                  </Link>
                  <Link
                    to="/dashboards"
                    className="rounded-lg border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    목록 보기
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section>
            <SectionHeader title="Quick Start" />
            <QuickActionBar />
          </section>

          <PinnedSection />
          <RecentlyViewedSection />

          <section>
            <SectionHeader
              title="Highlights"
              to="/questions"
              linkText={`Updated ${format(new Date(), "yyyy-MM-dd")}`}
            />
            <InsightBriefing onSearch={handleSearch} />
          </section>

          <section>
            <SectionHeader title="Workspace" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WORKSPACE_PAGES.map((page) => {
                const Icon = page.icon;
                return (
                  <Link
                    key={page.href}
                    to={page.href}
                    className="mb-card group flex flex-col gap-4 p-5 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", page.color)}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-foreground">{page.title}</p>
                      <p className="text-xs text-muted-foreground">{page.description}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      {page.stat}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section>
            <SectionHeader title="Tools" />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {TOOL_PAGES.map((page) => {
                const Icon = page.icon;
                return (
                  <Link
                    key={page.href}
                    to={page.href}
                    className="mb-card group flex items-center gap-4 p-4 transition-all hover:border-primary/50 hover:shadow-md"
                  >
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", page.color)}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{page.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{page.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                );
              })}

              <button
                onClick={() => handleSearch("Summarize recent BI activity")}
                className="mb-card group flex w-full items-center gap-4 p-4 text-left transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">AI Analysis</p>
                  <p className="truncate text-xs text-muted-foreground">Summarize current BI activity.</p>
                </div>
                <BarChart3 className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

