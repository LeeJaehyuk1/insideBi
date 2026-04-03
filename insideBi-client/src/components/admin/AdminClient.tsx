import * as React from "react";
import { Bot, Database, Lock, LogOut, ShieldCheck } from "lucide-react";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { DatabaseSection } from "@/components/admin/sections/DatabaseSection";
import { AiSection } from "@/components/admin/sections/AiSection";
import { apiFetch } from "@/lib/api-client";
import { useRole } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

type SectionId = "database" | "ai";

interface NavItem {
  id: SectionId;
  label: string;
  description: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "database",
    label: "DB 관리",
    description: "연결 정보와 스키마 상태를 확인합니다.",
    icon: Database,
  },
  {
    id: "ai",
    label: "AI 관리",
    description: "학습 데이터와 피드백, 모니터링을 관리합니다.",
    icon: Bot,
  },
];

const SESSION_KEY = "admin_auth";

export function AdminClient() {
  const { role } = useRole();
  const [password, setPassword] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>("database");
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
      const data = await res.json().catch(() => ({ detail: "로그인에 실패했습니다." }));
      throw new Error(data.detail ?? "로그인에 실패했습니다.");
    }
    sessionStorage.setItem(SESSION_KEY, pw);
    setPassword(pw);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setPassword(null);
  };

  if (!hydrated) return null;

  if (role !== "admin") {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Lock className="h-7 w-7 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-base font-semibold">관리자 권한이 필요합니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            상단 역할 메뉴에서 <strong>관리자</strong>로 전환한 뒤 다시 접근해 주세요.
          </p>
        </div>
      </div>
    );
  }

  const activeNav = NAV_ITEMS.find((item) => item.id === activeSection) ?? NAV_ITEMS[0];
  const ActiveIcon = activeNav.icon;

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-muted/20">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-none text-foreground">관리자 패널</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                <div className="min-w-0">
                  <p className={cn("text-sm leading-none", isActive ? "font-semibold" : "font-medium")}>{item.label}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {password && (
          <div className="border-t border-border px-2 py-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">AI 인증 로그아웃</span>
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <ActiveIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-none text-foreground">{activeNav.label}</h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{activeNav.description}</p>
          </div>
        </div>

        <div className="px-6 py-6">
          {activeSection === "database" && <DatabaseSection />}
          {activeSection === "ai" &&
            (password ? (
              <AiSection password={password} />
            ) : (
              <div className="mx-auto max-w-sm pt-8">
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  AI 관리 기능은 별도 관리자 인증 후 사용할 수 있습니다.
                </p>
                <AdminLogin onLogin={handleLogin} />
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}
