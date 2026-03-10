"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollections } from "@/hooks/useCollections";
import { CollectionIcon } from "./CollectionIcon";
import type { CollectionItem } from "@/types/collection";
import { Check } from "lucide-react";

interface AddToCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Omit<CollectionItem, "pinned">;
}

export function AddToCollectionDialog({
  open,
  onOpenChange,
  item,
}: AddToCollectionDialogProps) {
  const { collections, addItem } = useCollections();
  const [selectedId, setSelectedId] = React.useState<string>("");

  const handleAdd = () => {
    if (!selectedId) return;
    addItem(selectedId, item);
    onOpenChange(false);
    setSelectedId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>컬렉션에 추가</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
          <p className="text-xs text-muted-foreground px-1 mb-3">
            &ldquo;{item.title}&rdquo; 을(를) 추가할 컬렉션을 선택하세요
          </p>
          {collections.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setSelectedId(col.id)}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                selectedId === col.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
            >
              <CollectionIcon icon={col.icon} color={col.color} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{col.name}</p>
                <p className="text-xs text-muted-foreground">{col.itemCount}개 항목</p>
              </div>
              {selectedId === col.id && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleAdd} disabled={!selectedId}>
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
