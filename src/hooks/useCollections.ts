"use client";

import * as React from "react";
import type { Collection, CollectionItem } from "@/types/collection";
import { collections as mockCollections } from "@/lib/mock-data/collections";

const STORAGE_KEY = "insightbi_collections_v3";

function readLocal(): Collection[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  // 초기화: mock-data deep copy
  return JSON.parse(JSON.stringify(mockCollections));
}

function writeLocal(data: Collection[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export function useCollections() {
  const [collections, setCollections] = React.useState<Collection[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setCollections(readLocal());
    setHydrated(true);
  }, []);

  const mutate = React.useCallback((updater: (prev: Collection[]) => Collection[]) => {
    setCollections((prev) => {
      const next = updater(prev);
      writeLocal(next);
      return next;
    });
  }, []);

  const createCollection = React.useCallback(
    (params: {
      name: string;
      description?: string;
      icon: string;
      color: string;
      textColor: string;
      personal?: boolean;
    }) => {
      const newCol: Collection = {
        id: `col-${Date.now()}`,
        name: params.name,
        description: params.description ?? "",
        icon: params.icon,
        color: params.color,
        textColor: params.textColor,
        itemCount: 0,
        items: [],
        createdAt: new Date().toISOString().split("T")[0],
        personal: params.personal,
      };
      mutate((prev) => [...prev, newCol]);
      return newCol;
    },
    [mutate]
  );

  const deleteCollection = React.useCallback(
    (id: string) => {
      mutate((prev) => prev.filter((c) => c.id !== id));
    },
    [mutate]
  );

  const addItem = React.useCallback(
    (collectionId: string, item: Omit<CollectionItem, "pinned">) => {
      mutate((prev) =>
        prev.map((c) => {
          if (c.id !== collectionId) return c;
          const newItem: CollectionItem = { ...item, pinned: false };
          const items = [newItem, ...(c.items ?? []).filter((i) => i.id !== item.id)];
          return { ...c, items, itemCount: items.length };
        })
      );
    },
    [mutate]
  );

  const removeItem = React.useCallback(
    (collectionId: string, itemId: string) => {
      mutate((prev) =>
        prev.map((c) => {
          if (c.id !== collectionId) return c;
          const items = (c.items ?? []).filter((i) => i.id !== itemId);
          return { ...c, items, itemCount: items.length };
        })
      );
    },
    [mutate]
  );

  const togglePinned = React.useCallback(
    (collectionId: string, itemId: string) => {
      mutate((prev) =>
        prev.map((c) => {
          if (c.id !== collectionId) return c;
          const items = (c.items ?? []).map((i) =>
            i.id === itemId ? { ...i, pinned: !i.pinned } : i
          );
          return { ...c, items };
        })
      );
    },
    [mutate]
  );

  const moveItem = React.useCallback(
    (itemId: string, fromId: string, toId: string) => {
      mutate((prev) => {
        let movedItem: CollectionItem | undefined;
        const step1 = prev.map((c) => {
          if (c.id !== fromId) return c;
          movedItem = (c.items ?? []).find((i) => i.id === itemId);
          const items = (c.items ?? []).filter((i) => i.id !== itemId);
          return { ...c, items, itemCount: items.length };
        });
        return step1.map((c) => {
          if (c.id !== toId || !movedItem) return c;
          const items = [movedItem, ...(c.items ?? [])];
          return { ...c, items, itemCount: items.length };
        });
      });
    },
    [mutate]
  );

  const getCollection = React.useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections]
  );

  return {
    collections,
    hydrated,
    createCollection,
    deleteCollection,
    addItem,
    removeItem,
    togglePinned,
    moveItem,
    getCollection,
  };
}
