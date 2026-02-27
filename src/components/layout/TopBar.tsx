"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun, Bell, Menu, ChevronDown, ShieldCheck, Eye, Pencil, Bot } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { alerts } from "@/lib/mock-data";
import { useRole, ROLES, Role, getRoleInfo } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

const breadcrumbMap: Record<string, string[]> = {
  "/": ["종합 리스크 현황"],
  "/credit-risk": ["신용리스크"],
  "/market-risk": ["시장리스크"],
  "/liquidity-risk": ["유동성리스크"],
  "/ncr-risk": ["NCR리스크"],
  "/reports": ["보고서"],
  "/builder": ["대시보드 빌더"],
};

const roleIcons: Record<Role, React.ElementType> = {
  admin: ShieldCheck,
  editor: Pencil,
  viewer: Eye,
};

interface TopBarProps {
  onAiOpen?: () => void;
}

export function TopBar({ onAiOpen }: TopBarProps = {}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [roleDropOpen, setRoleDropOpen] = React.useState(false);
  const dropRef = React.useRef<HTMLDivElement>(null);

  const { role, setRole } = useRole();
  const roleInfo = getRoleInfo(role);
  const RoleIcon = roleIcons[role];

  React.useEffect(() => setMounted(true), []);

  // 바깥 클릭 시 드롭다운 닫기
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setRoleDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const breadcrumbs = React.useMemo(() => {
    const base = breadcrumbMap[pathname] ?? breadcrumbMap["/"];
    return ["홈", ...base];
  }, [pathname]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <header
      data-topbar
      className="relative z-50 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur px-6"
    >
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <AppSidebar />
        </SheetContent>
      </Sheet>

      {/* Breadcrumb */}
      <nav className="flex flex-1 items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-muted-foreground">/</span>}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* AI 분석 */}
        <Button variant="ghost" size="icon" onClick={onAiOpen} title="AI 데이터 분석">
          <Bot className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 w-4 justify-center p-0 text-[10px] bg-red-500 text-white border-0">
              {unreadCount}
            </Badge>
          )}
        </Button>

        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}

        {/* ── Role Switcher ── */}
        <div ref={dropRef} className="relative">
          <button
            onClick={() => setRoleDropOpen((p) => !p)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80",
              roleInfo.bgColor,
              roleInfo.color
            )}
          >
            <RoleIcon className="h-3.5 w-3.5" />
            {roleInfo.label}
            <ChevronDown className={cn("h-3 w-3 transition-transform", roleDropOpen && "rotate-180")} />
          </button>

          {/* Dropdown */}
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
                        isActive
                          ? cn(r.bgColor, r.color, "border")
                          : "hover:bg-muted"
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
