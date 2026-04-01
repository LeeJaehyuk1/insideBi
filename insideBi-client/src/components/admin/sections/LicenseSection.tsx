
import * as React from "react";
import {
  Award, CheckCircle2, XCircle, Sparkles, ArrowRight,
  Copy, Check, RefreshCw, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "insightbi_license_v1";

interface LicenseState {
  key: string;
  plan: "free" | "pro" | "enterprise";
  activatedAt: string;
  expiresAt: string;
  seats: number;
}

const STORED_LICENSE = (): LicenseState => {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (s) return JSON.parse(s);
  } catch {}
  return { key: "", plan: "free", activatedAt: "", expiresAt: "", seats: 5 };
};

const FEATURES = [
  { label: "사용자 계정",                free: "5명",          pro: "무제한",      enterprise: "무제한"    },
  { label: "대시보드",                   free: "10개",         pro: "무제한",      enterprise: "무제한"    },
  { label: "저장 질문",                  free: "20개",         pro: "무제한",      enterprise: "무제한"    },
  { label: "DB 연결",                    free: "2개",          pro: "무제한",      enterprise: "무제한"    },
  { label: "AI (Vanna.ai)",             free: "기본",         pro: "고급",        enterprise: "전용 모델" },
  { label: "공개 링크 공유",             free: false,          pro: true,          enterprise: true        },
  { label: "외부 임베딩",               free: false,          pro: true,          enterprise: true        },
  { label: "감사 로그",                  free: "7일",          pro: "1년",         enterprise: "무제한"    },
  { label: "SSO (Google/LDAP)",         free: false,          pro: true,          enterprise: true        },
  { label: "SAML / JWT SSO",           free: false,          pro: false,         enterprise: true        },
  { label: "커스텀 외관",               free: false,          pro: true,          enterprise: true        },
  { label: "SLA 지원",                  free: "커뮤니티",      pro: "이메일",      enterprise: "전담 매니저" },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />;
  if (value === false) return <XCircle className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs text-foreground font-medium">{value}</span>;
}

export function LicenseSection() {
  const [lic, setLic] = React.useState<LicenseState>({ key: "", plan: "free", activatedAt: "", expiresAt: "", seats: 5 });
  const [keyInput, setKeyInput] = React.useState("");
  const [activating, setActivating] = React.useState(false);
  const [activateResult, setActivateResult] = React.useState<"ok" | "fail" | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => { setLic(STORED_LICENSE()); }, []);

  const handleActivate = async () => {
    if (!keyInput.trim()) return;
    setActivating(true);
    setActivateResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    // 시뮬레이션: "PRO-" 로 시작하면 pro, "ENT-" 면 enterprise
    const upper = keyInput.trim().toUpperCase();
    let plan: LicenseState["plan"] = "free";
    if (upper.startsWith("PRO-")) plan = "pro";
    else if (upper.startsWith("ENT-")) plan = "enterprise";
    else { setActivateResult("fail"); setActivating(false); return; }

    const newLic: LicenseState = {
      key: keyInput.trim(),
      plan,
      activatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      seats: plan === "pro" ? 50 : 999,
    };
    try { localStorage.setItem(LS_KEY, JSON.stringify(newLic)); } catch {}
    setLic(newLic);
    setActivateResult("ok");
    setActivating(false);
    setKeyInput("");
  };

  const handleRevoke = () => {
    const reset: LicenseState = { key: "", plan: "free", activatedAt: "", expiresAt: "", seats: 5 };
    try { localStorage.setItem(LS_KEY, JSON.stringify(reset)); } catch {}
    setLic(reset);
    setActivateResult(null);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(lic.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PLAN_CONFIG = {
    free: { label: "Free",       color: "bg-muted text-muted-foreground",                            badge: "bg-muted text-muted-foreground" },
    pro:  { label: "Pro",        color: "bg-primary/10 text-primary border border-primary/30",        badge: "bg-primary text-primary-foreground" },
    enterprise: { label: "Enterprise", color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800", badge: "bg-amber-500 text-white" },
  };

  const cfg = PLAN_CONFIG[lic.plan];

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-base font-bold text-foreground">라이선스</h2>
        <p className="text-xs text-muted-foreground mt-0.5">현재 플랜과 사용 가능한 기능을 확인합니다</p>
      </div>

      {/* ── 현재 플랜 카드 ── */}
      <div className={cn("rounded-xl border p-6", cfg.color)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", lic.plan === "free" ? "bg-muted" : "bg-white/20")}>
              {lic.plan === "free"
                ? <Award className="h-6 w-6 text-muted-foreground" />
                : lic.plan === "pro"
                  ? <Sparkles className="h-6 w-6 text-primary" />
                  : <ShieldCheck className="h-6 w-6 text-amber-600" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{cfg.label}</h3>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", cfg.badge)}>현재 플랜</span>
              </div>
              {lic.plan === "free"
                ? <p className="text-sm opacity-70 mt-0.5">기본 기능 사용 중 · 5명 사용자 한도</p>
                : (
                  <div className="text-sm opacity-80 mt-0.5 space-y-0.5">
                    <p>최대 {lic.seats}명 사용자</p>
                    {lic.expiresAt && <p>만료: {new Date(lic.expiresAt).toLocaleDateString("ko-KR")}</p>}
                  </div>
                )
              }
            </div>
          </div>

          {lic.plan !== "free" && (
            <div className="flex items-center gap-2">
              <button onClick={copyKey} className="flex items-center gap-1.5 rounded-lg border border-current/20 bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20 transition-colors">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "복사됨" : "키 복사"}
              </button>
              <button onClick={handleRevoke} className="flex items-center gap-1.5 rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-500/20 transition-colors">
                <RefreshCw className="h-3.5 w-3.5" />초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 라이선스 키 활성화 ── */}
      {lic.plan === "free" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div>
            <p className="text-sm font-bold text-foreground mb-0.5">라이선스 키 활성화</p>
            <p className="text-xs text-muted-foreground">구매한 라이선스 키를 입력하여 Pro / Enterprise 기능을 활성화하세요</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={keyInput} onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              placeholder="PRO-XXXX-XXXX-XXXX 또는 ENT-XXXX-XXXX"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleActivate}
              disabled={!keyInput.trim() || activating}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {activating ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              활성화
            </button>
          </div>
          {activateResult === "fail" && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5" />유효하지 않은 키입니다. PRO- 또는 ENT- 로 시작하는 키를 입력하세요.
            </p>
          )}
          {activateResult === "ok" && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />라이선스가 활성화되었습니다!
            </p>
          )}
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            테스트용: <code className="font-mono bg-muted px-1 rounded">PRO-TEST-1234-5678</code> 또는 <code className="font-mono bg-muted px-1 rounded">ENT-TEST-1234-5678</code>
          </div>
        </div>
      )}

      {/* ── 플랜 비교 ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
          <Award className="h-4 w-4 text-primary" />
          <p className="text-sm font-bold text-foreground">플랜 기능 비교</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/10">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">기능</th>
                {(["free", "pro", "enterprise"] as const).map((plan) => (
                  <th key={plan} className={cn("px-4 py-3 text-center text-xs font-bold w-28",
                    lic.plan === plan ? "text-primary" : "text-muted-foreground"
                  )}>
                    <div className="flex flex-col items-center gap-1">
                      {plan === "free" ? "Free" : plan === "pro" ? "Pro" : "Enterprise"}
                      {lic.plan === plan && <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">현재</span>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr key={f.label} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "" : "bg-muted/10")}>
                  <td className="px-5 py-3 text-sm text-foreground">{f.label}</td>
                  <td className="px-4 py-3 text-center"><FeatureCell value={f.free} /></td>
                  <td className="px-4 py-3 text-center"><FeatureCell value={f.pro} /></td>
                  <td className="px-4 py-3 text-center"><FeatureCell value={f.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
