"use client";

import { useState, useEffect } from "react";
import { SavedDashboard } from "@/types/builder";

const MY_KEY = "insidebi_my_dashboard";

export function useMyDashboard() {
  const [myDashboard, setMyDashboardState] = useState<SavedDashboard | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MY_KEY);
      setMyDashboardState(raw ? JSON.parse(raw) : null);
    } catch {
      setMyDashboardState(null);
    }
    setHydrated(true);
  }, []);

  const setMyDashboard = (d: SavedDashboard) => {
    setMyDashboardState(d);
    try { localStorage.setItem(MY_KEY, JSON.stringify(d)); } catch {}
  };

  const clearMyDashboard = () => {
    setMyDashboardState(null);
    try { localStorage.removeItem(MY_KEY); } catch {}
  };

  return { myDashboard, hydrated, setMyDashboard, clearMyDashboard };
}
