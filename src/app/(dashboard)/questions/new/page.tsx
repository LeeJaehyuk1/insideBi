import { MessageSquarePlus } from "lucide-react";
import { NotebookEditor } from "@/components/questions/NotebookEditor";

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
          <MessageSquarePlus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">새 질문</h1>
          <p className="text-sm text-muted-foreground">데이터셋을 선택하고 필터를 설정하여 데이터를 분석하세요</p>
        </div>
      </div>
      <NotebookEditor />
    </div>
  );
}
