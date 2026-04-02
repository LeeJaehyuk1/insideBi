
import * as React from "react";
import { ChatMessage, AiAskResponse, LLMProvider, ProviderInfo } from "@/types/ai";
import { apiFetch } from "@/lib/api-client";

interface AiChatContextValue {
  messages: ChatMessage[];
  ask: (question: string) => void;
  submitFeedback: (messageId: string, rating: "up" | "down", question?: string, sql?: string) => Promise<void>;
  clearHistory: () => void;
  provider: LLMProvider;
  setProvider: (p: LLMProvider) => void;
  providers: ProviderInfo[];
}

const AiChatContext = React.createContext<AiChatContextValue | null>(null);

/** 서버에 저장할 때 data(대용량 배열) 제외 */
function stripData(msgs: ChatMessage[]) {
  return msgs.map(({ data: _, ...m }) => m);
}

function persistHistory(msgs: ChatMessage[]) {
  apiFetch("/api/chat-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: stripData(msgs) }),
  }).catch(() => {});
}

export function AiChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [provider, setProvider] = React.useState<LLMProvider>("groq");
  const [providers, setProviders] = React.useState<ProviderInfo[]>([]);
  const abortRef = React.useRef<AbortController | null>(null);

  // 마운트 시 사용 가능한 프로바이더 목록 로드
  React.useEffect(() => {
    apiFetch("/api/providers")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data.providers)) {
          setProviders(data.providers);
          // 첫 번째 사용 가능한 프로바이더로 기본값 설정
          const first = data.providers.find((p: ProviderInfo) => p.available);
          if (first) setProvider(first.id as LLMProvider);
        }
      })
      .catch(() => {});
  }, []);

  // 마운트 시 서버에서 히스토리 복원
  React.useEffect(() => {
    apiFetch("/api/chat-history")
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
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
        const res = await apiFetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, provider }),
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
                  provider: (data.provider || provider) as LLMProvider,
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
  }, [provider]);

  const submitFeedback = React.useCallback(
    async (messageId: string, rating: "up" | "down", question?: string, sql?: string) => {
      try {
        await apiFetch("/api/feedback", {
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
    apiFetch("/api/chat-history", { method: "DELETE" }).catch(() => {});
  }, []);

  const value = React.useMemo(
    () => ({ messages, ask, submitFeedback, clearHistory, provider, setProvider, providers }),
    [messages, ask, submitFeedback, clearHistory, provider, providers]
  );

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>;
}

export function useAiChat(): AiChatContextValue {
  const ctx = React.useContext(AiChatContext);
  if (!ctx) throw new Error("useAiChat must be used within AiChatProvider");
  return ctx;
}
