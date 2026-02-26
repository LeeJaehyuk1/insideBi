"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Droplets,
  FileText,
  ShieldAlert,
  ChevronRight,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { ScrollArea } from "@/components/ui/scroll-area";

const iconMap = {
  LayoutDashboard,
  CreditCard,
  TrendingUp,
  Droplets,
  FileText,
  LayoutTemplate,
} as const;

export function AppSidebar() {
  const pathname = usePathname();

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
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
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
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-6 py-4">
        <p className="text-xs text-sidebar-foreground/40">
          기준일: 2026-02-26
        </p>
        <p className="text-xs text-sidebar-foreground/40">v1.0.0</p>
      </div>
    </aside>
  );
}
