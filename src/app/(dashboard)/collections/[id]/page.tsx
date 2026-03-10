"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionTableView } from "@/components/collections/CollectionTableView";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID } from "@/lib/mock-data/collection-folders";

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
  const { getFolder, hydrated, createFolder, removeEntry, renameEntry } = useCollectionFolders();

  if (!hydrated) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
      </div>
    );
  }

  const folder = getFolder(params.id);
  if (!folder) notFound();

  // 브레드크럼 빌드
  const breadcrumb: { label: string; href: string }[] = [];
  if (folder.parentId) {
    const parent = getFolder(folder.parentId);
    if (parent) {
      if (parent.parentId) {
        breadcrumb.push({ label: "...", href: `/collections/${parent.parentId}` });
      }
      breadcrumb.push({
        label: parent.name,
        href: parent.id === ROOT_ID ? "/collections" : `/collections/${parent.id}`,
      });
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <CollectionTableView
        folder={folder}
        breadcrumb={breadcrumb}
        onDelete={(id) => removeEntry(params.id, id)}
        onRename={(id, name) => renameEntry(params.id, id, name)}
        onCreateFolder={(name) => createFolder(name, params.id)}
      />
    </div>
  );
}
