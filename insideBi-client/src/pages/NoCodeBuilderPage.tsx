import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import { NoCodeBuilder } from "@/components/questions/NoCodeBuilder";

export default function NoCodeBuilderPage() {
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get("dataset") ?? "";
  const collectionId = searchParams.get("collection") ?? "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
          <SlidersHorizontal className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">새 질문</h1>
          <p className="text-sm text-muted-foreground">데이터를 시각적으로 탐색하세요</p>
        </div>
      </div>
      <NoCodeBuilder initialDatasetId={datasetId} collectionId={collectionId} />
    </div>
  );
}
