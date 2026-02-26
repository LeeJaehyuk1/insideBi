"use client";

import * as React from "react";
import { AlertTriangle, X, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert } from "@/types/risk";
import { SEVERITY_COLORS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const icons = {
  normal: Info,
  caution: Info,
  warning: AlertTriangle,
  danger: AlertCircle,
};

interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());
  const visible = alerts.filter((a) => !dismissed.has(a.id) && !a.isRead);

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {visible.map((alert) => {
        const Icon = icons[alert.severity];
        const colors = SEVERITY_COLORS[alert.severity];
        return (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-4 py-3",
              colors.bg,
              colors.border
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", colors.text)} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", colors.text)}>{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 -mr-1"
              onClick={() => setDismissed((prev) => { const next = new Set(Array.from(prev)); next.add(alert.id); return next; })}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
