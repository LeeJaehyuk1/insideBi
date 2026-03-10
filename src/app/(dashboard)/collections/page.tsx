"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionTableView } from "@/components/collections/CollectionTableView";
import { CollectionSidebar } from "@/components/collections/CollectionSidebar";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID } from "@/lib/mock-data/collection-folders";

export default function CollectionsPage() {
  const { getFolder, hydrated, createFolder, removeEntry, renameEntry } = useCollectionFolders();

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] -m-6">
        <div className="w-64 border-r border-border p-4 space-y-3">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const folder = getFolder(ROOT_ID);
  if (!folder) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 overflow-hidden">
      <CollectionSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <CollectionTableView
          folder={folder}
          onDelete={(id) => removeEntry(ROOT_ID, id)}
          onRename={(id, name) => renameEntry(ROOT_ID, id, name)}
          onCreateFolder={(name) => createFolder(name, ROOT_ID)}
        />
      </main>
    </div>
  );
}
