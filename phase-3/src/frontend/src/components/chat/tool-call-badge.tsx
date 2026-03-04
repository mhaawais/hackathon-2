// T002 — ToolCallBadge
import type { ToolCallRecord } from "@/lib/chat-api";

interface ToolCallBadgeProps {
  toolCall: ToolCallRecord;
}

function summariseArgs(toolName: string, args: Record<string, unknown>): string {
  const { title, description, task_id, status } = args as Record<string, string | undefined>;
  switch (toolName) {
    case "add_task":
      return title ? `"${title}"${description ? ` — ${description}` : ""}` : "";
    case "list_tasks":
      return status && status !== "all" ? `status: ${status}` : "all tasks";
    case "complete_task":
      return task_id ? `task ${String(task_id).slice(0, 8)}…` : "";
    case "delete_task":
      return task_id ? `task ${String(task_id).slice(0, 8)}…` : "";
    case "update_task": {
      const parts: string[] = [];
      if (title) parts.push(`title: "${title}"`);
      if (description) parts.push(`desc: "${description}"`);
      return parts.join(", ") || "";
    }
    default:
      return "";
  }
}

const toolIcons: Record<string, string> = {
  add_task: "＋",
  list_tasks: "≡",
  complete_task: "✓",
  delete_task: "✕",
  update_task: "✎",
};

export function ToolCallBadge({ toolCall }: ToolCallBadgeProps) {
  const { tool_name, arguments: args, result } = toolCall;
  const icon = toolIcons[tool_name] ?? "⚙";
  const summary = summariseArgs(tool_name, args);
  const hasError = typeof result.error === "string";
  const label = tool_name.replace(/_/g, " ");

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
        hasError
          ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300"
          : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300",
      ].join(" ")}
      title={hasError ? String(result.error) : JSON.stringify(result)}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}{summary ? `: ${summary}` : ""}</span>
    </span>
  );
}
