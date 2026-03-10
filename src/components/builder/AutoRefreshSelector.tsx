"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { REFRESH_OPTIONS, RefreshInterval } from "@/hooks/useAutoRefresh";

interface AutoRefreshSelectorProps {
  value: RefreshInterval;
  onChange: (value: RefreshInterval) => void;
}

export function AutoRefreshSelector({ value, onChange }: AutoRefreshSelectorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", value > 0 && "text-primary animate-spin")} style={value > 0 ? { animationDuration: "3s" } : undefined} />
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as RefreshInterval)}
        className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
      >
        {REFRESH_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
