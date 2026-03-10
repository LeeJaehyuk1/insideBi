"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  Home,
  CreditCard,
  TrendingUp,
  Droplets,
  Target,
  LayoutTemplate,
  FileText,
  Shield,
  Bot,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Plus,
  BarChart3,
  Table2,
  BookOpen,
  ShieldCheck,
  Pencil,
  Eye,
  Check,
  FolderOpen,
  Database,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { alerts } from "@/lib/mock-data";
import { useRole, ROLES, Role, getRoleInfo } from "@/context/RoleContext";
import { Badge } from "@/components/ui/badge";

interface TopNavProps {
  onAiOpen?: () => void;
}

const roleIcons: Record<Role, React.ElementType> = {
  admin: ShieldCheck,
  editor: Pencil,
  viewer: Eye,
};

/* ── Dropdown 메뉴 아이템 타입 ── */
type NavItem = { title: string; href: string; icon: React.ElementType; description?: string };
type NavGroup = { label: string; items: NavItem[]; color?: string };

const RISK_NAV: NavGroup[] = [
  {
    label: "리스크 관리",
    color: "text-blue-400",
    items: [
      { title: "신용리스크", href: "/credit-risk", icon: CreditCard, description: "NPL / PD / LGD / EAD" },
      { title: "시장리스크", href: "/market-risk", icon: TrendingUp, description: "VaR / 스트레스 테스트" },
      { title: "유동성리스크", href: "/liquidity-risk", icon: Droplets, description: "LCR / NSFR / 만기갭" },
      { title: "NCR리스크", href: "/ncr-risk", icon: Target, description: "순자본비율 지표" },
    ],
  },
];

const ANALYTICS_NAV: NavGroup[] = [
  {
    label: "분석 도구",
    color: "text-purple-400",
    items: [
      { title: "질문", href: "/questions/new", icon: Table2, description: "데이터셋 선택 → 필터 → 시각화" },
      { title: "워크스페이스", href: "/builder", icon: LayoutTemplate, description: "커스텀 대시보드 구성" },
      { title: "보고서", href: "/reports", icon: FileText, description: "경영진 보고서" },
    ],
  },
];

const NEW_NAV: NavItem[] = [
  { title: "새 질문", href: "/questions/new", icon: Table2, description: "데이터 탐색 및 시각화" },
  { title: "새 대시보드", href: "/builder", icon: BarChart3, description: "커스텀 대시보드 구성" },
  { title: "새 보고서", href: "/reports", icon: BookOpen, description: "경영진 보고서" },
];

/* ── 드롭다운 공통 ── */
function NavDropdown({
  trigger,
  groups,
  items,
  align = "left",
}: {
  trigger: React.ReactNode;
  groups?: NavGroup[];
  items?: NavItem[];
  align?: "left" | "right";
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-hover transition-colors"
      >
        {trigger}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-1 z-50 min-w-[220px] rounded-xl border bg-background shadow-xl",
            "animate-in fade-in slide-in-from-top-2 duration-150",
            align === "right" ? "right-0" : "left-0"
          )}
        >
          {groups?.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "border-t" : ""}>
              <div className="px-3 pt-2.5 pb-1">
                <span className={cn("text-[10px] font-semibold uppercase tracking-widest", group.color ?? "text-muted-foreground")}>
                  {group.label}
                </span>
              </div>
              <div className="px-1.5 pb-1.5 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-sm">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {items && (
            <div className="px-1.5 py-1.5 space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted text-foreground transition-colors"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    <p className="text-sm">{item.title}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── 메인 TopNav ── */
export function TopNav({ onAiOpen }: TopNavProps = {}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [roleDropOpen, setRoleDropOpen] = React.useState(false);
  const roleDropRef = React.useRef<HTMLDivElement>(null);

  const { role, setRole } = useRole();
  const roleInfo = getRoleInfo(role);
  const RoleIcon = roleIcons[role];

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (roleDropRef.current && !roleDropRef.current.contains(e.target as Node))
        setRoleDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = alerts.filter((a) => !a.isRead).length;
  const isHome = pathname === "/";

  return (
    <header
      data-topbar
      className="sticky top-0 z-50 flex h-14 items-center gap-2 bg-nav px-4 shadow-sm"
    >
      {/* ── Logo ── */}
      <Link
        href="/"
        className="flex items-center gap-2 mr-4 shrink-0 group"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <ShieldAlert className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-nav-foreground tracking-tight hidden sm:block">
          Risk BI
        </span>
      </Link>

      {/* ── Primary Nav Links ── */}
      <nav className="flex items-center gap-0.5">
        {/* 홈 */}
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            isHome
              ? "bg-nav-hover text-nav-foreground"
              : "text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-hover"
          )}
        >
          <Home className="h-3.5 w-3.5" />
          <span>홈</span>
        </Link>

        {/* 리스크 관리 드롭다운 */}
        <NavDropdown
          trigger={<><CreditCard className="h-3.5 w-3.5" /><span>리스크 관리</span></>}
          groups={RISK_NAV}
        />

        {/* 분석 드롭다운 */}
        <NavDropdown
          trigger={<><LayoutTemplate className="h-3.5 w-3.5" /><span>분석</span></>}
          groups={ANALYTICS_NAV}
        />

        {/* 탐색 */}
        <Link
          href="/browse"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            pathname.startsWith("/browse")
              ? "bg-nav-hover text-nav-foreground"
              : "text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-hover"
          )}
        >
          <Database className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">탐색</span>
        </Link>

        {/* 컬렉션 */}
        <Link
          href="/collections"
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
            pathname.startsWith("/collections")
              ? "bg-nav-hover text-nav-foreground"
              : "text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-hover"
          )}
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">컬렉션</span>
        </Link>
      </nav>

      {/* ── + 새로 만들기 ── */}
      <div className="ml-2">
        <NavDropdown
          trigger={
            <span className="flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">새로 만들기</span>
            </span>
          }
          items={NEW_NAV}
        />
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-1">
        {/* AI 분석 */}
        <button
          onClick={onAiOpen}
          title="AI 데이터 분석"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-nav-foreground/80 hover:text-nav-foreground hover:bg-nav-hover transition-colors"
        >
          <Bot className="h-4 w-4" />
          <span className="hidden lg:inline">AI 분석</span>
        </button>

        {/* 관리자 */}
        <Link
          href="/admin"
          title="관리자"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
            pathname.startsWith("/admin")
              ? "bg-nav-hover text-nav-foreground"
              : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-hover"
          )}
        >
          <Shield className="h-4 w-4" />
        </Link>

        {/* 알림 */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-md text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-hover transition-colors"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-0.5 -top-0.5 h-4 w-4 justify-center p-0 text-[10px] bg-red-500 text-white border-0">
              {unreadCount}
            </Badge>
          )}
        </button>

        {/* 테마 토글 */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex h-8 w-8 items-center justify-center rounded-md text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-hover transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}

        {/* 구분선 */}
        <div className="h-6 w-px bg-nav-foreground/20 mx-1" />

        {/* 역할 스위처 */}
        <div ref={roleDropRef} className="relative">
          <button
            onClick={() => setRoleDropOpen((p) => !p)}
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-nav-foreground/20 px-2.5 py-1 text-xs font-medium transition-all hover:bg-nav-hover",
              roleInfo.color
            )}
          >
            <RoleIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{roleInfo.label}</span>
            <ChevronDown className={cn("h-3 w-3 opacity-60 transition-transform", roleDropOpen && "rotate-180")} />
          </button>

          {roleDropOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-xl border bg-background shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  역할 선택
                </p>
              </div>
              <div className="p-1.5 space-y-0.5">
                {ROLES.map((r) => {
                  const Icon = roleIcons[r.role];
                  const isActive = role === r.role;
                  return (
                    <button
                      key={r.role}
                      onClick={() => { setRole(r.role); setRoleDropOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                        isActive ? cn(r.bgColor, r.color, "border") : "hover:bg-muted"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive ? r.color : "text-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold", isActive ? r.color : "")}>{r.label}</p>
                        <p className="text-[10px] text-muted-foreground">{r.description}</p>
                      </div>
                      {isActive && (
                        <div className={cn("h-1.5 w-1.5 rounded-full shrink-0 bg-current", r.color)} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
