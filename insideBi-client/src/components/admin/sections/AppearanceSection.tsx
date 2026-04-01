
import * as React from "react";
import {
  Palette, Type, Monitor, Upload, RotateCcw, Save, Sun, Moon, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LS_KEY = "insightbi_appearance_v1";

interface AppearanceSettings {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  brandName: string;
  fontFamily: string;
  defaultTheme: "light" | "dark" | "system";
  loginBackground: string;
}

const DEFAULTS: AppearanceSettings = {
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#6366f1",
  brandName: "InsightBi",
  fontFamily: "system",
  defaultTheme: "system",
  loginBackground: "gradient-indigo",
};

const PRESET_COLORS = [
  { label: "인디고 (기본)",   value: "#6366f1" },
  { label: "블루",           value: "#3b82f6" },
  { label: "에메랄드",       value: "#10b981" },
  { label: "바이올렛",       value: "#8b5cf6" },
  { label: "로즈",          value: "#f43f5e" },
  { label: "앰버",          value: "#f59e0b" },
  { label: "슬레이트",       value: "#64748b" },
  { label: "커스텀",         value: "custom"  },
];

const FONTS = [
  { value: "system",  label: "시스템 기본 폰트" },
  { value: "inter",   label: "Inter" },
  { value: "pretendard", label: "Pretendard" },
  { value: "nanum",   label: "나눔고딕" },
];

const LOGIN_BACKGROUNDS = [
  { value: "gradient-indigo", label: "인디고 그라디언트", className: "bg-gradient-to-br from-indigo-500 to-purple-600" },
  { value: "gradient-blue",   label: "블루 그라디언트",   className: "bg-gradient-to-br from-blue-500 to-cyan-600" },
  { value: "gradient-dark",   label: "다크 그라디언트",   className: "bg-gradient-to-br from-gray-800 to-gray-950" },
  { value: "solid-white",     label: "화이트",            className: "bg-white border border-border" },
];

function load(): AppearanceSettings {
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

export function AppearanceSection() {
  const [s, setS] = React.useState<AppearanceSettings>(DEFAULTS);
  const [saved, setSaved] = React.useState(false);
  const [customColor, setCustomColor] = React.useState("#6366f1");
  const [logoPreview, setLogoPreview] = React.useState<string>("");
  const logoRef = React.useRef<HTMLInputElement>(null);
  const faviconRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { setS(load()); }, []);

  const set = <K extends keyof AppearanceSettings>(k: K, v: AppearanceSettings[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setLogoPreview(url);
      set("logoUrl", url);
    };
    reader.readAsDataURL(file);
  };

  const effectiveColor = s.primaryColor === "custom" ? customColor : s.primaryColor;

  return (
    <div className="space-y-5 max-w-3xl">

      {/* ── 상단 액션 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">외관 설정</h2>
          <p className="text-xs text-muted-foreground mt-0.5">브랜드 로고, 색상, 폰트를 커스터마이징합니다</p>
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
              saved ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <Save className="h-3.5 w-3.5" />
            {saved ? "저장됨!" : "저장"}
          </button>
        </div>
      </div>

      {/* ── 로고 & 파비콘 ── */}
      <Card icon={Upload} title="로고 & 파비콘" description="상단 네비게이션에 표시될 브랜드 이미지">
        <div className="grid grid-cols-2 gap-6">
          {/* 로고 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">로고</p>
            <div
              onClick={() => logoRef.current?.click()}
              className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors"
            >
              {logoPreview || s.logoUrl ? (
                <img src={logoPreview || s.logoUrl} alt="logo" className="max-h-16 max-w-full object-contain" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">클릭하여 업로드</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">PNG · SVG · 권장 200×60px</p>
                </>
              )}
            </div>
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            {(logoPreview || s.logoUrl) && (
              <button
                onClick={() => { setLogoPreview(""); set("logoUrl", ""); }}
                className="text-xs text-red-500 hover:underline"
              >제거</button>
            )}
          </div>

          {/* 파비콘 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">파비콘</p>
            <div
              onClick={() => faviconRef.current?.click()}
              className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-colors"
            >
              {s.faviconUrl ? (
                <img src={s.faviconUrl} alt="favicon" className="h-10 w-10 object-contain" />
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">클릭하여 업로드</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">ICO · PNG · 32×32px</p>
                </>
              )}
            </div>
            <input ref={faviconRef} type="file" accept="image/*,image/x-icon" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => set("faviconUrl", ev.target?.result as string);
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </div>

        {/* 브랜드 이름 */}
        <div className="mt-4 space-y-1.5 pt-4 border-t border-border">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">브랜드명</label>
          <input
            value={s.brandName} onChange={(e) => set("brandName", e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </Card>

      {/* ── 색상 테마 ── */}
      <Card icon={Palette} title="브랜드 색상" description="UI 전반의 강조색 (Primary Color)">
        <div className="grid grid-cols-4 gap-2 mb-4">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => {
                if (c.value === "custom") {
                  set("primaryColor", "custom");
                } else {
                  set("primaryColor", c.value);
                }
              }}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all",
                s.primaryColor === c.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              )}
            >
              {c.value === "custom" ? (
                <div className="h-7 w-7 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              ) : (
                <div className="h-7 w-7 rounded-full shadow-sm" style={{ background: c.value }} />
              )}
              <span className="text-[10px] text-muted-foreground text-center leading-tight">{c.label}</span>
              {s.primaryColor === c.value && (
                <span className="absolute top-1 right-1">
                  <Check className="h-3 w-3 text-primary" />
                </span>
              )}
            </button>
          ))}
        </div>

        {s.primaryColor === "custom" && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border">
            <input
              type="color" value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-9 w-14 rounded cursor-pointer border-0 bg-transparent"
            />
            <div>
              <p className="text-xs font-medium text-foreground">커스텀 색상</p>
              <p className="text-xs text-muted-foreground font-mono">{customColor}</p>
            </div>
            <div className="ml-auto h-8 w-8 rounded-full shadow-md" style={{ background: customColor }} />
          </div>
        )}

        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-muted/30">
          <div className="h-4 w-4 rounded-full" style={{ background: effectiveColor }} />
          <p className="text-xs text-muted-foreground">미리보기 — 버튼, 링크, 강조 요소에 적용됩니다</p>
        </div>
      </Card>

      {/* ── 폰트 ── */}
      <Card icon={Type} title="폰트" description="UI 전반에 사용될 글꼴">
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => (
            <button
              key={f.value}
              onClick={() => set("fontFamily", f.value)}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
                s.fontFamily === f.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-bold",
                s.fontFamily === f.value && "bg-primary/10 text-primary"
              )}>Aa</div>
              <div>
                <p className="text-xs font-semibold text-foreground">{f.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">가나다 ABC 123</p>
              </div>
              {s.fontFamily === f.value && <Check className="h-4 w-4 text-primary ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      </Card>

      {/* ── 다크모드 & 로그인 배경 ── */}
      <Card icon={Monitor} title="테마 & 로그인 화면" description="기본 색상 모드와 로그인 배경">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">기본 테마 모드</p>
            <div className="flex items-center gap-2">
              {(["light", "dark", "system"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => set("defaultTheme", mode)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-all",
                    s.defaultTheme === mode
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {mode === "light" && <Sun className="h-3.5 w-3.5" />}
                  {mode === "dark" && <Moon className="h-3.5 w-3.5" />}
                  {mode === "system" && <Monitor className="h-3.5 w-3.5" />}
                  {mode === "light" ? "라이트" : mode === "dark" ? "다크" : "시스템"}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">로그인 배경</p>
            <div className="grid grid-cols-4 gap-2">
              {LOGIN_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.value}
                  onClick={() => set("loginBackground", bg.value)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 transition-all",
                    s.loginBackground === bg.value ? "border-primary" : "border-transparent"
                  )}
                >
                  <div className={cn("h-14 w-full", bg.className)} />
                  <p className="text-[10px] text-center py-1 text-muted-foreground truncate px-1">{bg.label}</p>
                  {s.loginBackground === bg.value && (
                    <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
