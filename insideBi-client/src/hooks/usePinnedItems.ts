
import * as React from "react";

const STORAGE_KEY = "insightbi_pinned_v1";

export interface PinnedItem {
  id: string;
  title: string;
  type: "dashboard" | "question" | "report" | "collection" | "page";
  href: string;
  description?: string;
  pinnedAt: string;
}

export function usePinnedItems() {
  const [items, setItems] = React.useState<PinnedItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  const persist = (next: PinnedItem[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const pin = React.useCallback((item: Omit<PinnedItem, "pinnedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const next = [{ ...item, pinnedAt: new Date().toISOString() }, ...filtered];
      persist(next);
      return next;
    });
  }, []);

  const unpin = React.useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const isPinned = React.useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const toggle = React.useCallback(
    (item: Omit<PinnedItem, "pinnedAt">) => {
      if (items.some((i) => i.id === item.id)) unpin(item.id);
      else pin(item);
    },
    [items, pin, unpin]
  );

  return { items, hydrated, pin, unpin, toggle, isPinned };
}
