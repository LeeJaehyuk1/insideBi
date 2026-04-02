export type LLMProvider = "groq" | "gemini" | "claude";

export interface ProviderInfo {
  id: LLMProvider;
  name: string;
  model: string;
  color: string;
  available: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  question?: string;
  sql?: string;
  data?: Record<string, unknown>[];
  chartType?: string;
  summary?: string;
  fromCache?: boolean;
  provider?: LLMProvider;
  status: "idle" | "loading" | "success" | "error";
  timestamp: number;
}

export interface AiAskResponse {
  message_id: string;
  sql: string;
  data: Record<string, unknown>[];
  chart_type: string;
  summary: string;
  from_cache: boolean;
  provider?: string;
  backend?: string;
}
