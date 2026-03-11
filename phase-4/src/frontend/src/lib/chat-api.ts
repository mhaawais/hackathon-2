// T001 — Chat API types

export interface ToolCallRecord {
  tool_name: string;
  arguments: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCallRecord[];
  timestamp?: string; // ISO string
}

export interface ChatApiResponse {
  conversation_id: number;
  response: string;
  tool_calls: ToolCallRecord[];
}
