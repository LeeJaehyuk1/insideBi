"use client";

import * as React from "react";
import type { CollectionFolder, FolderEntry, EntryType } from "@/lib/mock-data/collection-folders";
import { collectionFolders, ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";

const LS_KEY = "insightbi_collection_folders_v2";
const USER_NAME_KEY = "insightbi_user_name_v1";

function load(): CollectionFolder[] {
  if (typeof window === "undefined") return JSON.parse(JSON.stringify(collectionFolders));
  try {
    const s = localStorage.getItem(LS_KEY);
    if (s) {
      const stored: CollectionFolder[] = JSON.parse(s);
      // mock에 있는 폴더가 저장 데이터에 없으면 추가 (신규 폴더 보장)
      const ids = new Set(stored.map((f) => f.id));
      const merged = [...stored];
      for (const f of collectionFolders) {
        if (!ids.has(f.id)) merged.push(JSON.parse(JSON.stringify(f)));
      }
      return merged;
    }
  } catch {}
  return JSON.parse(JSON.stringify(collectionFolders));
}

function save(data: CollectionFolder[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch {}
}

export function useCollectionFolders() {
  const [folders, setFolders] = React.useState<CollectionFolder[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    const userName = localStorage.getItem(USER_NAME_KEY) || "사용자";
    const loaded = load().map((f) =>
      f.id === PERSONAL_ID ? { ...f, name: `${userName}님의 개인 컬렉션` } : f
    );
    setFolders(loaded);
    setHydrated(true);
  }, []);

  const mutate = React.useCallback((fn: (prev: CollectionFolder[]) => CollectionFolder[]) => {
    setFolders((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });
  }, []);

  const getFolder = React.useCallback(
    (id: string) => folders.find((f) => f.id === id),
    [folders]
  );

  /** 새 하위 컬렉션 폴더 생성 */
  const createFolder = React.useCallback(
    (name: string, parentId: string = ROOT_ID) => {
      const id = `col-${Date.now()}`;
      const newFolder: CollectionFolder = { id, name, parentId, entries: [] };
      const entry: FolderEntry = {
        id, type: "collection", name,
        href: `/collections/${id}`,
      };
      mutate((prev) => [
        ...prev.map((f) =>
          f.id === parentId
            ? { ...f, entries: [...f.entries, entry] }
            : f
        ),
        newFolder,
      ]);
      return id;
    },
    [mutate]
  );

  /** 엔트리 추가 — router.push 전에도 반드시 반영되도록 localStorage에 직접 동기 저장 */
  const addEntry = React.useCallback(
    (folderId: string, entry: FolderEntry) => {
      // 1) localStorage에서 최신 데이터를 직접 읽어 동기적으로 저장
      const current = load();
      const next = current.map((f) =>
        f.id === folderId
          ? {
              ...f,
              entries: [
                entry,
                ...f.entries.filter((e) => e.id !== entry.id && e.name !== entry.name)
              ]
            }
          : f
      );
      save(next);
      // 2) React 상태도 동기화
      setFolders(next);
    },
    []
  );

  /** 엔트리 제거 */
  const removeEntry = React.useCallback(
    (folderId: string, entryId: string) => {
      mutate((prev) =>
        prev.map((f) =>
          f.id === folderId
            ? { ...f, entries: f.entries.filter((e) => e.id !== entryId) }
            : f
        )
      );
    },
    [mutate]
  );

  /** 이름 변경 */
  const renameEntry = React.useCallback(
    (folderId: string, entryId: string, name: string) => {
      mutate((prev) =>
        prev.map((f) =>
          f.id === folderId
            ? { ...f, entries: f.entries.map((e) => e.id === entryId ? { ...e, name } : e) }
            : f
        )
      );
    },
    [mutate]
  );

  return { folders, hydrated, getFolder, createFolder, addEntry, removeEntry, renameEntry };
}
