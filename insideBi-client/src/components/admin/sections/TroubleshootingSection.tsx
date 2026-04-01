
import * as React from "react";
import {
  Terminal, Server, Download, Trash2, RefreshCw,
  CheckCircle2, AlertCircle, AlertTriangle, Info,
  ChevronDown, ChevronUp, Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── 타입 ── */
type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";
interface LogEntry {
  id: string;
  level: LogLevel;
  time: string;
  source: string;
  message: string;
}

/* ── Mock 로그 ── */
const MOCK_LOGS: LogEntry[] = [
  { id: "1",  level: "INFO",  time: "14:23:01", source: "NextServer",   message: "Server started on port 3001" },
  { id: "2",  level: "INFO",  time: "14:23:02", source: "DB",           message: "Connected to railway PostgreSQL (pool: 10)" },
  { id: "3",  level: "DEBUG", time: "14:23:15", source: "QueryEngine",  message: "Query executed: SELECT * FROM td_irncr LIMIT 1000 (45ms)" },
  { id: "4",  level: "INFO",  time: "14:24:03", source: "Auth",         message: "User '재혁 이' logged in successfully" },
  { id: "5",  level: "WARN",  time: "14:25:11", source: "Cache",        message: "Cache miss rate > 40% — consider increasing cache TTL" },
  { id: "6",  level: "DEBUG", time: "14:26:00", source: "QueryEngine",  message: "Query executed: SELECT sector, SUM(exposure) FROM td_irncr GROUP BY sector (12ms)" },
  { id: "7",  level: "ERROR", time: "14:27:44", source: "AI",           message: "Vanna.ai connection timeout after 30s — retrying..." },
  { id: "8",  level: "INFO",  time: "14:28:00", source: "AI",           message: "Vanna.ai reconnected successfully" },
  { id: "9",  level: "WARN",  time: "14:29:33", source: "DB",           message: "Slow query detected: td_irncr join took 2.3s" },
  { id: "10", level: "INFO",  time: "14:30:00", source: "Scheduler",    message: "Scheduled DB sync started for 'railway'" },
  { id: "11", level: "INFO",  time: "14:30:05", source: "Scheduler",    message: "Sync completed — 12 tables updated" },
  { id: "12", level: "ERROR", time: "14:31:22", source: "DB",           message: "Query failed: column 'td_ncr_amt' does not exist in td_irncr" },
  { id: "13", level: "DEBUG", time: "14:32:10", source: "NextServer",   message: "GET /api/db-columns 200 OK (8ms)" },
  { id: "14", level: "INFO",  time: "14:33:45", source: "Auth",         message: "User 'viewer' session expired — auto logout" },
  { id: "15", level: "WARN",  time: "14:34:50", source: "Memory",       message: "Heap usage at 78% — GC pressure increasing" },
];

const LEVEL_CONFIG: Record<LogLevel, { icon: React.ElementType; color: string; bg: string; badge: string }> = {
  INFO:  { icon: Info,          color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-950/30",   badge: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" },
  WARN:  { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", badge: "bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300" },
  ERROR: { icon: AlertCircle,   color: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-950/30",     badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" },
  DEBUG: { icon: Terminal,      color: "text-muted-foreground",              bg: "",                                  badge: "bg-muted text-muted-foreground" },
};

function Card({ icon: Icon, title, description, children, action }: {
  icon: React.ElementType; title: string; description?: string;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{title}</p>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ── 시스템 정보 ── */
function SystemInfoCard() {
  const [copied, setCopied] = React.useState(false);

  const info = [
    { label: "애플리케이션",    value: "InsightBi v0.1.0" },
    { label: "프레임워크",      value: "Next.js 14.2.35" },
    { label: "Node.js",         value: "v20.11.0" },
    { label: "운영체제",        value: typeof window !== "undefined" ? navigator.platform : "Windows 11" },
    { label: "브라우저",        value: typeof window !== "undefined" ? navigator.userAgent.split(" ").slice(-1)[0] : "-" },
    { label: "메모리 사용량",   value: "512 MB / 2 GB" },
    { label: "DB 연결 수",       value: "3 / 10 (pool)" },
    { label: "캐시 상태",        value: "활성 — 24h TTL" },
    { label: "AI 백엔드",        value: "Vanna 0.7.4 (Ollama)" },
    { label: "타임존",           value: "Asia/Seoul (UTC+9)" },
  ];

  const handleCopy = () => {
    const text = info.map((i) => `${i.label}: ${i.value}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      icon={Server}
      title="시스템 정보"
      description="현재 실행 환경 정보"
      action={
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "복사됨!" : "복사"}
        </button>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {info.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2.5">
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-xs font-medium text-foreground font-mono truncate ml-2 max-w-[180px]">{item.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ── 빠른 작업 ── */
function QuickActionsCard() {
  const [states, setStates] = React.useState<Record<string, "idle" | "loading" | "done">>({});

  const run = (key: string) => {
    setStates((p) => ({ ...p, [key]: "loading" }));
    setTimeout(() => {
      setStates((p) => ({ ...p, [key]: "done" }));
      setTimeout(() => setStates((p) => ({ ...p, [key]: "idle" })), 2000);
    }, 1200);
  };

  const actions = [
    { key: "cache",   label: "캐시 초기화",       desc: "모든 쿼리 캐시를 비웁니다",         icon: Trash2,      danger: false },
    { key: "sync",    label: "DB 강제 동기화",     desc: "모든 DB 스키마를 즉시 재동기화",    icon: RefreshCw,   danger: false },
    { key: "logs",    label: "로그 초기화",        desc: "서버 로그 버퍼를 비웁니다",          icon: Terminal,    danger: true  },
  ];

  return (
    <Card icon={RefreshCw} title="빠른 작업" description="시스템 유지관리 작업">
      <div className="space-y-2">
        {actions.map((a) => {
          const Icon = a.icon;
          const state = states[a.key] ?? "idle";
          return (
            <div key={a.key} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <Icon className={cn("h-4 w-4 shrink-0", a.danger ? "text-red-500" : "text-muted-foreground")} />
                <div>
                  <p className="text-sm font-medium text-foreground">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
              </div>
              <button
                onClick={() => run(a.key)}
                disabled={state === "loading"}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  state === "done"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : a.danger
                      ? "border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      : "border border-border text-foreground hover:bg-muted"
                )}
              >
                {state === "loading" && <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                {state === "done" && <CheckCircle2 className="h-3.5 w-3.5" />}
                {state === "idle" && <Icon className="h-3.5 w-3.5" />}
                {state === "loading" ? "처리 중..." : state === "done" ? "완료!" : "실행"}
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ── 진단 내보내기 ── */
function DiagnosticsCard() {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      const diag = {
        generatedAt: new Date().toISOString(),
        version: "0.1.0",
        framework: "Next.js 14.2.35",
        environment: "development",
        databases: ["railway (PostgreSQL)", "Sample DB (mock)"],
        features: { ai: true, collections: true, dashboards: true },
        settings: { locale: "ko", timezone: "Asia/Seoul" },
      };
      const blob = new Blob([JSON.stringify(diag, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `insightbi-diagnostics-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setDownloading(false);
    }, 800);
  };

  return (
    <Card icon={Download} title="진단 정보 내보내기" description="지원팀에 전달할 시스템 진단 파일">
      <div className="flex items-center justify-between rounded-lg bg-muted/40 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">진단 JSON 다운로드</p>
          <p className="text-xs text-muted-foreground">시스템 설정, 버전 정보, 연결 상태를 포함합니다</p>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {downloading
            ? <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Download className="h-3.5 w-3.5" />
          }
          {downloading ? "생성 중..." : "다운로드"}
        </button>
      </div>
    </Card>
  );
}

/* ── 로그 뷰어 ── */
function LogViewerCard() {
  const [filter, setFilter] = React.useState<LogLevel | "ALL">("ALL");
  const [search, setSearch] = React.useState("");
  const [autoScroll, setAutoScroll] = React.useState(true);
  const [logs, setLogs] = React.useState(MOCK_LOGS);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const filtered = logs.filter((l) => {
    if (filter !== "ALL" && l.level !== filter) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) && !l.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { INFO: 0, WARN: 0, ERROR: 0, DEBUG: 0 };
  logs.forEach((l) => counts[l.level]++);

  React.useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [filtered.length, autoScroll]);

  return (
    <Card
      icon={Terminal}
      title="서버 로그"
      description={`총 ${logs.length}개 — ERROR ${counts.ERROR} · WARN ${counts.WARN}`}
      action={
        <button
          onClick={() => setLogs([])}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-red-500 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />초기화
        </button>
      }
    >
      {/* 필터 + 검색 */}
      <div className="flex items-center gap-2 mb-3">
        {(["ALL", "INFO", "WARN", "ERROR", "DEBUG"] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => setFilter(lv)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              filter === lv
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {lv}
            {lv !== "ALL" && <span className="ml-1 opacity-60">{counts[lv]}</span>}
          </button>
        ))}
        <div className="relative ml-auto">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="검색..."
            className="w-40 rounded-lg border border-input bg-background pl-3 pr-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* 로그 리스트 */}
      <div className="h-72 overflow-y-auto rounded-lg border border-border bg-gray-950 font-mono text-xs">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground/50 text-xs">
            로그 없음
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {filtered.map((log) => {
              const cfg = LEVEL_CONFIG[log.level];
              const Icon = cfg.icon;
              return (
                <div key={log.id} className={cn("flex items-start gap-2 rounded px-2 py-1", log.level === "ERROR" ? "bg-red-950/40" : log.level === "WARN" ? "bg-amber-950/30" : "")}>
                  <span className="text-gray-500 shrink-0 w-16">{log.time}</span>
                  <span className={cn("shrink-0 w-12 font-bold text-[10px]", cfg.color)}>{log.level}</span>
                  <span className="text-gray-400 shrink-0 w-24 truncate">[{log.source}]</span>
                  <span className={cn("flex-1", log.level === "ERROR" ? "text-red-300" : log.level === "WARN" ? "text-amber-300" : "text-gray-300")}>
                    {log.message}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>{filtered.length}개 표시 중</span>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="accent-primary" />
          자동 스크롤
        </label>
      </div>
    </Card>
  );
}

/* ══════════════════════════════════════════════════════ */
export function TroubleshootingSection() {
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-foreground">문제해결</h2>
        <p className="text-xs text-muted-foreground mt-0.5">시스템 로그, 상태 확인, 진단 도구</p>
      </div>

      <SystemInfoCard />
      <QuickActionsCard />
      <LogViewerCard />
      <DiagnosticsCard />
    </div>
  );
}
