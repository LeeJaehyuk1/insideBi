
import { useState, useEffect } from "react";
import { SavedDashboard } from "@/types/builder";

const MY_KEY = "insightbi_my_dashboard";

export function useMyDashboard() {
  const [myDashboard, setMyDashboardState] = useState<SavedDashboard | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // mount: 서버에서 로드, 실패 시 localStorage 폴백
  useEffect(() => {
    fetch("/api/my-dashboard")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        setMyDashboardState(data.dashboard ?? null);
      })
      .catch(() => {
        try {
          const raw = localStorage.getItem(MY_KEY);
          setMyDashboardState(raw ? JSON.parse(raw) : null);
        } catch {
          setMyDashboardState(null);
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  const setMyDashboard = (d: SavedDashboard) => {
    setMyDashboardState(d);
    try { localStorage.setItem(MY_KEY, JSON.stringify(d)); } catch {}
    fetch("/api/my-dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    }).catch(() => {});
  };

  const clearMyDashboard = () => {
    setMyDashboardState(null);
    try { localStorage.removeItem(MY_KEY); } catch {}
    fetch("/api/my-dashboard", { method: "DELETE" }).catch(() => {});
  };

  return { myDashboard, hydrated, setMyDashboard, clearMyDashboard };
}
