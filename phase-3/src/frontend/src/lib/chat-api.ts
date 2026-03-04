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
}

export interface ChatApiResponse {
  conversation_id: number;
  response: string;
  tool_calls: ToolCallRecord[];
}
