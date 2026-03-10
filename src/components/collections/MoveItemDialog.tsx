"use client";

import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollections } from "@/hooks/useCollections";
import { CollectionIcon } from "./CollectionIcon";
import { Check } from "lucide-react";

interface MoveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemTitle: string;
  fromCollectionId: string;
}

export function MoveItemDialog({
  open,
  onOpenChange,
  itemId,
  itemTitle,
  fromCollectionId,
}: MoveItemDialogProps) {
  const { collections, moveItem } = useCollections();
  const [selectedId, setSelectedId] = React.useState<string>("");

  const targets = collections.filter((c) => c.id !== fromCollectionId);

  const handleMove = () => {
    if (!selectedId) return;
    moveItem(itemId, fromCollectionId, selectedId);
    onOpenChange(false);
    setSelectedId("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>항목 이동</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-2 max-h-72 overflow-y-auto">
          <p className="text-xs text-muted-foreground px-1 mb-3">
            &ldquo;{itemTitle}&rdquo; 을(를) 이동할 컬렉션을 선택하세요
          </p>
          {targets.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              이동할 컬렉션이 없습니다
            </p>
          )}
          {targets.map((col) => (
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
          <Button onClick={handleMove} disabled={!selectedId || targets.length === 0}>
            이동
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
