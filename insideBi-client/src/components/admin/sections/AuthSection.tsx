
import * as React from "react";
import {
  KeyRound, Shield, Lock, Eye, EyeOff, CheckCircle2,
  AlertCircle, ChevronDown, ChevronUp, Save, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── 공통 토글 ── */
function Toggle({ value, onChange, label, description }: {
  value: boolean; onChange: (v: boolean) => void; label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
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

/* ── 카드 래퍼 ── */
function Card({ icon: Icon, title, description, children, accent }: {
  icon: React.ElementType; title: string; description?: string;
  children: React.ReactNode; accent?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className={cn("flex items-center gap-3 px-5 py-4 border-b border-border", accent ?? "bg-muted/20")}>
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

/* ── 인풋 필드 ── */
function Field({ label, value, onChange, placeholder, type = "text", disabled }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={type === "password" ? (show ? "text" : "password") : type}
          value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {type === "password" && (
          <button onClick={() => setShow((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════ */

const LS_KEY = "insightbi_auth_settings_v1";

interface AuthSettings {
  googleSsoEnabled: boolean;
  googleClientId: string;
  googleClientSecret: string;
  ldapEnabled: boolean;
  ldapHost: string;
  ldapPort: string;
  ldapDn: string;
  ldapBindUser: string;
  ldapBindPw: string;
  pwMinLength: number;
  pwRequireUpper: boolean;
  pwRequireNumber: boolean;
  pwRequireSpecial: boolean;
  twoFaEnabled: boolean;
  sessionMaxDays: number;
}

const DEFAULTS: AuthSettings = {
  googleSsoEnabled: false,
  googleClientId: "",
  googleClientSecret: "",
  ldapEnabled: false,
  ldapHost: "",
  ldapPort: "389",
  ldapDn: "dc=example,dc=com",
  ldapBindUser: "",
  ldapBindPw: "",
  pwMinLength: 8,
  pwRequireUpper: true,
  pwRequireNumber: true,
  pwRequireSpecial: false,
  twoFaEnabled: false,
  sessionMaxDays: 30,
};

function load(): AuthSettings {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (s) return { ...DEFAULTS, ...JSON.parse(s) };
  } catch {}
  return { ...DEFAULTS };
}

export function AuthSection() {
  const [s, setS] = React.useState<AuthSettings>(DEFAULTS);
  const [saved, setSaved] = React.useState(false);
  const [ldapTesting, setLdapTesting] = React.useState(false);
  const [ldapResult, setLdapResult] = React.useState<"ok" | "fail" | null>(null);

  React.useEffect(() => { setS(load()); }, []);

  const set = <K extends keyof AuthSettings>(k: K, v: AuthSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testLdap = async () => {
    setLdapTesting(true);
    setLdapResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setLdapResult(s.ldapHost ? "ok" : "fail");
    setLdapTesting(false);
  };

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── 상단 액션 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">인증 설정</h2>
          <p className="text-xs text-muted-foreground mt-0.5">로그인 방식 및 보안 정책을 관리합니다</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setS(DEFAULTS)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />초기화
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors",
              saved
                ? "bg-emerald-500 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Save className="h-3.5 w-3.5" />
            {saved ? "저장됨!" : "저장"}
          </button>
        </div>
      </div>

      {/* ── Google SSO ── */}
      <Card icon={KeyRound} title="Google Single Sign-On" description="Google 계정으로 로그인 허용">
        <Toggle
          value={s.googleSsoEnabled}
          onChange={(v) => set("googleSsoEnabled", v)}
          label="Google SSO 활성화"
          description="사용자가 Google 계정으로 로그인할 수 있습니다"
        />
        {s.googleSsoEnabled && (
          <div className="mt-4 space-y-3 pt-4 border-t border-border">
            <Field
              label="Client ID"
              value={s.googleClientId}
              onChange={(v) => set("googleClientId", v)}
              placeholder="123456789-abc.apps.googleusercontent.com"
            />
            <Field
              label="Client Secret"
              value={s.googleClientSecret}
              onChange={(v) => set("googleClientSecret", v)}
              placeholder="GOCSPX-..."
              type="password"
            />
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300">
              Google Cloud Console에서 승인된 리디렉션 URI: <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">http://localhost:3001/auth/callback/google</code>
            </div>
          </div>
        )}
      </Card>

      {/* ── LDAP ── */}
      <Card icon={Shield} title="LDAP / Active Directory" description="엔터프라이즈 디렉터리 서비스 연동">
        <Toggle
          value={s.ldapEnabled}
          onChange={(v) => set("ldapEnabled", v)}
          label="LDAP 인증 활성화"
          description="조직 디렉터리 서비스로 인증합니다"
        />
        {s.ldapEnabled && (
          <div className="mt-4 space-y-3 pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Field label="LDAP 호스트" value={s.ldapHost} onChange={(v) => set("ldapHost", v)} placeholder="ldap.example.com" />
              </div>
              <Field label="포트" value={s.ldapPort} onChange={(v) => set("ldapPort", v)} placeholder="389" />
            </div>
            <Field label="Base DN" value={s.ldapDn} onChange={(v) => set("ldapDn", v)} placeholder="dc=example,dc=com" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="바인딩 사용자" value={s.ldapBindUser} onChange={(v) => set("ldapBindUser", v)} placeholder="cn=admin,dc=example,dc=com" />
              <Field label="바인딩 비밀번호" value={s.ldapBindPw} onChange={(v) => set("ldapBindPw", v)} type="password" placeholder="••••••••" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={testLdap}
                disabled={ldapTesting}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {ldapTesting ? (
                  <span className="h-3.5 w-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Shield className="h-3.5 w-3.5" />
                )}
                연결 테스트
              </button>
              {ldapResult === "ok" && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />연결 성공
                </span>
              )}
              {ldapResult === "fail" && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />연결 실패 — 호스트를 확인하세요
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── 비밀번호 정책 ── */}
      <Card icon={Lock} title="비밀번호 정책" description="로컬 계정 비밀번호 복잡도 규칙">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">최소 길이</p>
              <p className="text-xs text-muted-foreground">최소 {s.pwMinLength}자</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => set("pwMinLength", Math.max(6, s.pwMinLength - 1))}
                className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-sm hover:bg-muted"
              >−</button>
              <span className="w-8 text-center text-sm font-bold">{s.pwMinLength}</span>
              <button
                onClick={() => set("pwMinLength", Math.min(32, s.pwMinLength + 1))}
                className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-sm hover:bg-muted"
              >+</button>
            </div>
          </div>
          {([
            ["pwRequireUpper",   "대문자 포함 필수",  "A-Z 중 하나 이상"],
            ["pwRequireNumber",  "숫자 포함 필수",    "0-9 중 하나 이상"],
            ["pwRequireSpecial", "특수문자 포함 필수", "!@#$%^&* 중 하나 이상"],
          ] as [keyof AuthSettings, string, string][]).map(([key, label, desc]) => (
            <Toggle key={key} value={s[key] as boolean} onChange={(v) => set(key, v)} label={label} description={desc} />
          ))}
        </div>
      </Card>

      {/* ── 세션 & 2FA ── */}
      <Card icon={Shield} title="세션 & 2단계 인증" description="보안 세션 정책">
        <div className="space-y-2">
          <div className="flex items-center justify-between py-3.5 border-b border-border">
            <div>
              <p className="text-sm font-medium text-foreground">세션 유지 기간</p>
              <p className="text-xs text-muted-foreground">{s.sessionMaxDays}일 후 자동 로그아웃</p>
            </div>
            <input
              type="range" min={1} max={90} step={1}
              value={s.sessionMaxDays}
              onChange={(e) => set("sessionMaxDays", Number(e.target.value))}
              className="w-28 accent-primary"
            />
          </div>
          <Toggle
            value={s.twoFaEnabled}
            onChange={(v) => set("twoFaEnabled", v)}
            label="2단계 인증 (2FA)"
            description="TOTP 앱으로 추가 보안 레이어 적용 (로그인 시 코드 요구)"
          />
        </div>
      </Card>
    </div>
  );
}
