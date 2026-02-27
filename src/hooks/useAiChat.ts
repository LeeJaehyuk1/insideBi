"use client";

import { useState, useCallback } from "react";
import { ChatMessage, AiAskResponse } from "@/types/ai";
import { AI_API_URL } from "@/lib/constants";

function genId() {
  return Math.random().toString(36).slice(2, 11);
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const ask = useCallback(async (question: string) => {
    const userMsg: ChatMessage = {
      id: genId(),
      role: "user",
      content: question,
      status: "idle",
      timestamp: Date.now(),
    };

    const loadingId = genId();
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: "assistant",
      content: "",
      status: "loading",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    try {
      const res = await fetch(`${AI_API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "서버 오류" }));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      const data: AiAskResponse = await res.json();

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                id: data.message_id,
                content: data.summary,
                sql: data.sql,
                data: data.data,
                chartType: data.chart_type,
                fromCache: data.from_cache,
                status: "success",
              }
            : m
        )
      );
    } catch (err) {
      let message = "알 수 없는 오류가 발생했습니다.";
      if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        message =
          "AI 서버에 연결할 수 없습니다. FastAPI 서버가 실행 중인지 확인하세요.\n\n" +
          "cd ai-backend\nuvicorn main:app --reload --port 8000";
      } else if (err instanceof Error) {
        message = err.message;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: message, status: "error" }
            : m
        )
      );
    }
  }, []);

  const submitFeedback = useCallback(
    async (messageId: string, rating: "up" | "down") => {
      try {
        await fetch(`${AI_API_URL}/api/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message_id: messageId, rating }),
        });
      } catch {
        // 피드백 실패는 무시
      }
    },
    []
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, ask, submitFeedback, clearHistory };
}
