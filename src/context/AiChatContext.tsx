"use client";

import * as React from "react";
import { ChatMessage, AiAskResponse } from "@/types/ai";

interface AiChatContextValue {
  messages: ChatMessage[];
  ask: (question: string) => void;
  submitFeedback: (messageId: string, rating: "up" | "down", question?: string, sql?: string) => Promise<void>;
  clearHistory: () => void;
}

const AiChatContext = React.createContext<AiChatContextValue | null>(null);

/** 서버에 저장할 때 data(대용량 배열) 제외 */
function stripData(msgs: ChatMessage[]) {
  return msgs.map(({ data: _, ...m }) => m);
}

function persistHistory(msgs: ChatMessage[]) {
  fetch("/api/chat-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: stripData(msgs) }),
  }).catch(() => {});
}

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const abortRef = React.useRef<AbortController | null>(null);

  // 마운트 시 서버에서 히스토리 복원
  React.useEffect(() => {
    fetch("/api/chat-history")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {}); // 서버 없으면 빈 상태로 시작
  }, []);

  const ask = React.useCallback((question: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
      status: "idle",
      timestamp: Date.now(),
    };
    const loadingId = crypto.randomUUID();
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: "assistant",
      content: "",
      status: "loading",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    (async () => {
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "서버 오류" }));
          throw new Error(err.detail ?? `HTTP ${res.status}`);
        }

        const data: AiAskResponse = await res.json();

        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  id: data.message_id,
                  content: data.summary,
                  question,
                  sql: data.sql,
                  data: data.data,
                  chartType: data.chart_type,
                  fromCache: data.from_cache,
                  status: "success" as const,
                }
              : m
          );
          persistHistory(next);
          return next;
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        let message = "알 수 없는 오류가 발생했습니다.";
        if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
          message = "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.";
        } else if (err instanceof Error) {
          message = err.message;
        }
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === loadingId ? { ...m, content: message, status: "error" as const } : m
          );
          persistHistory(next);
          return next;
        });
      }
    })();
  }, []);

  const submitFeedback = React.useCallback(
    async (messageId: string, rating: "up" | "down", question?: string, sql?: string) => {
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_id: messageId, rating, question, sql }),
        });
      } catch {
        // 피드백 실패는 무시
      }
    },
    []
  );

  const clearHistory = React.useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    fetch("/api/chat-history", { method: "DELETE" }).catch(() => {});
  }, []);

  const value = React.useMemo(
    () => ({ messages, ask, submitFeedback, clearHistory }),
    [messages, ask, submitFeedback, clearHistory]
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}

export function useAiChat(): AiChatContextValue {
  const ctx = React.useContext(AiChatContext);
  if (!ctx) throw new Error("useAiChat must be used within AiChatProvider");
  return ctx;
}
