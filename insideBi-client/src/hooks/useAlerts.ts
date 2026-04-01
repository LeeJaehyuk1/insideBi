
import * as React from "react";
import { alerts as STATIC_ALERTS } from "@/lib/mock-data";
import type { Alert } from "@/types/risk";

const LS_KEY = "insightbi_alerts_read_v1";

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const arr: string[] = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export function useAlerts() {
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setReadIds(loadReadIds());
    setHydrated(true);
  }, []);

  const alerts: Alert[] = STATIC_ALERTS.map((a) => ({
    ...a,
    isRead: readIds.has(a.id),
  }));

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const markRead = React.useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllRead = React.useCallback(() => {
    const next = new Set<string>(STATIC_ALERTS.map((a) => a.id));
    saveReadIds(next);
    setReadIds(next);
  }, []);

  return { alerts, unreadCount, hydrated, markRead, markAllRead };
}
