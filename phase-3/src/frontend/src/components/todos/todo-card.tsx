"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  created_at: string;
}

interface TodoCardProps {
  todo: Todo;
  onComplete: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Individual todo item card with complete toggle, edit, and delete actions.
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
            <Badge variant={todo.status} className="shrink-0" />
          </div>

          {todo.description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {todo.description}
            </p>
          )}

          {/* Footer row */}
          <div className="mt-2.5 flex items-center gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(todo.created_at)}
            </span>

            <div className="flex-1" />

            {/* Action buttons — always visible, more prominent on hover */}
            <div className="flex items-center gap-1.5">
              {/* Edit — only for pending */}
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

              {/* Delete */}
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
