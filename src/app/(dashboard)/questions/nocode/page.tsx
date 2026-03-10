"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SlidersHorizontal } from "lucide-react";
import { NoCodeBuilder } from "@/components/questions/NoCodeBuilder";

function NoCodePageInner() {
  const params = useSearchParams();
  const datasetId = params.get("dataset") ?? "";
  const collectionId = params.get("collection") ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
          <SlidersHorizontal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">새 질문</h1>
          <p className="text-sm text-muted-foreground">
            테이블을 선택하고 필터·요약 조건을 설정한 뒤 시각화하세요
          </p>
        </div>
      </div>
      <NoCodeBuilder initialDatasetId={datasetId} collectionId={collectionId} />
    </div>
  );
}

export default function NoCodePage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 rounded-xl bg-muted" />}>
      <NoCodePageInner />
    </Suspense>
  );
}
