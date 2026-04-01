
import * as React from "react";
import { NAV_ITEMS } from "@/lib/constants";

const STORAGE_KEY = "insightbi_recently_viewed_v1";
const MAX_ITEMS = 8;

export interface RecentItem {
  href: string;
  title: string;
  icon: string;
  description: string;
  visitedAt: string;
}

/** 페이지 방문 기록 (layout에서 pathname 변경 시 호출) */
export function recordVisit(href: string): void {
  try {
    const navItem = NAV_ITEMS.find((item) => item.href === href);
    if (!navItem) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: RecentItem[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter((i) => i.href !== href);
    const newItem: RecentItem = {
      href: navItem.href,
      title: navItem.title,
      icon: navItem.icon,
      description: navItem.description,
      visitedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

/** 최근 방문 항목 읽기 훅 */
export function useRecentlyViewed() {
  const [items, setItems] = React.useState<RecentItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  const refresh = React.useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
  }, []);

  return { items, hydrated, refresh };
}
