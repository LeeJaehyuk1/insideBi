"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Table2, FolderOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DatasetPickerGrid } from "@/components/questions/DatasetPickerGrid";

export default function QuestionPickPage() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"choose" | "table">("choose");
  const [selected, setSelected] = React.useState<string>("");

  const handleDatasetSelect = (id: string) => {
    setSelected(id);
    router.push(`/questions/nocode?dataset=${id}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
          <Table2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">새 질문</h1>
          <p className="text-sm text-muted-foreground">데이터 소스를 선택하세요</p>
        </div>
      </div>

      {mode === "choose" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 테이블 선택 */}
          <button
            onClick={() => setMode("table")}
            className="group flex items-start gap-4 rounded-xl border-2 border-dashed bg-card p-6 text-left hover:border-primary hover:bg-primary/5 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 shrink-0">
              <Table2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors">테이블 선택</p>
              <p className="text-sm text-muted-foreground mt-1">
                데이터셋을 선택하고 클릭만으로 질문을 만들어보세요
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5 group-hover:text-primary transition-colors" />
          </button>

          {/* 컬렉션에서 선택 */}
          <button
            onClick={() => router.push("/collections")}
            className="group flex items-start gap-4 rounded-xl border-2 border-dashed bg-card p-6 text-left hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 shrink-0">
              <FolderOpen className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-base font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">컬렉션에서 선택</p>
              <p className="text-sm text-muted-foreground mt-1">
                저장된 질문이나 대시보드에서 시작하세요
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground mt-0.5" />
          </button>
        </div>
      )}

      {mode === "table" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode("choose")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 뒤로
            </button>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-medium text-foreground">테이블 선택</span>
          </div>
          <p className="text-sm text-muted-foreground">분석할 데이터셋을 선택하세요</p>
          <DatasetPickerGrid onSelect={handleDatasetSelect} selected={selected} />
        </div>
      )}
    </div>
  );
}
