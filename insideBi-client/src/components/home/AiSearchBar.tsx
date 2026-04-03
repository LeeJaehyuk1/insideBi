import * as React from "react";
import { ArrowUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiSearchBarProps {
  onSearch: (question: string) => void;
  compact?: boolean;
  disabled?: boolean;
}

export function AiSearchBar({ onSearch, compact = false, disabled = false }: AiSearchBarProps) {
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const question = value.trim();
    if (!question || disabled) return;
    onSearch(question);
    setValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("w-full", compact ? "max-w-full" : "mx-auto max-w-2xl")}>
      <div
        className={cn(
          "flex cursor-text items-center gap-3 rounded-2xl border bg-background px-4 transition-all",
          compact ? "py-2 shadow-sm" : "py-3 shadow-lg",
          "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/40",
          disabled && "pointer-events-none opacity-60",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <Search className={cn("shrink-0 text-muted-foreground", compact ? "h-4 w-4" : "h-5 w-5")} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={compact ? "추가로 질문해보세요..." : "데이터에 대해 질문해보세요..."}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          disabled={disabled}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl transition-colors",
            compact ? "h-7 w-7" : "h-8 w-8",
            value.trim() && !disabled
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground",
          )}
        >
          <ArrowUp className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </button>
      </div>
    </div>
  );
}
