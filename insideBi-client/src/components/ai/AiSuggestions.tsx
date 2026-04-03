
import * as React from "react";
import { Sparkles } from "lucide-react";

interface AiSuggestionsProps {
  onSelect: (question: string) => void;
}

export function AiSuggestions({ onSelect: _ }: AiSuggestionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">AI에게 데이터를 분석해 달라고 질문하세요</span>
      </div>
    </div>
  );
}
