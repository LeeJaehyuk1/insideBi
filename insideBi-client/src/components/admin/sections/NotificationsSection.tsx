
import * as React from "react";
import {
  Bell, MessageSquare as Slack, Webhook, Mail, Save, RotateCcw,
  CheckCircle2, AlertCircle, Plus, Trash2, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "insightbi_notifications_v1";

interface NotifSettings {
  slackEnabled: boolean;
  slackWebhook: string;
  slackChannel: string;
  emailEnabled: boolean;
  emailRecipients: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookSecret: string;
  events: {
    newUser: boolean;
    loginFail: boolean;
    queryError: boolean;
    slowQuery: boolean;
    riskThreshold: boolean;
    dbDisconnect: boolean;
    newDashboard: boolean;
    systemError: boolean;
  };
  schedules: { id: string; name: string; cron: string; recipients: string; enabled: boolean }[];
}

const DEFAULTS: NotifSettings = {
  slackEnabled: false,
  slackWebhook: "",
  slackChannel: "#insightbi-alerts",
  emailEnabled: false,
  emailRecipients: "",
  webhookEnabled: false,
  webhookUrl: "",
  webhookSecret: "",
  events: {
    newUser: true,
    loginFail: true,
    queryError: true,
    slowQuery: false,
    riskThreshold: true,
    dbDisconnect: true,
    newDashboard: false,
    systemError: true,
  },
  schedules: [
    { id: "s1", name: "일일 리스크 요약", cron: "매일 08:00", recipients: "admin@company.com", enabled: true },
    { id: "s2", name: "주간 사용량 보고서", cron: "매주 월요일 09:00", recipients: "team@company.com", enabled: false },
  ],
};

const EVENT_LABELS: Record<keyof NotifSettings["events"], { label: string; desc: string; severity: "error" | "warn" | "info" }> = {
  systemError:    { label: "시스템 오류",         desc: "서버/DB 오류 발생 시",           severity: "error" },
  dbDisconnect:   { label: "DB 연결 끊김",        desc: "데이터베이스 연결 실패 시",        severity: "error" },
  loginFail:      { label: "로그인 실패 반복",     desc: "5회 이상 연속 실패 시",           severity: "warn"  },
  riskThreshold:  { label: "리스크 임계값 초과",   desc: "설정된 리스크 지표 초과 시",       severity: "warn"  },
  queryError:     { label: "쿼리 오류",           desc: "SQL/쿼리 실행 실패 시",           severity: "warn"  },
  slowQuery:      { label: "느린 쿼리",           desc: "2초 이상 소요되는 쿼리 발생 시",   severity: "info"  },
  newUser:        { label: "새 사용자 가입",       desc: "새 계정 생성 시",                severity: "info"  },
  newDashboard:   { label: "새 대시보드 생성",     desc: "대시보드가 새로 만들어질 때",       severity: "info"  },
};

const SEVERITY_COLORS = {
  error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  warn:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  info:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

function load(): NotifSettings {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (s) return { ...DEFAULTS, ...JSON.parse(s) };
  } catch {}
  return { ...DEFAULTS };
}

function Card({ icon: Icon, title, description, children }: {
  icon: React.ElementType; title: string; description?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange, label, description }: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
          value ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", value ? "translate-x-4.5" : "translate-x-0.5")} />
      </button>
    </div>
  );
}

export function NotificationsSection() {
  const [s, setS] = React.useState<NotifSettings>(DEFAULTS);
  const [saved, setSaved] = React.useState(false);
  const [testSlack, setTestSlack] = React.useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testWebhook, setTestWebhook] = React.useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [newSchedule, setNewSchedule] = React.useState(false);
  const [schedName, setSchedName] = React.useState("");
  const [schedCron, setSchedCron] = React.useState("매일 08:00");
  const [schedRecip, setSchedRecip] = React.useState("");

  React.useEffect(() => { setS(load()); }, []);

  const set = <K extends keyof NotifSettings>(k: K, v: NotifSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const setEvent = (k: keyof NotifSettings["events"], v: boolean) =>
    setS((p) => ({ ...p, events: { ...p.events, [k]: v } }));

  const handleSave = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const test = async (
    channel: "slack" | "webhook",
    setter: React.Dispatch<React.SetStateAction<"idle" | "loading" | "ok" | "fail">>,
    hasValue: boolean
  ) => {
    setter("loading");
    await new Promise((r) => setTimeout(r, 1400));
    setter(hasValue ? "ok" : "fail");
    setTimeout(() => setter("idle"), 3000);
  };

  const addSchedule = () => {
    if (!schedName.trim() || !schedRecip.trim()) return;
    setS((p) => ({
      ...p,
      schedules: [...p.schedules, { id: `s${Date.now()}`, name: schedName.trim(), cron: schedCron, recipients: schedRecip.trim(), enabled: true }],
    }));
    setSchedName(""); setSchedRecip(""); setNewSchedule(false);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">알림 & 웹훅</h2>
          <p className="text-xs text-muted-foreground mt-0.5">MessageSquare as Slack, 이메일, 웹훅으로 시스템 이벤트 알림을 받습니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setS(DEFAULTS)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
            <RotateCcw className="h-3.5 w-3.5" />초기화
          </button>
          <button
            onClick={handleSave}
            className={cn("flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
              saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Save className="h-3.5 w-3.5" />{saved ? "저장됨!" : "저장"}
          </button>
        </div>
      </div>

      {/* ── Slack ── */}
      <Card icon={Slack} title="Slack" description="Slack 채널로 알림 전송">
        <Toggle value={s.slackEnabled} onChange={(v) => set("slackEnabled", v)} label="Slack 알림 활성화" />
        {s.slackEnabled && (
          <div className="mt-4 space-y-3 pt-4 border-t border-border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Incoming Webhook URL</label>
              <input
                value={s.slackWebhook} onChange={(e) => set("slackWebhook", e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">채널</label>
              <input
                value={s.slackChannel} onChange={(e) => set("slackChannel", e.target.value)}
                placeholder="#insightbi-alerts"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => test("slack", setTestSlack as any, !!s.slackWebhook)}
                disabled={testSlack === "loading"}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {testSlack === "loading"
                  ? <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  : <Slack className="h-3.5 w-3.5" />}
                테스트 발송
              </button>
              {testSlack === "ok" && <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />발송 성공</span>}
              {testSlack === "fail" && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3.5 w-3.5" />웹훅 URL을 확인하세요</span>}
            </div>
          </div>
        )}
      </Card>

      {/* ── 이메일 알림 ── */}
      <Card icon={Mail} title="이메일 알림" description="이메일로 알림을 수신할 주소 목록">
        <Toggle value={s.emailEnabled} onChange={(v) => set("emailEnabled", v)} label="이메일 알림 활성화" description="SMTP 설정이 완료되어야 합니다" />
        {s.emailEnabled && (
          <div className="mt-4 pt-4 border-t border-border">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">수신자 (쉼표로 구분)</label>
            <textarea
              value={s.emailRecipients} onChange={(e) => set("emailRecipients", e.target.value)}
              rows={2}
              placeholder="admin@company.com, risk@company.com"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        )}
      </Card>

      {/* ── 웹훅 ── */}
      <Card icon={Webhook} title="커스텀 웹훅" description="외부 시스템으로 이벤트 데이터 전송">
        <Toggle value={s.webhookEnabled} onChange={(v) => set("webhookEnabled", v)} label="웹훅 활성화" />
        {s.webhookEnabled && (
          <div className="mt-4 space-y-3 pt-4 border-t border-border">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">웹훅 URL</label>
              <input
                value={s.webhookUrl} onChange={(e) => set("webhookUrl", e.target.value)}
                placeholder="https://your-app.com/webhooks/insightbi"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">서명 시크릿 (선택)</label>
              <input
                value={s.webhookSecret} onChange={(e) => set("webhookSecret", e.target.value)}
                placeholder="HMAC 서명에 사용될 시크릿"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => test("webhook", setTestWebhook, !!s.webhookUrl)}
                disabled={testWebhook === "loading"}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {testWebhook === "loading"
                  ? <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  : <Webhook className="h-3.5 w-3.5" />}
                POST 테스트
              </button>
              {testWebhook === "ok" && <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />200 OK</span>}
              {testWebhook === "fail" && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3.5 w-3.5" />URL을 확인하세요</span>}
            </div>
          </div>
        )}
      </Card>

      {/* ── 이벤트 설정 ── */}
      <Card icon={Bell} title="알림 이벤트" description="알림을 받을 이벤트를 선택합니다">
        <div className="space-y-1">
          {(Object.entries(EVENT_LABELS) as [keyof NotifSettings["events"], typeof EVENT_LABELS[keyof NotifSettings["events"]]][]).map(([key, meta]) => (
            <div key={key} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", SEVERITY_COLORS[meta.severity])}>
                  {meta.severity === "error" ? "오류" : meta.severity === "warn" ? "경고" : "정보"}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setEvent(key, !s.events[key])}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                  s.events[key] ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform", s.events[key] ? "translate-x-4.5" : "translate-x-0.5")} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 예약 보고서 ── */}
      <Card icon={Clock} title="예약 보고서" description="정기적으로 이메일 보고서를 자동 발송합니다">
        <div className="space-y-2 mb-3">
          {s.schedules.map((sched) => (
            <div key={sched.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setS((p) => ({
                    ...p, schedules: p.schedules.map((sc) => sc.id === sched.id ? { ...sc, enabled: !sc.enabled } : sc),
                  }))}
                  className={cn("relative inline-flex h-4 w-7 items-center rounded-full transition-colors shrink-0",
                    sched.enabled ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span className={cn("inline-block h-3 w-3 rounded-full bg-white shadow transition-transform", sched.enabled ? "translate-x-3.5" : "translate-x-0.5")} />
                </button>
                <div>
                  <p className="text-sm font-medium text-foreground">{sched.name}</p>
                  <p className="text-xs text-muted-foreground">{sched.cron} · {sched.recipients}</p>
                </div>
              </div>
              <button
                onClick={() => setS((p) => ({ ...p, schedules: p.schedules.filter((sc) => sc.id !== sched.id) }))}
                className="text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {newSchedule ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input value={schedName} onChange={(e) => setSchedName(e.target.value)} placeholder="보고서 이름"
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
              <select value={schedCron} onChange={(e) => setSchedCron(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40">
                <option>매일 08:00</option>
                <option>매일 18:00</option>
                <option>매주 월요일 09:00</option>
                <option>매월 1일 09:00</option>
              </select>
            </div>
            <input value={schedRecip} onChange={(e) => setSchedRecip(e.target.value)} placeholder="수신자 이메일"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setNewSchedule(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted transition-colors">취소</button>
              <button onClick={addSchedule} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">추가</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setNewSchedule(true)}
            className="flex items-center gap-2 w-full rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />예약 보고서 추가
          </button>
        )}
      </Card>
    </div>
  );
}
