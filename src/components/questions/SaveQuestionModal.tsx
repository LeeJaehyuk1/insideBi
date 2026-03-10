"use client";

import * as React from "react";
import { X, LayoutDashboard, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollectionPickerModal } from "@/components/dashboard/CollectionPickerModal";
import { useDashboardLibrary } from "@/hooks/useDashboardLibrary";
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
  onSave: (title: string, description: string, collectionId: string, dashboardName?: string, tabId?: string) => void;
  tableLabel: string;
  filters: FilterParam[];
  columnLabels: Record<string, string>;
  defaultCollectionId?: string;
}

export function SaveQuestionModal({
  open, onClose, onSave,
  tableLabel, filters, columnLabels, defaultCollectionId,
}: SaveQuestionModalProps) {
  const { library } = useDashboardLibrary();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [collectionId, setCollectionId] = React.useState(defaultCollectionId ?? "our-analytics");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [selectedDash, setSelectedDash] = React.useState<string>("");
  const [selectedTab, setSelectedTab] = React.useState("탭 1");

  // 이름 자동 생성 (모달 열릴 때마다)
  React.useEffect(() => {
    if (open) {
      setName(buildAutoName(tableLabel, filters, columnLabels));
      setDescription("");
      setSelectedDash(library[0]?.name ?? "");
      setSelectedTab("탭 1");
    }
  }, [open]); // eslint-disable-line

  const selectedDashboard = library.find((d) => d.name === selectedDash);
  const tabs = selectedDashboard?.tabData?.map((t) => t.label) ?? ["탭 1"];

  if (!open) return null;

  return (
    <>
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
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) onSave(name.trim(), description, collectionId, selectedDash || undefined, selectedTab); }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* 비고 */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">비고</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이건 선택 사항인데 도움이 됩니다"
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {/* 어디에 저장 */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">어디에 저장하시겠습니까?</label>
              {library.length > 0 ? (
                <button
                  onClick={() => setPickerOpen(true)}
                  className="flex items-center justify-between w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium">{selectedDash || "저장 위치 선택"}</span>
                  </div>
                  <span className="text-muted-foreground tracking-widest">···</span>
                </button>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  저장된 대시보드가 없습니다
                </div>
              )}
            </div>

            {/* 어느 탭 */}
            {selectedDash && tabs.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">어느 탭에 넣어야 하나요?</label>
                <div className="relative">
                  <select
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10 cursor-pointer"
                  >
                    {tabs.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* 푸터 */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
            <button onClick={onClose} className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              취소
            </button>
            <button
              onClick={() => { if (name.trim()) onSave(name.trim(), description, collectionId, selectedDash || undefined, selectedTab); }}
              disabled={!name.trim()}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              저장
            </button>
          </div>
        </div>
      </div>

      {/* 대시보드 선택 피커 */}
      {pickerOpen && (
        <DashPickerModal
          selected={selectedDash}
          dashboards={library.map((d) => d.name)}
          onSelect={(name) => { setSelectedDash(name); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}

/* ── 대시보드 선택 미니 모달 ── */
function DashPickerModal({ selected, dashboards, onSelect, onClose }: {
  selected: string;
  dashboards: string[];
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-background rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">대시보드 선택</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="py-2">
          {dashboards.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">저장된 대시보드가 없습니다</p>
          ) : (
            dashboards.map((name) => (
              <button
                key={name}
                onClick={() => onSelect(name)}
                className={cn(
                  "flex items-center gap-3 w-full px-5 py-3 text-left text-sm transition-colors",
                  selected === name ? "bg-primary/5 text-primary font-medium" : "hover:bg-muted text-foreground"
                )}
              >
                <LayoutDashboard className="h-4 w-4 shrink-0 text-primary" />
                {name}
              </button>
            ))
          )}
        </div>
        <div className="flex justify-end px-5 py-3 border-t border-border">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">닫기</button>
        </div>
      </div>
    </div>
  );
}
