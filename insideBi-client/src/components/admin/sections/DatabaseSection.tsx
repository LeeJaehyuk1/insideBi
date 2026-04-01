
import * as React from "react";
import {
  Plus, Database, CheckCircle2, AlertCircle, RefreshCw,
  Table2, Trash2, Settings2, X, Eye, EyeOff, Clock, HardDrive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DATABASES, DB_TABLES } from "@/lib/db-catalog";

type DbType = "postgresql" | "mysql" | "oracle" | "mssql" | "sqlite";
type SyncSchedule = "manual" | "hourly" | "daily" | "weekly";
type ConnStatus = "connected" | "error" | "testing";

interface DbConn {
  id: string;
  name: string;
  type: DbType;
  host: string;
  port: number;
  database: string;
  username: string;
  status: ConnStatus;
  tableCount: number;
  lastSync: string;
  description?: string;
  syncSchedule?: SyncSchedule;
  cacheTtlHours?: number;
}

const SYNC_SCHEDULE_LABELS: Record<SyncSchedule, string> = {
  manual:  "수동",
  hourly:  "매시간",
  daily:   "매일",
  weekly:  "매주",
};

const DB_TYPE_LABELS: Record<DbType, string> = {
  postgresql: "PostgreSQL",
  mysql:      "MySQL",
  oracle:     "Oracle",
  mssql:      "SQL Server",
  sqlite:     "SQLite",
};

const DB_TYPE_COLORS: Record<DbType, string> = {
  postgresql: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  mysql:      "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  oracle:     "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  mssql:      "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  sqlite:     "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

const INITIAL_CONNS: DbConn[] = DATABASES.map((db, i) => ({
  id: db.id,
  name: db.label,
  type: "postgresql",
  host: db.id === "railway" ? "containers-us-west.railway.app" : "localhost",
  port: 5432,
  database: db.id,
  username: "postgres",
  status: "connected",
  tableCount: DB_TABLES[db.id]?.length ?? 0,
  lastSync: "2026-03-17T08:00:00Z",
  description: db.description,
}));

const LS_KEY = "insightbi_db_connections_v1";

function loadConns(): DbConn[] {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (s) return JSON.parse(s);
  } catch {}
  return INITIAL_CONNS;
}
function saveConns(d: DbConn[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {}
}

interface AddConnFormProps {
  onSave: (conn: DbConn) => void;
  onCancel: () => void;
}

function AddConnForm({ onSave, onCancel }: AddConnFormProps) {
  const [name, setName]       = React.useState("");
  const [type, setType]       = React.useState<DbType>("postgresql");
  const [host, setHost]       = React.useState("");
  const [port, setPort]       = React.useState("5432");
  const [db, setDb]           = React.useState("");
  const [user, setUser]       = React.useState("");
  const [pass, setPass]       = React.useState("");
  const [showPass, setShowPass] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<"ok" | "fail" | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setTestResult(host.trim() ? "ok" : "fail");
    setTesting(false);
  };

  const handleSave = () => {
    setSubmitted(true);
    if (!name.trim() || !host.trim() || !db.trim()) return;
    onSave({
      id: `conn-${Date.now()}`,
      name: name.trim(),
      type,
      host: host.trim(),
      port: parseInt(port) || 5432,
      database: db.trim(),
      username: user.trim(),
      status: testResult === "ok" ? "connected" : "error",
      tableCount: 0,
      lastSync: new Date().toISOString(),
    });
  };

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">새 데이터베이스 연결</h3>
        <button onClick={onCancel}><X className="h-4 w-4 text-muted-foreground" /></button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* 이름 */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">연결 이름 *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Production DB"
            className={cn("w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              submitted && !name.trim() ? "border-red-400" : "border-input bg-background")} />
        </div>

        {/* DB 타입 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">DB 종류</label>
          <select value={type} onChange={(e) => setType(e.target.value as DbType)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
            {(Object.keys(DB_TYPE_LABELS) as DbType[]).map((t) => (
              <option key={t} value={t}>{DB_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {/* 포트 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">포트</label>
          <input value={port} onChange={(e) => setPort(e.target.value)} placeholder="5432"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* 호스트 */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">호스트 *</label>
          <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="db.example.com"
            className={cn("w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              submitted && !host.trim() ? "border-red-400" : "border-input bg-background")} />
        </div>

        {/* 데이터베이스명 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">데이터베이스 *</label>
          <input value={db} onChange={(e) => setDb(e.target.value)} placeholder="mydb"
            className={cn("w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30",
              submitted && !db.trim() ? "border-red-400" : "border-input bg-background")} />
        </div>

        {/* 사용자명 */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">사용자명</label>
          <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="postgres"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>

        {/* 비밀번호 */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">비밀번호</label>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 연결 테스트 결과 */}
      {testResult && (
        <div className={cn("flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
          testResult === "ok"
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
            : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
        )}>
          {testResult === "ok"
            ? <><CheckCircle2 className="h-4 w-4" /> 연결 성공</>
            : <><AlertCircle className="h-4 w-4" /> 연결 실패 — 호스트를 확인하세요</>
          }
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", testing && "animate-spin")} />
          {testing ? "테스트 중..." : "연결 테스트"}
        </button>
        <div className="flex gap-2">
          <button onClick={onCancel} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">취소</button>
          <button onClick={handleSave} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">저장</button>
        </div>
      </div>
    </div>
  );
}

type DbSettingsTab = "tables" | "schedule" | "cache";

function DbSettingsPanel({ conn, onUpdate }: {
  conn: DbConn;
  onUpdate: (patch: Partial<DbConn>) => void;
}) {
  const [tab, setTab] = React.useState<DbSettingsTab>("tables");
  const schedule = conn.syncSchedule ?? "manual";
  const cacheTtl = conn.cacheTtlHours ?? 24;

  return (
    <div className="border-t border-border bg-muted/5">
      {/* 탭 헤더 */}
      <div className="flex border-b border-border">
        {([
          { id: "tables"   as DbSettingsTab, icon: Table2,    label: "테이블 목록" },
          { id: "schedule" as DbSettingsTab, icon: Clock,     label: "동기화 스케줄" },
          { id: "cache"    as DbSettingsTab, icon: HardDrive, label: "쿼리 캐시" },
        ]).map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold border-b-2 transition-colors",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* 테이블 목록 */}
      {tab === "tables" && (
        <div className="px-5 py-4">
          {DB_TABLES[conn.id] ? (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                테이블 목록 ({DB_TABLES[conn.id].length}개)
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {DB_TABLES[conn.id].map((t) => (
                  <div key={t.tableId} className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
                    <Table2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-foreground truncate">{t.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">테이블 정보가 없습니다. 동기화를 실행하세요.</p>
          )}
        </div>
      )}

      {/* 동기화 스케줄 */}
      {tab === "schedule" && (
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">자동 동기화 주기</p>
            <p className="text-xs text-muted-foreground mb-3">스키마 변경 사항을 자동으로 감지하여 업데이트합니다.</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(SYNC_SCHEDULE_LABELS) as SyncSchedule[]).map((s) => (
                <button key={s} onClick={() => onUpdate({ syncSchedule: s })}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    schedule === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}>
                  {SYNC_SCHEDULE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          {schedule !== "manual" && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-xs text-primary">
              <Clock className="h-3.5 w-3.5 inline mr-1.5" />
              {schedule === "hourly" && "매 정각에 동기화가 실행됩니다."}
              {schedule === "daily"  && "매일 오전 2:00에 동기화가 실행됩니다."}
              {schedule === "weekly" && "매주 월요일 오전 2:00에 동기화가 실행됩니다."}
            </div>
          )}
        </div>
      )}

      {/* 쿼리 캐시 */}
      {tab === "cache" && (
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">쿼리 결과 캐시 TTL</p>
            <p className="text-xs text-muted-foreground mb-3">
              이 DB에서 실행된 쿼리 결과를 얼마나 오래 캐시에 보관할지 설정합니다.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>1시간</span>
                <span className="text-sm font-bold text-foreground">{cacheTtl}시간</span>
                <span>72시간</span>
              </div>
              <input type="range" min={1} max={72} step={1} value={cacheTtl}
                onChange={(e) => onUpdate({ cacheTtlHours: parseInt(e.target.value) })}
                className="w-full accent-primary" />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1.5">
              {[1, 6, 24, 48].map((h) => (
                <button key={h} onClick={() => onUpdate({ cacheTtlHours: h })}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    cacheTtl === h
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}>
                  {h}시간
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
            <HardDrive className="h-3.5 w-3.5 inline mr-1.5" />
            캐시를 길게 설정하면 성능이 향상되지만 데이터 최신성이 낮아질 수 있습니다.
          </div>
        </div>
      )}
    </div>
  );
}

export function DatabaseSection() {
  const [conns, setConns] = React.useState<DbConn[]>([]);
  const [hydrated, setHydrated] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setConns(loadConns());
    setHydrated(true);
  }, []);

  const handleSync = async (id: string) => {
    setSyncingId(id);
    await new Promise((r) => setTimeout(r, 1500));
    setConns((prev) => {
      const next = prev.map((c) => c.id === id ? { ...c, lastSync: new Date().toISOString() } : c);
      saveConns(next);
      return next;
    });
    setSyncingId(null);
  };

  const handleDelete = (id: string) => {
    setConns((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveConns(next);
      return next;
    });
  };

  const handleAdd = (conn: DbConn) => {
    setConns((prev) => {
      const next = [...prev, conn];
      saveConns(next);
      return next;
    });
    setShowAdd(false);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">데이터베이스</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {conns.filter((c) => c.status === "connected").length}개 연결 · 전체 {conns.length}개
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          DB 추가
        </button>
      </div>

      {showAdd && (
        <AddConnForm onSave={handleAdd} onCancel={() => setShowAdd(false)} />
      )}

      {/* DB 카드 */}
      <div className="space-y-3">
        {conns.map((conn) => (
          <div key={conn.id} className="rounded-xl border border-border bg-background overflow-hidden">
            <div className="flex items-center gap-4 px-5 py-4">
              {/* 상태 도트 */}
              <div className={cn(
                "h-3 w-3 rounded-full shrink-0",
                conn.status === "connected" ? "bg-emerald-500" :
                conn.status === "testing"   ? "bg-yellow-400 animate-pulse" :
                "bg-red-500"
              )} />

              {/* 아이콘 */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                <Database className="h-5 w-5 text-muted-foreground" />
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{conn.name}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", DB_TYPE_COLORS[conn.type])}>
                    {DB_TYPE_LABELS[conn.type]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {conn.host}:{conn.port}/{conn.database}
                  {conn.description && ` — ${conn.description}`}
                </p>
              </div>

              {/* 메타 */}
              <div className="flex items-center gap-5 text-xs text-muted-foreground shrink-0">
                <span className="flex items-center gap-1.5">
                  <Table2 className="h-3.5 w-3.5" />
                  {conn.tableCount}개 테이블
                </span>
                <span>
                  동기화: {new Date(conn.lastSync).toLocaleDateString("ko-KR", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>

              {/* 액션 */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleSync(conn.id)}
                  disabled={syncingId === conn.id}
                  title="스키마 동기화"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={cn("h-4 w-4", syncingId === conn.id && "animate-spin")} />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === conn.id ? null : conn.id)}
                  title="설정"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(conn.id)}
                  title="삭제"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* 확장 패널 */}
            {expandedId === conn.id && (
              <DbSettingsPanel
                conn={conn}
                onUpdate={(patch) => {
                  setConns((prev) => {
                    const next = prev.map((c) => c.id === conn.id ? { ...c, ...patch } : c);
                    saveConns(next);
                    return next;
                  });
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
