
import * as React from "react";
import { Sparkles } from "lucide-react";

const DEFAULT_SUGGESTIONS = [
  { emoji: "📊", text: "지난 12개월 NPL 비율 추이" },
  { emoji: "🏭", text: "업종별 익스포저 TOP 5" },
  { emoji: "⚠️", text: "스트레스 시나리오별 총 손실 비교" },
  { emoji: "💧", text: "현재 LCR과 NSFR 수치" },
  { emoji: "📈", text: "VaR가 1300억원을 초과한 날" },
  { emoji: "🎯", text: "신용등급별 익스포저 비율" },
];

interface AiSuggestionsProps {
  onSelect: (question: string) => void;
}

export function AiSuggestions({ onSelect }: AiSuggestionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">AI에게 데이터를 분석해 달라고 질문하세요</span>
      </div>
      <div className="w-full flex flex-col gap-2">
        {DEFAULT_SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onSelect(s.text)}
            className="w-full flex items-center gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted hover:border-primary/30"
          >
            <span className="text-base leading-none">{s.emoji}</span>
            <span className="text-muted-foreground">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
