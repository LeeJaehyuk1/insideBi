
import * as React from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookmarks, BookmarkItem } from "@/hooks/useBookmarks";

interface BookmarkButtonProps {
  item: BookmarkItem;
  className?: string;
  size?: "sm" | "md";
}

export function BookmarkButton({ item, className, size = "sm" }: BookmarkButtonProps) {
  const { isBookmarked, toggle } = useBookmarks();
  const marked = isBookmarked(item.id);

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(item); }}
      title={marked ? "북마크 해제" : "북마크"}
      className={cn(
        "flex items-center justify-center rounded-md transition-colors",
        size === "sm" ? "h-7 w-7" : "h-8 w-8",
        marked
          ? "text-amber-500 hover:text-amber-600"
          : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30",
        className
      )}
    >
      <Bookmark
        className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", marked && "fill-current")}
      />
    </button>
  );
}
