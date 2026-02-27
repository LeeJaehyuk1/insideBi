export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  data?: Record<string, unknown>[];
  chartType?: string;
  summary?: string;
  status: "idle" | "loading" | "success" | "error";
  timestamp: number;
}

export interface AiAskResponse {
  message_id: string;
  sql: string;
  data: Record<string, unknown>[];
  chart_type: string;
  summary: string;
}
