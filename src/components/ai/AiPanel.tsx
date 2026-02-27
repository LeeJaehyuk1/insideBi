"use client";

import * as React from "react";
import { Bot, Trash2, Send } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAiChat } from "@/hooks/useAiChat";
import { AiChatMessage } from "./AiChatMessage";
import { AiSuggestions } from "./AiSuggestions";

interface AiPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AiPanel({ open, onOpenChange }: AiPanelProps) {
  const { messages, ask, submitFeedback, clearHistory } = useAiChat();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const isLoading = messages.some((m) => m.status === "loading");

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus textarea when panel opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] max-w-full flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
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
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef as React.RefObject<HTMLDivElement>}>
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
          </div>
        </ScrollArea>

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
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Powered by Ollama · 데이터 조회 전용 (쓰기 불가)
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
