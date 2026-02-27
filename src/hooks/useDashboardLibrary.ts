"use client";

import * as React from "react";
import { SavedDashboard } from "@/types/builder";

const LIB_KEY = "insidebi_dashboards_v1";

export function useDashboardLibrary() {
  const [library, setLibrary] = React.useState<SavedDashboard[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  // mount: load from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(LIB_KEY);
      setLibrary(raw ? JSON.parse(raw) : []);
    } catch {
      setLibrary([]);
    }
    setHydrated(true);
  }, []);

  // persist on library change
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(library));
    } catch {}
  }, [hydrated, library]);

  const saveDashboard = (dashboard: SavedDashboard) => {
    setLibrary((prev) => {
      const idx = prev.findIndex((d) => d.name === dashboard.name);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = dashboard;
        return next;
      }
      return [dashboard, ...prev];
    });
  };

  const deleteDashboard = (name: string) =>
    setLibrary((prev) => prev.filter((d) => d.name !== name));

  return { library, hydrated, saveDashboard, deleteDashboard };
}
