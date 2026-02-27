"use client";

import * as React from "react";
import { Trash2, Home } from "lucide-react";
import { format } from "date-fns";
import { SavedDashboard } from "@/types/builder";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardLibraryProps {
  library: SavedDashboard[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (dashboard: SavedDashboard) => void;
  onDelete: (name: string) => void;
  onSetHome: (dashboard: SavedDashboard) => void;
  onClearHome: () => void;
  homeName: string | null;
}

export function DashboardLibrary({
  library,
  open,
  onOpenChange,
  onLoad,
  onDelete,
  onSetHome,
  onClearHome,
  homeName,
}: DashboardLibraryProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-sm flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-base">대시보드 라이브러리</SheetTitle>
          <p className="text-xs text-muted-foreground">
            저장된 대시보드 {library.length}개
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-3">
          {library.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <p className="text-sm">저장된 대시보드가 없습니다</p>
              <p className="text-xs">대시보드를 구성하고 저장해 보세요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {library.map((dashboard) => {
                const isHome = dashboard.name === homeName;
                return (
                  <div
                    key={dashboard.name}
                    className={cn(
                      "rounded-lg border bg-card px-4 py-3 flex flex-col gap-2 hover:bg-muted/30 transition-colors",
                      isHome && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate">{dashboard.name}</p>
                          {isHome && (
                            <span className="shrink-0 text-[10px] font-medium bg-primary/10 text-primary rounded px-1 py-0.5 leading-none">
                              홈
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(new Date(dashboard.savedAt), "yyyy-MM-dd HH:mm")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          위젯 {dashboard.widgets.length}개
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-7 w-7",
                            isHome
                              ? "text-primary hover:text-primary/80"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => isHome ? onClearHome() : onSetHome(dashboard)}
                          title={isHome ? "홈 해제" : "홈으로 설정"}
                        >
                          <Home
                            className={cn(
                              "h-3.5 w-3.5",
                              isHome && "fill-primary/20"
                            )}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          onClick={() => onDelete(dashboard.name)}
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs"
                      onClick={() => onLoad(dashboard)}
                    >
                      불러오기
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
