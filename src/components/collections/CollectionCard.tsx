import Link from "next/link";
import { ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Collection } from "@/types/collection";
import { CollectionIcon } from "./CollectionIcon";

interface CollectionCardProps {
  collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${collection.id}`}
      className="mb-card flex items-center gap-4 p-5 hover:border-primary/50 hover:shadow-md transition-all group"
    >
      <CollectionIcon icon={collection.icon} color={collection.color} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {collection.name}
          </p>
          {collection.personal && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.5 rounded-full shrink-0">
              <User className="h-2.5 w-2.5" />
              개인
            </span>
          )}
        </div>
        {collection.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{collection.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          항목 {collection.itemCount}개
        </p>
      </div>

      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}
