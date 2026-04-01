
import * as React from "react";
import { Save, RotateCcw, Globe, Clock, Share2, Code2, HardDrive, Bell, Languages, Link2, Trash2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSettings {
  appName: string;
  appSlogan: string;
  locale: string;
  sessionTimeout: number;
  allowPublicSharing: boolean;
  allowEmbedding: boolean;
  maxCacheAgeHours: number;
  enableNotifications: boolean;
  emailNotifications: boolean;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  weekStartDay: "mon" | "sun";
  embeddingSecret: string;
  embeddingAllowedDomains: string;
}

interface PublicLink {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  views: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  appName: "InsightBi",
  appSlogan: "금융 리스크관리 BI 솔루션",
  locale: "ko",
  sessionTimeout: 480,
  allowPublicSharing: false,
  allowEmbedding: false,
  maxCacheAgeHours: 24,
  enableNotifications: true,
  emailNotifications: false,
  timezone: "Asia/Seoul",
  dateFormat: "YYYY-MM-DD",
  numberFormat: "1,234.56",
  weekStartDay: "mon",
  embeddingSecret: "",
  embeddingAllowedDomains: "",
};

const MOCK_PUBLIC_LINKS: PublicLink[] = [
  { id: "pl-1", name: "신용리스크 대시보드", url: "/public/dashboard/abc123", createdAt: "2026-03-10T09:00:00Z", views: 142 },
  { id: "pl-2", name: "유동성 지표 요약",    url: "/public/dashboard/def456", createdAt: "2026-03-12T14:30:00Z", views: 87 },
];

const LS_KEY = "insightbi_app_settings_v1";

function loadSettings(): AppSettings {
  try {
    const s = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (s) return { ...DEFAULT_SETTINGS, ...JSON.parse(s) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}
function saveSettings(s: AppSettings) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
}

function Toggle({ value, onChange, label, description }: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
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
          "relative h-6 w-11 rounded-full transition-colors duration-200",
          value ? "bg-primary" : "bg-muted"
        )}
      >
        <span className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          value ? "translate-x-5" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function SettingsSection() {
  const [settings, setSettings] = React.useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [publicLinks, setPublicLinks] = React.useState<PublicLink[]>(MOCK_PUBLIC_LINKS);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [secretVisible, setSecretVisible] = React.useState(false);

  React.useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setSaved(false);
  };

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">일반 설정</h2>
          <p className="text-sm text-muted-foreground mt-0.5">애플리케이션 전반적인 설정을 관리합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            초기화
          </button>
          <button
            onClick={handleSave}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 auto-rows-min">

        {/* 앱 기본 정보 */}
        <SectionCard icon={Globe} title="기본 정보">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">앱 이름</label>
              <input
                value={settings.appName}
                onChange={(e) => update("appName", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">슬로건</label>
              <input
                value={settings.appSlogan}
                onChange={(e) => update("appSlogan", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">언어</label>
              <select
                value={settings.locale}
                onChange={(e) => update("locale", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">시간대</label>
              <select
                value={settings.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="Asia/Seoul">Asia/Seoul (KST UTC+9)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>
          </div>
        </SectionCard>

        {/* 세션 & 보안 */}
        <SectionCard icon={Clock} title="세션 & 보안">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                세션 만료 시간 <span className="font-normal">({settings.sessionTimeout}분)</span>
              </label>
              <input
                type="range"
                min={30}
                max={1440}
                step={30}
                value={settings.sessionTimeout}
                onChange={(e) => update("sessionTimeout", parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>30분</span>
                <span className="font-semibold text-foreground">
                  {settings.sessionTimeout >= 60
                    ? `${Math.floor(settings.sessionTimeout / 60)}시간 ${settings.sessionTimeout % 60 > 0 ? `${settings.sessionTimeout % 60}분` : ""}`
                    : `${settings.sessionTimeout}분`}
                </span>
                <span>24시간</span>
              </div>
            </div>
            <div className="pt-2">
              <Toggle
                value={settings.enableNotifications}
                onChange={(v) => update("enableNotifications", v)}
                label="앱 내 알림 활성화"
                description="리스크 임계값 초과 시 알림을 표시합니다."
              />
            </div>
          </div>
        </SectionCard>

        {/* 공유 & 임베딩 */}
        <SectionCard icon={Share2} title="공유 & 임베딩">
          <Toggle
            value={settings.allowPublicSharing}
            onChange={(v) => update("allowPublicSharing", v)}
            label="공개 링크 허용"
            description="로그인 없이 접근 가능한 공개 URL을 생성할 수 있습니다."
          />
          <Toggle
            value={settings.allowEmbedding}
            onChange={(v) => update("allowEmbedding", v)}
            label="외부 임베딩 허용"
            description="다른 웹사이트에 대시보드를 iframe으로 삽입할 수 있습니다."
          />
          <Toggle
            value={settings.emailNotifications}
            onChange={(v) => update("emailNotifications", v)}
            label="이메일 알림"
            description="구독 및 알림을 이메일로 발송합니다. (SMTP 설정 필요)"
          />
        </SectionCard>

        {/* 캐시 */}
        <SectionCard icon={HardDrive} title="캐시 & 성능">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                캐시 유지 시간 <span className="font-normal">({settings.maxCacheAgeHours}시간)</span>
              </label>
              <input
                type="range"
                min={1}
                max={72}
                step={1}
                value={settings.maxCacheAgeHours}
                onChange={(e) => update("maxCacheAgeHours", parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                <span>1시간</span>
                <span className="font-semibold text-foreground">{settings.maxCacheAgeHours}시간</span>
                <span>72시간</span>
              </div>
            </div>
            <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
              쿼리 결과를 캐시에 저장하면 대시보드 로딩 속도가 빨라지지만 실시간성이 떨어질 수 있습니다.
            </div>
          </div>
        </SectionCard>

        {/* 로컬라이제이션 */}
        <SectionCard icon={Languages} title="로컬라이제이션">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">날짜 형식</label>
              <select value={settings.dateFormat} onChange={(e) => update("dateFormat", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-03-17)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (17/03/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (03/17/2026)</option>
                <option value="YYYY년 MM월 DD일">YYYY년 MM월 DD일</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">숫자 형식</label>
              <select value={settings.numberFormat} onChange={(e) => update("numberFormat", e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="1,234.56">1,234.56 (영문식)</option>
                <option value="1.234,56">1.234,56 (유럽식)</option>
                <option value="1234.56">1234.56 (구분자 없음)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">주 시작 요일</label>
              <div className="flex gap-2">
                {([["mon", "월요일"], ["sun", "일요일"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => update("weekStartDay", val)}
                    className={cn("flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      settings.weekStartDay === val
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    )}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 공개 링크 관리 */}
        <SectionCard icon={Link2} title="공개 링크 관리">
          <div className="space-y-2">
            {publicLinks.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">발행된 공개 링크가 없습니다</p>
            )}
            {publicLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/10 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{link.name}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{link.url}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{link.views}회 조회</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + link.url);
                    setCopiedId(link.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors shrink-0"
                >
                  {copiedId === link.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setPublicLinks((p) => p.filter((l) => l.id !== link.id))}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 임베딩 상세 */}
        <SectionCard icon={Code2} title="임베딩 상세 설정">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">허용 도메인</label>
              <input
                value={settings.embeddingAllowedDomains}
                onChange={(e) => update("embeddingAllowedDomains", e.target.value)}
                placeholder="example.com, app.company.com"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[11px] text-muted-foreground mt-1">쉼표로 구분. 비어있으면 모든 도메인 허용.</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">서명 시크릿 (JWT)</label>
              <div className="flex gap-2">
                <input
                  type={secretVisible ? "text" : "password"}
                  value={settings.embeddingSecret}
                  onChange={(e) => update("embeddingSecret", e.target.value)}
                  placeholder="자동 생성 또는 직접 입력"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button onClick={() => setSecretVisible((p) => !p)}
                  className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors">
                  {secretVisible ? "숨기기" : "보기"}
                </button>
                <button
                  onClick={() => {
                    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                      .map((b) => b.toString(16).padStart(2, "0")).join("");
                    update("embeddingSecret", secret);
                  }}
                  className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap">
                  재생성
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              시크릿을 재생성하면 기존 임베딩 링크가 모두 무효화됩니다.
            </div>
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
