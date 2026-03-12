"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  tags: string[];
  due_date: string | null;
  status: "pending" | "completed";
  created_at: string;
}

interface TodoCardProps {
  todo: Todo;
  onComplete: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDueDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isOverdue = date < now;
  const formatted = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  return isOverdue ? `Overdue: ${formatted}` : `Due ${formatted}`;
}

function isDueSoon(isoString: string): boolean {
  const due = new Date(isoString);
  const now = new Date();
  const msIn24h = 24 * 60 * 60 * 1000;
  return due.getTime() - now.getTime() < msIn24h;
}

/**
 * Individual todo item card with priority badge, tag chips, due date, and actions.
 */
export function TodoCard({ todo, onComplete, onEdit, onDelete }: TodoCardProps) {
  const [completing, setCompleting] = React.useState(false);
  const isCompleted = todo.status === "completed";

  async function handleComplete() {
    setCompleting(true);
    try {
      await onComplete(todo.id);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div
      className={[
        "group rounded-2xl border bg-white dark:bg-slate-800 p-4 transition-all duration-200",
        "hover:shadow-md hover:shadow-slate-200/60 dark:hover:shadow-slate-900/60",
        "hover:-translate-y-0.5",
        isCompleted
          ? "border-slate-100 dark:border-slate-700/50 opacity-80"
          : "border-slate-200 dark:border-slate-700",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox-style complete toggle */}
        <button
          onClick={handleComplete}
          disabled={completing}
          className={[
            "mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 transition-all duration-150 flex items-center justify-center",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
            completing ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
            isCompleted
              ? "bg-green-500 border-green-500"
              : "border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500",
          ].join(" ")}
          aria-label={isCompleted ? "Mark as pending" : "Mark as complete"}
        >
          {isCompleted && (
            <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={[
                "text-sm font-medium leading-snug truncate",
                isCompleted
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : "text-slate-900 dark:text-white",
              ].join(" ")}
            >
              {todo.title}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Priority badge */}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${PRIORITY_STYLES[todo.priority] ?? PRIORITY_STYLES.medium}`}>
                {todo.priority}
              </span>
              <Badge variant={todo.status} className="shrink-0" />
            </div>
          </div>

          {todo.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {todo.description}
            </p>
          )}

          {/* Tag chips */}
          {todo.tags && todo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {todo.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer row */}
          <div className="mt-2.5 flex items-center gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(todo.created_at)}
            </span>

            {/* Due date */}
            {todo.due_date && !isCompleted && (
              <span className={`text-xs flex items-center gap-1 ${isDueSoon(todo.due_date) ? "text-red-500 dark:text-red-400 font-semibold" : "text-slate-400 dark:text-slate-500"}`}>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDueDate(todo.due_date)}
              </span>
            )}

            <div className="flex-1" />

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              {!isCompleted && (
                <button
                  onClick={() => onEdit(todo)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 transition-colors"
                  aria-label="Edit task"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => onDelete(todo.id)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-900/30 transition-colors"
                aria-label="Delete task"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { Todo };
