import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Bot,
  Bookmark,
  Check,
  ChevronDown,
  Eye,
  Home,
  LayoutTemplate,
  LogOut,
  MessageSquare,
  Moon,
  Pencil,
  Shield,
  ShieldCheck,
  Sun,
  User2,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { useAlerts } from "@/hooks/useAlerts";
import { useBookmarks, BookmarkType } from "@/hooks/useBookmarks";
import { useRole, ROLES, Role, getRoleInfo } from "@/context/RoleContext";
import { cn } from "@/lib/utils";

interface TopNavProps {
  onAiOpen?: () => void;
}

const roleIcons: Record<Role, React.ElementType> = {
  admin: ShieldCheck,
  editor: Pencil,
  viewer: Eye,
};

export function TopNav({ onAiOpen }: TopNavProps = {}) {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [roleDropOpen, setRoleDropOpen] = React.useState(false);
  const [bmOpen, setBmOpen] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [editingName, setEditingName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState("");
  const roleDropRef = React.useRef<HTMLDivElement>(null);
  const bmRef = React.useRef<HTMLDivElement>(null);
  const alertRef = React.useRef<HTMLDivElement>(null);

  const { bookmarks, toggle } = useBookmarks();
  const { role, setRole, userName, setUserName, logout } = useRole();
  const { alerts, unreadCount, markRead, markAllRead } = useAlerts();
  const roleInfo = getRoleInfo(role);
  const RoleIcon = roleIcons[role];

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (roleDropRef.current && !roleDropRef.current.contains(event.target as Node)) setRoleDropOpen(false);
      if (bmRef.current && !bmRef.current.contains(event.target as Node)) setBmOpen(false);
      if (alertRef.current && !alertRef.current.contains(event.target as Node)) setAlertOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const bookmarkGroups = (["question", "dashboard"] as BookmarkType[]).map((type) => ({
    type,
    items: bookmarks.filter((bookmark) => bookmark.type === type),
  }));

  return (
    <>
      <header data-topbar className="sticky top-0 z-50 flex h-14 items-center gap-2 bg-nav px-4 shadow-sm">
        <Link to="/" className="mr-4 flex shrink-0 items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="hidden text-sm font-bold tracking-tight text-nav-foreground sm:block">
            Inside BI
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          <Link
            to="/"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === "/" ? "bg-nav-hover text-nav-foreground" : "text-nav-foreground/80 hover:bg-nav-hover hover:text-nav-foreground",
            )}
          >
            <Home className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>
          <Link
            to="/questions"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith("/questions") ? "bg-nav-hover text-nav-foreground" : "text-nav-foreground/80 hover:bg-nav-hover hover:text-nav-foreground",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Questions</span>
          </Link>
          <Link
            to="/dashboards"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith("/dashboards") ? "bg-nav-hover text-nav-foreground" : "text-nav-foreground/80 hover:bg-nav-hover hover:text-nav-foreground",
            )}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Dashboards</span>
          </Link>
          <Link
            to="/dashboards/new"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === "/dashboards/new"
                ? "bg-nav-hover text-nav-foreground"
                : "text-nav-foreground/80 hover:bg-nav-hover hover:text-nav-foreground",
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">New Dashboard</span>
          </Link>

          {bookmarks.length > 0 && (
            <div ref={bmRef} className="relative">
              <button
                onClick={() => setBmOpen((prev) => !prev)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  bmOpen ? "bg-nav-hover text-nav-foreground" : "text-nav-foreground/80 hover:bg-nav-hover hover:text-nav-foreground",
                )}
              >
                <Bookmark className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Bookmarks</span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-150", bmOpen && "rotate-180")} />
              </button>

              {bmOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border bg-background shadow-xl">
                  {bookmarkGroups.map(({ type, items }) => {
                    if (items.length === 0) return null;
                    const TypeIcon = type === "question" ? MessageSquare : LayoutTemplate;
                    const label = type === "question" ? "Questions" : "Dashboards";
                    return (
                      <div key={type} className="first:pt-1 border-t first:border-t-0">
                        <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                          {label}
                        </p>
                        <div className="space-y-0.5 px-1.5 pb-1.5">
                          {items.map((bookmark) => (
                            <div key={bookmark.id} className="group/bm flex items-center rounded-lg hover:bg-muted">
                              <Link
                                to={bookmark.href}
                                onClick={() => setBmOpen(false)}
                                className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-sm text-foreground"
                              >
                                <TypeIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{bookmark.name}</span>
                              </Link>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggle(bookmark);
                                }}
                                className="mr-1.5 flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 transition-all group-hover/bm:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <button
            onClick={onAiOpen}
            title="AI 데이터 분석"
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-nav-foreground/80 transition-colors hover:bg-nav-hover hover:text-nav-foreground"
          >
            <Bot className="h-4 w-4" />
            <span className="hidden lg:inline">AI 데이터 분석</span>
          </button>

          <Link
            to="/admin"
            title="관리자"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              pathname.startsWith("/admin") ? "bg-nav-hover text-nav-foreground" : "text-nav-foreground/70 hover:bg-nav-hover hover:text-nav-foreground",
            )}
          >
            <Shield className="h-4 w-4" />
          </Link>

          <div ref={alertRef} className="relative">
            <button
              onClick={() => setAlertOpen((prev) => !prev)}
              className="relative flex h-8 w-8 items-center justify-center rounded-md text-nav-foreground/70 transition-colors hover:bg-nav-hover hover:text-nav-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-0.5 -top-0.5 h-4 w-4 justify-center border-0 bg-red-500 p-0 text-[10px] text-white">
                  {unreadCount}
                </Badge>
              )}
            </button>

            {alertOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-background shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">알림</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                      모두 읽음
                    </button>
                  )}
                </div>
                <div className="max-h-[360px] overflow-y-auto divide-y divide-border">
                  {alerts.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">알림이 없습니다</div>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => markRead(alert.id)}
                        className={cn("cursor-pointer px-4 py-3 transition-colors hover:bg-muted/50", !alert.isRead && "bg-primary/5")}
                      >
                        <p className="text-xs font-semibold text-foreground">{alert.title}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-8 w-8 items-center justify-center rounded-md text-nav-foreground/70 transition-colors hover:bg-nav-hover hover:text-nav-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <div className="mx-1 h-6 w-px bg-nav-foreground/20" />

          <button
            onClick={handleLogout}
            title="로그아웃"
            className="flex h-8 w-8 items-center justify-center rounded-md text-nav-foreground/70 transition-colors hover:bg-nav-hover hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {editingName ? (
            <input
              autoFocus
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              onBlur={() => {
                if (nameInput.trim()) setUserName(nameInput.trim());
                setEditingName(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  if (nameInput.trim()) setUserName(nameInput.trim());
                  setEditingName(false);
                }
                if (event.key === "Escape") setEditingName(false);
              }}
              className="w-24 rounded border border-nav-foreground/30 bg-transparent px-1.5 py-0.5 text-xs text-nav-foreground focus:outline-none"
            />
          ) : (
            <button
              onClick={() => {
                setNameInput(userName);
                setEditingName(true);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-nav-foreground/80 transition-colors hover:bg-nav-hover hover:text-nav-foreground"
            >
              <User2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{userName}</span>
            </button>
          )}

          <div ref={roleDropRef} className="relative">
            <button
              onClick={() => setRoleDropOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border border-nav-foreground/20 px-2.5 py-1 text-xs font-medium transition-all hover:bg-nav-hover",
                roleInfo.color,
              )}
            >
              <RoleIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{roleInfo.label}</span>
              <ChevronDown className={cn("h-3 w-3 opacity-60 transition-transform", roleDropOpen && "rotate-180")} />
            </button>

            {roleDropOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border bg-background shadow-xl">
                <div className="border-b px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">역할</p>
                </div>
                <div className="space-y-0.5 p-1.5">
                  {ROLES.map((nextRole) => {
                    const Icon = roleIcons[nextRole.role];
                    const isActive = role === nextRole.role;
                    return (
                      <button
                        key={nextRole.role}
                        onClick={() => {
                          setRole(nextRole.role);
                          setRoleDropOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors",
                          isActive ? cn(nextRole.bgColor, nextRole.color, "border") : "hover:bg-muted",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", isActive ? nextRole.color : "text-muted-foreground")} />
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-xs font-semibold", isActive ? nextRole.color : "")}>{nextRole.label}</p>
                          <p className="text-[10px] text-muted-foreground">{nextRole.description}</p>
                        </div>
                        {isActive && <Check className={cn("h-3.5 w-3.5 shrink-0", nextRole.color)} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

    </>
  );
}


