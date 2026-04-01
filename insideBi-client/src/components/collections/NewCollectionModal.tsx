
import * as React from "react";
import { X, FolderPlus, ChevronDown, Check, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";

interface NewCollectionModalProps {
  open: boolean;
  onClose: () => void;
}

const PARENT_OPTIONS = [
  { id: ROOT_ID,     label: "우리의 분석",        icon: FolderOpen },
  { id: PERSONAL_ID, label: "개인 컬렉션",         icon: FolderOpen },
];

export function NewCollectionModal({ open, onClose }: NewCollectionModalProps) {
  const navigate = useNavigate();
  const { folders, createFolder } = useCollectionFolders();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [parentId, setParentId] = React.useState<string>(ROOT_ID);
  const [parentPickerOpen, setParentPickerOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const parentPickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (parentPickerRef.current && !parentPickerRef.current.contains(e.target as Node)) {
        setParentPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleClose = () => {
    onClose();
    setName("");
    setDescription("");
    setParentId(ROOT_ID);
    setSubmitted(false);
    setParentPickerOpen(false);
  };

  const handleCreate = () => {
    setSubmitted(true);
    if (!name.trim()) return;
    const newId = createFolder(name.trim(), parentId);
    handleClose();
    navigate(`/collections/${newId}`);
  };

  // 선택 가능한 부모: 기본 컬렉션 + 생성된 하위 컬렉션
  const parentOptions = [
    ...PARENT_OPTIONS,
    ...folders
      .filter((f) => f.id !== ROOT_ID && f.id !== PERSONAL_ID)
      .map((f) => ({ id: f.id, label: f.name, icon: FolderOpen })),
  ];

  const selectedParent = parentOptions.find((p) => p.id === parentId) ?? parentOptions[0];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <FolderPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-none">새 컬렉션</h2>
              <p className="text-xs text-muted-foreground mt-0.5">질문과 대시보드를 폴더로 묶어 정리하세요</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* 이름 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">컬렉션 이름 <span className="text-red-500">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") handleClose(); }}
              placeholder="예: Q1 리스크 분석, 월간 보고서..."
              className={cn(
                "w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-colors",
                submitted && !name.trim()
                  ? "border-red-400 focus:ring-red-300/40"
                  : "border-input bg-background focus:ring-primary/30"
              )}
            />
            {submitted && !name.trim() && (
              <p className="text-xs text-red-500">이름을 입력해 주세요</p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              설명 <span className="text-xs font-normal text-muted-foreground">(선택)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 컬렉션에 대한 간단한 설명"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* 상위 컬렉션 선택 */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">어느 컬렉션 안에 만들까요?</label>
            <div ref={parentPickerRef} className="relative">
              <button
                onClick={() => setParentPickerOpen((p) => !p)}
                className="flex items-center justify-between w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground font-medium">{selectedParent.label}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", parentPickerOpen && "rotate-180")} />
              </button>

              {parentPickerOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 z-10 rounded-xl border border-border bg-background shadow-xl max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-100">
                  <div className="p-1.5 space-y-0.5">
                    {parentOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => { setParentId(opt.id); setParentPickerOpen(false); }}
                        className={cn(
                          "flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-colors text-left",
                          parentId === opt.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        <FolderOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate">{opt.label}</span>
                        {parentId === opt.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button
            onClick={handleClose}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            컬렉션 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
