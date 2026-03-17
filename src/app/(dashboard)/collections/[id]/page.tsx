"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionTableView } from "@/components/collections/CollectionTableView";
import { CollectionSidebar } from "@/components/collections/CollectionSidebar";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID } from "@/lib/mock-data/collection-folders";

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  const { getFolder, hydrated, createFolder, removeEntry, renameEntry, togglePin } = useCollectionFolders();

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] -m-6">
        <div className="w-56 border-r border-border p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const folder = getFolder(params.id);
  if (!folder) notFound();

  /* 브레드크럼 */
  const breadcrumb: { label: string; href: string }[] = [];
  if (folder.parentId) {
    const parent = getFolder(folder.parentId);
    if (parent) {
      breadcrumb.push({
        label: parent.name,
        href: parent.id === ROOT_ID ? "/collections" : `/collections/${parent.id}`,
      });
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 overflow-hidden">
      <CollectionSidebar />
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <CollectionTableView
          folder={folder}
          breadcrumb={breadcrumb}
          onDelete={(id) => removeEntry(params.id, id)}
          onRename={(id, name) => renameEntry(params.id, id, name)}
          onCreateFolder={(name) => createFolder(name, params.id)}
          onTogglePin={(id) => togglePin(params.id, id)}
        />
      </main>
    </div>
  );
}
