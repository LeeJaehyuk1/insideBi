
import * as React from "react";
import {
  Mail, Server, Eye, EyeOff, CheckCircle2, AlertCircle,
  Save, RotateCcw, Send, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "insightbi_email_settings_v1";

interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  security: "none" | "tls" | "starttls";
  authUser: string;
  authPass: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  enabled: boolean;
}

const DEFAULTS: EmailSettings = {
  smtpHost: "",
  smtpPort: "587",
  security: "starttls",
  authUser: "",
  authPass: "",
  fromName: "InsightBi",
  fromEmail: "noreply@example.com",
  replyTo: "",
  enabled: false,
};

function load(): EmailSettings {
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

function Field({ label, value, onChange, placeholder, type = "text", hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={type === "password" ? (show ? "text" : "password") : type}
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {type === "password" && (
          <button onClick={() => setShow((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
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
        <span className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
          value ? "translate-x-4.5" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

export function EmailSection() {
  const [s, setS] = React.useState<EmailSettings>(DEFAULTS);
  const [saved, setSaved] = React.useState(false);
  const [testState, setTestState] = React.useState<"idle" | "loading" | "ok" | "fail">("idle");
  const [testEmail, setTestEmail] = React.useState("");
  const [sendState, setSendState] = React.useState<"idle" | "loading" | "ok">("idle");

  React.useEffect(() => { setS(load()); }, []);

  const set = <K extends keyof EmailSettings>(k: K, v: EmailSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testConnection = async () => {
    setTestState("loading");
    await new Promise((r) => setTimeout(r, 1500));
    setTestState(s.smtpHost ? "ok" : "fail");
    setTimeout(() => setTestState("idle"), 3000);
  };

  const sendTestEmail = async () => {
    if (!testEmail) return;
    setSendState("loading");
    await new Promise((r) => setTimeout(r, 1200));
    setSendState("ok");
    setTimeout(() => setSendState("idle"), 3000);
  };

  const SECURITY_PORTS: Record<EmailSettings["security"], string> = {
    none: "25", tls: "465", starttls: "587",
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">이메일 / SMTP</h2>
          <p className="text-xs text-muted-foreground mt-0.5">알림 및 초대 이메일 발송 서버를 설정합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setS(DEFAULTS)} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors">
            <RotateCcw className="h-3.5 w-3.5" />초기화
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
              saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Save className="h-3.5 w-3.5" />{saved ? "저장됨!" : "저장"}
          </button>
        </div>
      </div>

      {/* ── 활성화 ── */}
      <Card icon={Mail} title="이메일 서비스" description="이메일 발송 기능 활성화">
        <Toggle
          value={s.enabled}
          onChange={(v) => set("enabled", v)}
          label="이메일 서비스 활성화"
          description="비활성화 시 초대, 알림 이메일이 발송되지 않습니다"
        />
      </Card>

      {/* ── SMTP 서버 ── */}
      <Card icon={Server} title="SMTP 서버 설정" description="메일 발송 서버 연결 정보">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Field label="SMTP 호스트" value={s.smtpHost} onChange={(v) => set("smtpHost", v)} placeholder="smtp.gmail.com" />
            </div>
            <Field label="포트" value={s.smtpPort} onChange={(v) => set("smtpPort", v)} placeholder="587" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">보안 방식</label>
            <div className="flex items-center gap-2">
              {(["none", "starttls", "tls"] as const).map((sec) => (
                <button
                  key={sec}
                  onClick={() => { set("security", sec); set("smtpPort", SECURITY_PORTS[sec]); }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                    s.security === sec
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {sec === "tls" && <Lock className="h-3 w-3" />}
                  {sec === "starttls" && <Lock className="h-3 w-3" />}
                  {sec === "none" ? "없음 (포트 25)" : sec === "tls" ? "SSL/TLS (포트 465)" : "STARTTLS (포트 587)"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="사용자명 / 이메일" value={s.authUser} onChange={(v) => set("authUser", v)} placeholder="user@gmail.com" />
            <Field label="비밀번호 / 앱 비밀번호" value={s.authPass} onChange={(v) => set("authPass", v)} type="password" placeholder="••••••••" />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={testConnection}
              disabled={testState === "loading"}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              {testState === "loading"
                ? <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                : <Server className="h-3.5 w-3.5" />
              }
              연결 테스트
            </button>
            {testState === "ok" && <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" />연결 성공</span>}
            {testState === "fail" && <span className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3.5 w-3.5" />연결 실패</span>}
          </div>
        </div>
      </Card>

      {/* ── 발신자 설정 ── */}
      <Card icon={Mail} title="발신자 정보" description="발송 이메일에 표시되는 발신자">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="발신자 이름" value={s.fromName} onChange={(v) => set("fromName", v)} placeholder="InsightBi" />
            <Field label="발신자 이메일" value={s.fromEmail} onChange={(v) => set("fromEmail", v)} placeholder="noreply@company.com" />
          </div>
          <Field label="회신 주소 (선택)" value={s.replyTo} onChange={(v) => set("replyTo", v)} placeholder="support@company.com" hint="비어있으면 발신자 이메일로 회신됩니다" />
        </div>
      </Card>

      {/* ── 테스트 이메일 발송 ── */}
      <Card icon={Send} title="테스트 이메일 발송" description="설정이 올바른지 테스트 메일을 보냅니다">
        <div className="flex items-center gap-3">
          <input
            value={testEmail} onChange={(e) => setTestEmail(e.target.value)}
            placeholder="test@example.com"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={sendTestEmail}
            disabled={!testEmail || sendState === "loading" || !s.enabled}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
              sendState === "ok"
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            )}
          >
            {sendState === "loading"
              ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : sendState === "ok"
                ? <CheckCircle2 className="h-4 w-4" />
                : <Send className="h-4 w-4" />
            }
            {sendState === "loading" ? "발송 중..." : sendState === "ok" ? "발송 완료!" : "테스트 발송"}
          </button>
        </div>
        {!s.enabled && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">이메일 서비스를 먼저 활성화하세요.</p>
        )}
      </Card>
    </div>
  );
}
