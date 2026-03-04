"use client";

import * as React from "react";
import { Search, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { emoji: "📊", text: "지난 12개월 NPL 비율 추이" },
  { emoji: "💧", text: "현재 LCR과 NSFR 수치" },
  { emoji: "📈", text: "VaR 한도 대비 현황" },
  { emoji: "🏭", text: "업종별 익스포저 TOP 5" },
  { emoji: "⚠️", text: "스트레스 시나리오별 총 손실" },
  { emoji: "🎯", text: "신용등급별 익스포저 비율" },
];

interface AiSearchBarProps {
  onSearch: (question: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function AiSearchBar({ onSearch, compact = false, disabled = false }: AiSearchBarProps) {
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const q = value.trim();
    if (!q || disabled) return;
    onSearch(q);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("w-full space-y-3", compact ? "max-w-full" : "max-w-2xl mx-auto space-y-4")}>
      {/* Search input */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border bg-background px-4 transition-all cursor-text",
          compact ? "py-2 shadow-sm" : "py-3 shadow-lg",
          "focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/60",
          disabled && "opacity-60 pointer-events-none"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className={cn("shrink-0 text-muted-foreground", compact ? "h-4 w-4" : "h-5 w-5")} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={compact ? "추가로 질문하세요..." : "데이터에 대해 질문하세요... (예: NPL 비율이 가장 높은 업종은?)"}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "flex items-center justify-center rounded-xl transition-colors shrink-0",
            compact ? "h-7 w-7" : "h-8 w-8",
            value.trim() && !disabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground"
          )}
        >
          <ArrowUp className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </div>

      {/* Suggestion chips — only in full mode */}
      {!compact && (
        <div className="flex flex-wrap gap-2 justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.text}
              onClick={() => onSearch(s.text)}
              disabled={disabled}
              className="flex items-center gap-1.5 rounded-full border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:border-primary/30 disabled:opacity-50"
            >
              <span>{s.emoji}</span>
              <span>{s.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
