"use client";

import * as React from "react";
import { X, Search, Clock, FolderOpen, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { collections } from "@/lib/mock-data/collections";

interface CollectionPickerModalProps {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

type Tab = "recent" | "collection";

export function CollectionPickerModal({ selected, onSelect, onClose }: CollectionPickerModalProps) {
  const [tab, setTab] = React.useState<Tab>("recent");
  const [search, setSearch] = React.useState("");
  const [tempSelected, setTempSelected] = React.useState(selected);

  const filtered = collections.filter((c) =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase())
  );

  // 최근 탭: personal 컬렉션을 먼저 (mock)
  const recentList = [...collections].sort((a) => (a.personal ? -1 : 1));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        style={{ maxHeight: "80vh" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0">
          <h2 className="text-lg font-bold text-foreground">컬렉션 선택</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 검색 */}
        <div className="px-6 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="찾다..."
              className="w-full rounded-lg border border-input bg-muted/20 pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* 탭 */}
        <div className="flex items-center px-6 border-b border-border shrink-0">
          {([
            { id: "recent" as Tab, label: "최근", icon: Clock },
            { id: "collection" as Tab, label: "컬렉션", icon: FolderOpen },
          ]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-1 py-3 mr-5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto bg-muted/10">
          {tab === "recent" ? (
            <>
              <p className="px-6 pt-4 pb-2 text-xs font-semibold text-muted-foreground">오늘</p>
              <div className="mx-4 rounded-lg border border-border overflow-hidden">
                {recentList.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setTempSelected(c.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3.5 text-left transition-colors",
                      i > 0 && "border-t border-border",
                      tempSelected === c.id ? "bg-primary/5" : "bg-background hover:bg-muted/40"
                    )}
                  >
                    <Folder className={cn("h-4 w-4 shrink-0", tempSelected === c.id ? "text-primary" : "text-primary")} />
                    <span className={cn(
                      "flex-1 text-sm font-medium",
                      tempSelected === c.id ? "text-primary" : "text-foreground"
                    )}>
                      {c.name}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Folder className="h-3.5 w-3.5" />
                      우리의 분석에서
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-2">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                  일치하는 컬렉션이 없습니다
                </div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTempSelected(c.id)}
                    className={cn(
                      "flex items-center gap-3 w-full px-6 py-3 text-left transition-colors",
                      tempSelected === c.id ? "bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <Folder className="h-4 w-4 text-primary shrink-0" />
                    <span className={cn(
                      "flex-1 text-sm font-medium",
                      tempSelected === c.id ? "text-primary" : "text-foreground"
                    )}>
                      {c.name}
                    </span>
                    {c.personal && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">개인</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border bg-background shrink-0 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => onSelect(tempSelected)}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
}
