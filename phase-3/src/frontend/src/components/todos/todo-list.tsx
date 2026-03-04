import React from "react";
import { TodoCard, type Todo } from "./todo-card";
import { TodoCardSkeleton } from "@/components/ui/skeleton";

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  filterActive: boolean;
  onComplete: (id: string) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string) => void;
}

/**
 * Todo list wrapper. Handles loading skeletons, empty states, and renders todo cards.
 */
export function TodoList({
  todos,
  loading,
  filterActive,
  onComplete,
  onEdit,
  onDelete,
}: TodoListProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading tasks">
        <TodoCardSkeleton />
        <TodoCardSkeleton />
        <TodoCardSkeleton />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <svg
            className="h-10 w-10 text-slate-300 dark:text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          {filterActive ? "No matching tasks" : "No tasks yet"}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {filterActive
            ? "Try a different filter or search term."
            : "Add a task above to get started."}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Task list">
      {todos.map((todo) => (
        <li key={todo.id}>
          <TodoCard
            todo={todo}
            onComplete={onComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
