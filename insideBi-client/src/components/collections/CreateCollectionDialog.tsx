
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { value: "FolderOpen", label: "📁" },
  { value: "BarChart3",  label: "📊" },
  { value: "Star",       label: "⭐" },
  { value: "ShieldAlert",label: "🛡" },
  { value: "FileText",   label: "📄" },
  { value: "Database",   label: "🗄" },
  { value: "BookOpen",   label: "📖" },
];

const COLOR_OPTIONS = [
  { color: "bg-blue-500",    textColor: "text-blue-600",    label: "파랑" },
  { color: "bg-violet-500",  textColor: "text-violet-600",  label: "보라" },
  { color: "bg-emerald-500", textColor: "text-emerald-600", label: "초록" },
  { color: "bg-amber-500",   textColor: "text-amber-600",   label: "주황" },
  { color: "bg-rose-500",    textColor: "text-rose-600",    label: "빨강" },
  { color: "bg-cyan-500",    textColor: "text-cyan-600",    label: "청록" },
  { color: "bg-slate-500",   textColor: "text-slate-600",   label: "회색" },
];

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (params: {
    name: string;
    description?: string;
    icon: string;
    color: string;
    textColor: string;
    personal?: boolean;
  }) => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateCollectionDialogProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [icon, setIcon] = React.useState(ICON_OPTIONS[0].value);
  const [colorIdx, setColorIdx] = React.useState(0);
  const [personal, setPersonal] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon,
      color: COLOR_OPTIONS[colorIdx].color,
      textColor: COLOR_OPTIONS[colorIdx].textColor,
      personal,
    });
    setName("");
    setDescription("");
    setIcon(ICON_OPTIONS[0].value);
    setColorIdx(0);
    setPersonal(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>새 컬렉션 만들기</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 이름 */}
          <div className="space-y-1.5">
            <Label htmlFor="col-name">이름 *</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 리스크 분석"
              required
            />
          </div>

          {/* 설명 */}
          <div className="space-y-1.5">
            <Label htmlFor="col-desc">설명 (선택)</Label>
            <Input
              id="col-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="컬렉션에 대한 간단한 설명"
            />
          </div>

          {/* 아이콘 */}
          <div className="space-y-1.5">
            <Label>아이콘</Label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIcon(opt.value)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors",
                    icon === opt.value
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 색상 */}
          <div className="space-y-1.5">
            <Label>색상</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.color}
                  type="button"
                  onClick={() => setColorIdx(idx)}
                  className={cn(
                    "flex h-7 w-7 rounded-full border-2 transition-transform",
                    opt.color,
                    colorIdx === idx ? "border-foreground scale-110" : "border-transparent"
                  )}
                  title={opt.label}
                />
              ))}
            </div>
          </div>

          {/* 개인 컬렉션 */}
          <div className="flex items-center gap-2">
            <input
              id="col-personal"
              type="checkbox"
              checked={personal}
              onChange={(e) => setPersonal(e.target.checked)}
              className="h-4 w-4 rounded border accent-primary"
            />
            <Label htmlFor="col-personal" className="cursor-pointer">
              개인 컬렉션
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              만들기
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
