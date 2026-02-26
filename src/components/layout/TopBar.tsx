"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Moon, Sun, Bell, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { alerts } from "@/lib/mock-data";

const breadcrumbMap: Record<string, string[]> = {
  "/": ["종합 리스크 현황"],
  "/credit-risk": ["신용리스크"],
  "/market-risk": ["시장리스크"],
  "/liquidity-risk": ["유동성리스크"],
  "/reports": ["보고서"],
  "/builder": ["대시보드 빌더"],
};

export function TopBar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const breadcrumbs = React.useMemo(() => {
    const base = breadcrumbMap[pathname] ?? breadcrumbMap["/"];
    return ["홈", ...base];
  }, [pathname]);

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <header
      data-topbar
      className="flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6"
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
      </div>
    </header>
  );
}
