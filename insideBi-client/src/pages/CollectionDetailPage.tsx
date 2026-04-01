import * as React from "react";
import { useParams, Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionTableView } from "@/components/collections/CollectionTableView";
import { CollectionSidebar } from "@/components/collections/CollectionSidebar";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID } from "@/lib/mock-data/collection-folders";

export default function CollectionDetailPage() {
  const { id = ROOT_ID } = useParams<{ id: string }>();
  const { getFolder, hydrated, createFolder, removeEntry, renameEntry, togglePin } = useCollectionFolders();

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] -m-6">
        <div className="w-56 border-r border-border p-4 space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      </div>
    );
  }

  const folder = getFolder(id);
  if (!folder) return <Navigate to="/collections" replace />;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6 overflow-hidden">
      <CollectionSidebar />
      <div className="flex-1 overflow-auto p-6">
        <CollectionTableView
          folder={folder}
          onCreateFolder={(name) => createFolder(id, name)}
          onDelete={(entryId) => removeEntry(id, entryId)}
          onRename={(entryId, name) => renameEntry(id, entryId, name)}
          onTogglePin={(entryId) => togglePin(id, entryId)}
        />
      </div>
    </div>
  );
}
