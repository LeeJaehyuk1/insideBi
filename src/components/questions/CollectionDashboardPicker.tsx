"use client";

import * as React from "react";
import {
  X, Search, Clock, FolderOpen, User2, Users, LayoutDashboard,
  ChevronRight, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollectionFolders } from "@/hooks/useCollectionFolders";
import { useDashboardLibrary } from "@/hooks/useDashboardLibrary";
import { ROOT_ID, PERSONAL_ID } from "@/lib/mock-data/collection-folders";
import { useRole } from "@/context/RoleContext";

type Tab = "recent" | "browse";

interface PickResult {
  type: "dashboard" | "collection";
  id: string;
  name: string;
}

interface CollectionDashboardPickerProps {
  onSelect: (result: PickResult) => void;
  onClose: () => void;
}

/* ── 우측 패널 항목 ── */
interface RightItem {
  id: string;
  name: string;
  type: "dashboard" | "collection";
}

export function CollectionDashboardPicker({ onSelect, onClose }: CollectionDashboardPickerProps) {
  const { folders, createFolder } = useCollectionFolders();
  const { library, saveDashboard } = useDashboardLibrary();
  const { userName } = useRole();

  const [tab, setTab] = React.useState<Tab>("browse");
  const [search, setSearch] = React.useState("");
  const [selectedColId, setSelectedColId] = React.useState<string>(ROOT_ID);
  const [selectedItem, setSelectedItem] = React.useState<PickResult | null>(null);

  // 새 대시보드 / 새 컬렉션 입력
  const [newDashInput, setNewDashInput] = React.useState(false);
  const [newDashName, setNewDashName] = React.useState("");
  const [newColInput, setNewColInput] = React.useState(false);
  const [newColName, setNewColName] = React.useState("");

  /* ── 왼쪽 컬렉션 목록 ── */
  const leftItems = [
    { id: ROOT_ID,     label: "우리의 분석",          icon: FolderOpen, hasArrow: true  },
    { id: PERSONAL_ID, label: `${userName}님의 개인 컬렉션`, icon: User2,      hasArrow: false },
    { id: "all-personal", label: "모든 개인 컬렉션",   icon: Users,      hasArrow: true  },
  ];

  /* ── 우측 항목 계산 ── */
  const rightItems: RightItem[] = React.useMemo(() => {
    const items: RightItem[] = [];
    const folder = folders.find((f) => f.id === selectedColId);
    if (folder) {
      folder.entries.forEach((e) => {
        items.push({ id: e.id, name: e.name, type: e.type === "collection" ? "collection" : "dashboard" });
      });
    }
    // 대시보드 라이브러리도 추가 (ROOT_ID 선택 시)
    if (selectedColId === ROOT_ID) {
      library.forEach((d) => {
        if (!items.find((i) => i.name === d.name)) {
          items.push({ id: `db-${d.name}`, name: d.name, type: "dashboard" });
        }
      });
    }
    // 검색 필터
    if (search.trim()) {
      return items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    return items;
  }, [folders, library, selectedColId, search]);

  /* ── 최근 탭 ── */
  const recentItems: RightItem[] = library.slice(0, 5).map((d) => ({
    id: `db-${d.name}`, name: d.name, type: "dashboard",
  }));

  /* ── 새 대시보드 생성 ── */
  const handleCreateDash = () => {
    if (!newDashName.trim()) return;
    saveDashboard({ name: newDashName.trim(), widgets: [], savedAt: new Date().toISOString() });
    const item: PickResult = { type: "dashboard", id: `db-${newDashName.trim()}`, name: newDashName.trim() };
    setSelectedItem(item);
    setNewDashName("");
    setNewDashInput(false);
  };

  /* ── 새 컬렉션 생성 ── */
  const handleCreateCollection = () => {
    if (!newColName.trim()) return;
    createFolder(newColName.trim(), selectedColId === "all-personal" ? PERSONAL_ID : selectedColId);
    setNewColName("");
    setNewColInput(false);
  };

  const displayItems = tab === "recent" ? recentItems : rightItems;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="relative w-full bg-background rounded-2xl shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        style={{ maxWidth: 720, maxHeight: "80vh" }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0">
          <h2 className="text-lg font-bold text-foreground">컬렉션 또는 대시보드 선택</h2>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 검색 */}
        <div className="px-6 pb-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="찾다..."
              className="w-full rounded-lg border border-input bg-muted/20 pl-9 pr-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* 탭 */}
        <div className="flex items-center px-6 border-b border-border shrink-0">
          {([
            { id: "recent" as Tab, label: "최근", icon: Clock },
            { id: "browse" as Tab, label: "찾아보기", icon: FolderOpen },
          ]).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-1 py-3 mr-5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </button>
          ))}
        </div>

        {/* 본문 */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 왼쪽: 컬렉션 목록 (찾아보기 탭만) */}
          {tab === "browse" && (
            <div className="w-56 shrink-0 border-r border-border overflow-y-auto py-2">
              {leftItems.map((item) => {
                const Icon = item.icon;
                const isActive = selectedColId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setSelectedColId(item.id); setSelectedItem(null); }}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-left transition-colors",
                      isActive ? "bg-muted/60 text-foreground font-medium" : "text-foreground hover:bg-muted/40"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.hasArrow && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* 우측: 항목 목록 */}
          <div className="flex-1 overflow-y-auto py-2">
            {displayItems.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                {search ? `"${search}" 에 해당하는 항목이 없습니다` : "항목이 없습니다"}
              </div>
            ) : (
              displayItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem({ type: item.type, id: item.id, name: item.name })}
                    className={cn(
                      "flex items-center gap-3 w-full px-5 py-3 text-sm text-left transition-colors rounded-lg mx-2",
                      isSelected
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-muted/50"
                    )}
                    style={{ width: "calc(100% - 1rem)" }}
                  >
                    {item.type === "collection"
                      ? <FolderOpen className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-primary")} />
                      : <LayoutDashboard className={cn("h-4 w-4 shrink-0", isSelected ? "text-white" : "text-primary")} />
                    }
                    <span className="flex-1 font-medium truncate">{item.name}</span>
                    {item.type === "collection" && (
                      <ChevronRight className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-white" : "text-muted-foreground")} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 하단 입력 영역 */}
        {(newDashInput || newColInput) && (
          <div className="px-6 py-3 border-t border-border bg-muted/10 shrink-0">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newDashInput ? newDashName : newColName}
                onChange={(e) => newDashInput ? setNewDashName(e.target.value) : setNewColName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") newDashInput ? handleCreateDash() : handleCreateCollection();
                  if (e.key === "Escape") { setNewDashInput(false); setNewColInput(false); }
                }}
                placeholder={newDashInput ? "대시보드 이름..." : "컬렉션 이름..."}
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={newDashInput ? handleCreateDash : handleCreateCollection}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => { setNewDashInput(false); setNewColInput(false); }}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-background shrink-0 rounded-b-2xl">
          {/* 좌측: 새 대시보드 / 새로운 컬렉션 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setNewDashInput(true); setNewColInput(false); }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-primary" />새 대시보드
            </button>
            <button
              onClick={() => { setNewColInput(true); setNewDashInput(false); }}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <FolderOpen className="h-3.5 w-3.5 text-primary" />새로운 컬렉션
            </button>
          </div>

          {/* 우측: 취소 / 선택 */}
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              취소
            </button>
            <button
              onClick={() => { if (selectedItem) { onSelect(selectedItem); onClose(); } }}
              disabled={!selectedItem}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              이 대시보드 선택
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
