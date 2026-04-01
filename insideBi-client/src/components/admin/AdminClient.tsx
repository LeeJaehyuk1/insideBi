
import * as React from "react";
import {
  Lock, LayoutDashboard, Users, Database,
  Settings, Bot, ShieldCheck, LogOut, Users2,
  KeyRound, Palette, Wrench, ClipboardList,
  Mail, Bell, Award,
} from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { apiFetch } from "@/lib/api-client";
import { OverviewSection }        from "@/components/admin/sections/OverviewSection";
import { UsersSection }           from "@/components/admin/sections/UsersSection";
import { GroupsSection }          from "@/components/admin/sections/GroupsSection";
import { DatabaseSection }        from "@/components/admin/sections/DatabaseSection";
import { SettingsSection }        from "@/components/admin/sections/SettingsSection";
import { AiSection }              from "@/components/admin/sections/AiSection";
import { AuthSection }            from "@/components/admin/sections/AuthSection";
import { AppearanceSection }      from "@/components/admin/sections/AppearanceSection";
import { TroubleshootingSection } from "@/components/admin/sections/TroubleshootingSection";
import { AuditSection }           from "@/components/admin/sections/AuditSection";
import { EmailSection }           from "@/components/admin/sections/EmailSection";
import { NotificationsSection }   from "@/components/admin/sections/NotificationsSection";
import { LicenseSection }         from "@/components/admin/sections/LicenseSection";
import { useRole }                from "@/context/RoleContext";
import { cn }                     from "@/lib/utils";

type SectionId =
  | "overview" | "users" | "groups" | "database" | "license"
  | "settings" | "auth" | "appearance" | "email" | "notifications"
  | "audit" | "troubleshooting"
  | "ai";

interface NavItem {
  id: SectionId;
  label: string;
  icon: React.ElementType;
  description: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "관리",
    items: [
      { id: "overview",  label: "개요",        icon: LayoutDashboard, description: "시스템 현황"       },
      { id: "users",     label: "사용자",      icon: Users,           description: "계정 및 역할 관리"  },
      { id: "groups",    label: "그룹 & 권한",  icon: Users2,          description: "접근 권한 설정"    },
      { id: "database",  label: "데이터베이스",  icon: Database,        description: "DB 연결 관리"      },
      { id: "license",   label: "라이선스",    icon: Award,           description: "플랜 및 기능 관리"  },
    ],
  },
  {
    label: "설정",
    items: [
      { id: "settings",       label: "일반 설정",  icon: Settings,  description: "앱 설정"               },
      { id: "auth",           label: "인증 설정",  icon: KeyRound,  description: "SSO · LDAP · 비밀번호"  },
      { id: "appearance",     label: "외관",       icon: Palette,   description: "로고 · 색상 · 폰트"     },
      { id: "email",          label: "이메일",     icon: Mail,      description: "SMTP 설정"              },
      { id: "notifications",  label: "알림",       icon: Bell,      description: "Slack · 웹훅 · 이벤트"  },
    ],
  },
  {
    label: "모니터링",
    items: [
      { id: "audit",           label: "감사 로그", icon: ClipboardList, description: "사용자 활동 추적"       },
      { id: "troubleshooting", label: "문제해결",  icon: Wrench,        description: "로그 · 진단 · 시스템"   },
    ],
  },
  {
    label: "AI",
    items: [
      { id: "ai", label: "AI 관리", icon: Bot, description: "Vanna.ai 학습" },
    ],
  },
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
const SESSION_KEY = "admin_auth";

export function AdminClient() {
  const { role } = useRole();
  const [password, setPassword] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("overview");
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setPassword(stored);
    setHydrated(true);
  }, []);

  const handleLogin = async (pw: string) => {
    const res = await apiFetch("/api/admin/login", {
      method: "POST",
      headers: { "x-admin-password": pw },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ detail: "로그인 실패" }));
      throw new Error(data.detail ?? "로그인 실패");
    }
    sessionStorage.setItem(SESSION_KEY, pw);
    setPassword(pw);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword(null);
  };

  if (!hydrated) return null;

  /* 권한 없음 */
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-base font-semibold">관리자 역할이 필요합니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            우측 상단에서 역할을 <strong>관리자</strong>로 변경하세요.
          </p>
        </div>
      </div>
    );
  }

  const activeNav = ALL_NAV_ITEMS.find((n) => n.id === activeSection) ?? ALL_NAV_ITEMS[0];
  const ActiveIcon = activeNav.icon;

  return (
    <div className="flex h-[calc(100vh-56px)]">

      {/* ── 사이드바 ── */}
      <aside className="w-56 flex flex-col border-r border-border bg-muted/20 shrink-0">
        {/* 헤더 */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground leading-none">관리자 패널</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">Admin Console</p>
          </div>
        </div>

        {/* 네비게이션 그룹 */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/70 hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                      <div className="min-w-0">
                        <p className={cn("text-sm leading-none", isActive ? "font-semibold" : "font-medium")}>
                          {item.label}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* 하단: AI 로그아웃 */}
        {password && (
          <div className="px-2 py-3 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">AI 로그아웃</span>
            </button>
          </div>
        )}
      </aside>

      {/* ── 콘텐츠 영역 ── */}
      <main className="flex-1 overflow-y-auto">
        {/* 콘텐츠 헤더 */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-6 py-4 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <ActiveIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground leading-none">{activeNav.label}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{activeNav.description}</p>
          </div>
        </div>

        {/* 섹션 콘텐츠 */}
        <div className="px-6 py-6">
          {activeSection === "overview"        && <OverviewSection />}
          {activeSection === "users"           && <UsersSection />}
          {activeSection === "groups"          && <GroupsSection />}
          {activeSection === "database"        && <DatabaseSection />}
          {activeSection === "license"         && <LicenseSection />}
          {activeSection === "settings"        && <SettingsSection />}
          {activeSection === "auth"            && <AuthSection />}
          {activeSection === "appearance"      && <AppearanceSection />}
          {activeSection === "email"           && <EmailSection />}
          {activeSection === "notifications"   && <NotificationsSection />}
          {activeSection === "audit"           && <AuditSection />}
          {activeSection === "troubleshooting" && <TroubleshootingSection />}
          {activeSection === "ai" && (
            password
              ? <AiSection password={password} />
              : (
                <div className="max-w-sm mx-auto pt-8">
                  <p className="text-sm text-muted-foreground mb-4 text-center">
                    AI 관리 기능은 Vanna.ai 백엔드 인증이 필요합니다.
                  </p>
                  <AdminLogin onLogin={handleLogin} />
                </div>
              )
          )}
        </div>
      </main>
    </div>
  );
}
