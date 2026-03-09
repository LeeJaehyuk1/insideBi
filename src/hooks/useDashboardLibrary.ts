"use client";

import * as React from "react";
import { SavedDashboard } from "@/types/builder";

const LIB_KEY = "insightbi_dashboards_v1";

function readLocal(): SavedDashboard[] {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(library: SavedDashboard[]) {
  try { localStorage.setItem(LIB_KEY, JSON.stringify(library)); } catch {}
}

export function useDashboardLibrary() {
  const [library, setLibrary] = React.useState<SavedDashboard[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // mount: 서버에서 로드, 실패 시 localStorage 폴백
  React.useEffect(() => {
    fetch("/api/dashboards")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        const serverLib: SavedDashboard[] = Array.isArray(data.dashboards)
          ? data.dashboards
          : [];
        setLibrary(serverLib);
        writeLocal(serverLib);
      })
      .catch(() => {
        setLibrary(readLocal());
      })
      .finally(() => setHydrated(true));
  }, []);

  const saveDashboard = (dashboard: SavedDashboard) => {
    setLibrary((prev) => {
      const idx = prev.findIndex((d) => d.name === dashboard.name);
      const next =
        idx >= 0
          ? prev.map((d) => (d.name === dashboard.name ? dashboard : d))
          : [dashboard, ...prev];
      writeLocal(next);
      return next;
    });
    fetch("/api/dashboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dashboard),
    }).catch(() => {});
  };

  const deleteDashboard = (name: string) => {
    setLibrary((prev) => {
      const next = prev.filter((d) => d.name !== name);
      writeLocal(next);
      return next;
    });
    fetch(`/api/dashboards/${encodeURIComponent(name)}`, {
      method: "DELETE",
    }).catch(() => {});
  };

  return { library, hydrated, saveDashboard, deleteDashboard };
}
