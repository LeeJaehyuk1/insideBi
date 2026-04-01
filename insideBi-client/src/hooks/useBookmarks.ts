
import * as React from "react";

export type BookmarkType = "question" | "dashboard" | "collection";

export interface BookmarkItem {
  id: string;
  type: BookmarkType;
  name: string;
  href: string;
}

const LS_KEY = "insightbi_bookmarks_v1";

function load(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(items: BookmarkItem[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch {}
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = React.useState<BookmarkItem[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setBookmarks(load());
    setHydrated(true);
  }, []);

  const isBookmarked = React.useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const toggle = React.useCallback((item: BookmarkItem) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === item.id);
      const next = exists ? prev.filter((b) => b.id !== item.id) : [...prev, item];
      persist(next);
      return next;
    });
  }, []);

  return { bookmarks, hydrated, isBookmarked, toggle };
}
