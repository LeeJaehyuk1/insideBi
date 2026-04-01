
import * as React from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CollectionPickerModal } from "./CollectionPickerModal";
import { collections } from "@/lib/mock-data/collections";

interface NewDashboardModalProps {
  open: boolean;
  onClose: () => void;
  defaultCollectionId?: string;
}

export function NewDashboardModal({ open, onClose, defaultCollectionId }: NewDashboardModalProps) {
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [collectionId, setCollectionId] = React.useState(defaultCollectionId ?? "our-analytics");

  // defaultCollectionId 변경 시 동기화
  React.useEffect(() => {
    if (defaultCollectionId) setCollectionId(defaultCollectionId);
  }, [defaultCollectionId]);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const selectedCollection = collections.find((c) => c.id === collectionId) ?? collections[0];

  const handleClose = () => {
    onClose();
    setName("");
    setDescription("");
    setSubmitted(false);
    setPickerOpen(false);
  };

  const handleCreate = () => {
    setSubmitted(true);
    if (!name.trim()) return;
    navigate(`/dashboards/new?name=${encodeURIComponent(name.trim())}&collection=${collectionId}`);
    handleClose();
  };

  if (!open) return null;

  return (
    <>
      {/* 새 대시보드 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">

          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 pt-6 pb-5">
            <h2 className="text-xl font-bold text-foreground">새 대시보드</h2>
            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 pb-6 space-y-5">

            {/* 이름 */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">이름</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                placeholder="대시보드의 이름은 무엇으로 할까요?"
                className={cn(
                  "w-full rounded-lg border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-colors",
                  submitted && !name.trim()
                    ? "border-red-400 focus:ring-red-300/40"
                    : "border-input focus:ring-primary/30 bg-background"
                )}
              />
              {submitted && !name.trim() && (
                <p className="text-xs text-red-500 font-medium">필수의</p>
              )}
            </div>

            {/* 비고 */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">비고</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이건 선택 사항인데 도움이 됩니다"
                rows={2}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* 컬렉션 선택 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                어느 컬렉션에 들어가야 하나요?
              </label>
              <button
                onClick={() => setPickerOpen(true)}
                className="flex items-center justify-between w-full rounded-lg border border-input bg-background px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
              >
                <span>{selectedCollection.name}</span>
                <span className="text-muted-foreground text-base tracking-widest">···</span>
              </button>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
            <button
              onClick={handleClose}
              className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              생성
            </button>
          </div>
        </div>
      </div>

      {/* 컬렉션 피커 모달 (중첩) */}
      {pickerOpen && (
        <CollectionPickerModal
          selected={collectionId}
          onSelect={(id) => { setCollectionId(id); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
