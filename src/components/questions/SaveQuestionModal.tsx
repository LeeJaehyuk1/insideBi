"use client";

import * as React from "react";
import { X, FolderOpen, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID } from "@/lib/mock-data/collection-folders";
import type { FilterParam } from "@/types/query";

const OPERATOR_LABEL: Record<string, string> = {
  eq: "is", neq: "is not", contains: "contains", not_contains: "not contains",
  starts: "starts with", ends: "ends with", empty: "is empty", not_empty: "is not empty",
  gte: "≥", lte: "≤",
};

function buildAutoName(tableLabel: string, filters: FilterParam[], columnLabels: Record<string, string>): string {
  if (!filters.length) return tableLabel;
  const parts = filters.slice(0, 2).map((f) => {
    const col = columnLabels[f.column] ?? f.column;
    const op = OPERATOR_LABEL[f.operator] ?? f.operator;
    const val = f.operator === "empty" || f.operator === "not_empty" ? "" : ` ${f.value}`;
    return `${col} ${op}${val}`;
  });
  return `${tableLabel}, 필터링 기준: ${parts.join(", ")}`;
}

interface SaveQuestionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, collectionId: string) => void;
  tableLabel: string;
  filters: FilterParam[];
  columnLabels: Record<string, string>;
  defaultCollectionId?: string;
}

export function SaveQuestionModal({
  open, onClose, onSave,
  tableLabel, filters, columnLabels, defaultCollectionId,
}: SaveQuestionModalProps) {
  const { folders, hydrated } = useCollectionFolders();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [collectionId, setCollectionId] = React.useState(defaultCollectionId ?? ROOT_ID);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setName(buildAutoName(tableLabel, filters, columnLabels));
      setDescription("");
      setCollectionId(defaultCollectionId ?? ROOT_ID);
      setPickerOpen(false);
    }
  }, [open]); // eslint-disable-line

  // 피커 외부 클릭 시 닫기
  React.useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (!open) return null;

  // 표시할 폴더 목록 (루트 + 하위 컬렉션)
  const folderOptions = hydrated
    ? folders.map((f) => ({ id: f.id, name: f.name }))
    : [{ id: ROOT_ID, name: "우리의 분석" }];

  const selectedFolder = folderOptions.find((f) => f.id === collectionId);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description, collectionId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <h2 className="text-xl font-bold text-foreground">새 질문 저장</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">

          {/* 이름 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">이름</label>
            <input
              autoFocus value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleSave(); }}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 비고 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">비고</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="이건 선택 사항인데 도움이 됩니다" rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* 저장 위치 (컬렉션 선택) */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">저장할 컬렉션</label>
            <div ref={pickerRef} className="relative">
              <button
                onClick={() => setPickerOpen((p) => !p)}
                className="flex items-center justify-between w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium">{selectedFolder?.name ?? "컬렉션 선택"}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", pickerOpen && "rotate-180")} />
              </button>

              {/* 드롭다운 폴더 목록 */}
              {pickerOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-background shadow-xl animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto">
                  {folderOptions.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => { setCollectionId(folder.id); setPickerOpen(false); }}
                      className={cn(
                        "flex items-center justify-between w-full px-4 py-3 text-sm text-left transition-colors",
                        folder.id === collectionId
                          ? "bg-primary/8 text-primary font-medium"
                          : "text-foreground hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <FolderOpen className={cn("h-4 w-4 shrink-0", folder.id === collectionId ? "text-primary" : "text-muted-foreground")} />
                        <span>{folder.name}</span>
                      </div>
                      {folder.id === collectionId && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">취소</button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
