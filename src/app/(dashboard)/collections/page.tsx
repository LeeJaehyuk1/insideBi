"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionTableView } from "@/components/collections/CollectionTableView";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID } from "@/lib/mock-data/collection-folders";

export default function CollectionsPage() {
  const { getFolder, hydrated, createFolder, removeEntry, renameEntry } = useCollectionFolders();

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  const folder = getFolder(ROOT_ID);
  if (!folder) return <div className="text-muted-foreground p-8">컬렉션을 불러올 수 없습니다.</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <CollectionTableView
        folder={folder}
        onDelete={(id) => removeEntry(ROOT_ID, id)}
        onRename={(id, name) => renameEntry(ROOT_ID, id, name)}
        onCreateFolder={(name) => createFolder(name, ROOT_ID)}
      />
    </div>
  );
}
