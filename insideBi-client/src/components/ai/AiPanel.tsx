
import * as React from "react";
import { Bot, Trash2, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAiChat } from "@/hooks/useAiChat";
import { AiChatMessage } from "./AiChatMessage";
import { AiSuggestions } from "./AiSuggestions";
import { cn } from "@/lib/utils";
import type { LLMProvider } from "@/types/ai";

const PROVIDER_STYLES: Record<LLMProvider, { active: string; dot: string; label: string }> = {
  groq:   { active: "border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300", dot: "bg-orange-400", label: "Groq" },
  gemini: { active: "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",           dot: "bg-blue-400",   label: "Gemini" },
  claude: { active: "border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300", dot: "bg-purple-400", label: "Claude" },
};

interface AiPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuestion?: string;
}

export function AiPanel({ open, onOpenChange, defaultQuestion }: AiPanelProps) {
  const { messages, ask, submitFeedback, clearHistory, provider, setProvider, providers } = useAiChat();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isLoading = messages.some((m) => m.status === "loading");
  const askedRef = React.useRef<string | undefined>(undefined);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
      if (defaultQuestion && defaultQuestion !== askedRef.current) {
        askedRef.current = defaultQuestion;
        ask(defaultQuestion);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultQuestion]);

  const handleSubmit = () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    ask(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeProvider = PROVIDER_STYLES[provider];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[520px] max-w-[95vw] flex flex-col p-0 gap-0 h-full">
        {/* Header */}
        <SheetHeader className="pl-4 pr-12 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-base font-semibold">AI 데이터 분석</SheetTitle>
            </div>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={clearHistory}
                title="대화 기록 초기화"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* 프로바이더 선택 */}
          <div className="flex items-center gap-1.5 pt-1">
            {(["groq", "gemini", "claude"] as LLMProvider[]).map((p) => {
              const meta = providers.find((x) => x.id === p);
              const style = PROVIDER_STYLES[p];
              const isActive = provider === p;
              // providers 로드 전이면 모두 선택 가능, 로드 후엔 available 기준
              const isUnavailable = providers.length > 0 && meta?.available === false;

              return (
                <button
                  key={p}
                  onClick={() => !isUnavailable && setProvider(p)}
                  title={isUnavailable ? `${style.label} — API 키 미설정` : `${style.label}${meta ? ` (${meta.model})` : ""}`}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-lg border transition-all",
                    isActive
                      ? style.active
                      : "border-border text-muted-foreground hover:bg-muted",
                    isUnavailable && "opacity-35 cursor-not-allowed"
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", isActive ? style.dot : "bg-muted-foreground/40")} />
                  {style.label}
                  {isUnavailable && <span className="text-[9px] opacity-60">미설정</span>}
                </button>
              );
            })}
          </div>
        </SheetHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          <div className="py-4 space-y-1">
            {messages.length === 0 ? (
              <AiSuggestions onSelect={(q) => ask(q)} />
            ) : (
              messages.map((msg) => (
                <AiChatMessage
                  key={msg.id}
                  message={msg}
                  onFeedback={submitFeedback}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <Separator />

        {/* Input area */}
        <div className="px-4 py-3 shrink-0">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="한국어로 질문하세요... (Enter = 전송, Shift+Enter = 줄바꿈)"
              className="flex-1 min-h-[44px] max-h-[120px] text-sm"
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="shrink-0 h-9 w-9"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className={cn("mt-1.5 text-[10px]", activeProvider.active.includes("orange") ? "text-orange-500" : activeProvider.active.includes("blue") ? "text-blue-500" : "text-purple-500")}>
            {activeProvider.label} · {providers.find(p => p.id === provider)?.model ?? ""} · 데이터 조회 전용
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
