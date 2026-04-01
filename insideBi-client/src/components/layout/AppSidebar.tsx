
import * as React from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Home,
  CreditCard,
  TrendingUp,
  Droplets,
  FileText,
  ShieldAlert,
  Shield,
  ChevronRight,
  LayoutTemplate,
  Target,
  Bot,
  Check,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRole, getRoleInfo, ROLES } from "@/context/RoleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

const iconMap = {
  Home,
  CreditCard,
  TrendingUp,
  Droplets,
  FileText,
  LayoutTemplate,
  Target,
  Shield,
} as const;

interface AppSidebarProps {
  onAiOpen?: () => void;
}

export function AppSidebar({ onAiOpen }: AppSidebarProps = {}) {
  const pathname = useLocation().pathname;
  const { role, setRole } = useRole();
  const roleInfo = getRoleInfo(role);

  return (
    <aside
      data-sidebar
      className="flex h-screen w-64 flex-col border-r bg-sidebar text-sidebar-foreground"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-sidebar-foreground">Risk BI</p>
          <p className="text-xs text-sidebar-foreground/60">금융 리스크관리</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-4">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className="mb-1 px-3 flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-sidebar-border/50" />
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.title}</p>
                        <p className="truncate text-xs opacity-60">{item.description}</p>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* AI 분석 버튼 (구분선 아래) */}
        <div className="mt-3 pt-3 border-t border-sidebar-border/50">
          <button
            onClick={onAiOpen}
            className="w-full group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <Bot className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate">AI 데이터 분석</p>
              <p className="truncate text-xs opacity-60">자연어로 데이터 질문</p>
            </div>
          </button>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-4 py-3 space-y-1.5">
        {/* 역할 스위처 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:opacity-80 transition-opacity",
                roleInfo.bgColor
              )}
            >
              <div className={cn("h-2 w-2 rounded-full bg-current shrink-0", roleInfo.color)} />
              <div className="flex-1 min-w-0 text-left">
                <p className={cn("text-xs font-semibold", roleInfo.color)}>{roleInfo.label}</p>
                <p className="text-[10px] text-sidebar-foreground/40 truncate">{roleInfo.description}</p>
              </div>
              <ChevronUp className="h-3 w-3 opacity-40 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            {ROLES.map((r) => (
              <DropdownMenuItem
                key={r.role}
                onClick={() => setRole(r.role)}
                className="gap-2 cursor-pointer"
              >
                <div className={cn("h-2 w-2 rounded-full shrink-0", r.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.description}</p>
                </div>
                {role === r.role && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <p className="text-xs text-sidebar-foreground/40 px-1">
          기준일: {format(new Date(), "yyyy-MM-dd")}
        </p>
        <p className="text-xs text-sidebar-foreground/40 px-1">v1.0.0</p>
      </div>
    </aside>
  );
}
