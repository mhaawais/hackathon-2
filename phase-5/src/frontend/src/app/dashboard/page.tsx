"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearAuthCache } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppNavbar } from "@/components/layout/app-navbar";
import { TodoStats } from "@/components/todos/todo-stats";
import { TodoForm } from "@/components/todos/todo-form";
import { TodoList } from "@/components/todos/todo-list";
import { TodoEditModal } from "@/components/todos/todo-edit-modal";
import { TodoFilterBar, type FilterState } from "@/components/todos/todo-filter-bar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import type { Todo } from "@/components/todos/todo-card";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Inner dashboard (needs access to useToast) ────────────────────────────
function DashboardInner() {
  const router = useRouter();
  const { showToast } = useToast();

  // Data
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "all",
    priority: "all",
    sortBy: "created_at",
    sortDir: "desc",
  });

  // Modal state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchTodos = useCallback(async (f?: FilterState) => {
    const active = f ?? filters;
    try {
      const params = new URLSearchParams();
      if (active.status !== "all") params.set("status", active.status);
      if (active.priority !== "all") params.set("priority", active.priority);
      if (active.search) params.set("search", active.search);
      params.set("sort_by", active.sortBy);
      params.set("sort_dir", active.sortDir);

      const query = params.toString();
      const data = await api.get<Todo[]>(`/todos${query ? `?${query}` : ""}`);
      setTodos(data);
    } catch {
      // 401 handled by api client (redirects to sign-in)
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchTodos(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Re-fetch when tab regains focus
  useEffect(() => {
    function onFocus() { fetchTodos(); }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchTodos]);

  useEffect(() => {
    authClient.getSession().then((session) => {
      const email = session?.data?.user?.email ?? null;
      const name = session?.data?.user?.name ?? null;
      setUserEmail(email);
      setUserName(name);
    });
  }, []);

  // ── Stats (from all todos without filters) ─────────────────────────────
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.status === "completed").length;
    const pending = total - completed;
    return { total, pending, completed };
  }, [todos]);

  const isFiltered =
    filters.status !== "all" ||
    filters.priority !== "all" ||
    filters.search.trim() !== "";

  // ── Handlers ─────────────────────────────────────────────────────────
  async function handleAdd(data: {
    title: string;
    description: string | null;
    priority: "high" | "medium" | "low";
    tags: string[];
    due_date: string | null;
    is_recurring: boolean;
    recurrence_frequency: "daily" | "weekly" | "monthly" | null;
  }) {
    try {
      await api.post<Todo>("/todos", data);
      showToast("Task added!");
      await fetchTodos();
    } catch {
      showToast("Failed to add task. Try again.", "error");
      throw new Error("Failed to add");
    }
  }

  async function handleComplete(id: string) {
    try {
      await api.patch<Todo>(`/todos/${id}/complete`);
      const updated = todos.find((t) => t.id === id);
      const wasCompleted = updated?.status === "completed";
      showToast(wasCompleted ? "Marked as pending" : "Marked as complete!");
      setTodos((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
            : t
        )
      );
    } catch {
      showToast("Failed to update status.", "error");
    }
  }

  async function handleSaveEdit(
    id: string,
    data: {
      title: string;
      description: string | null;
      priority: "high" | "medium" | "low";
      tags: string[];
      due_date: string | null;
      is_recurring: boolean;
      recurrence_frequency: "daily" | "weekly" | "monthly" | null;
    }
  ) {
    try {
      await api.patch<Todo>(`/todos/${id}`, data);
      showToast("Task updated!");
      setEditingTodo(null);
      await fetchTodos();
    } catch {
      showToast("Failed to save changes.", "error");
      throw new Error("Failed to update");
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/todos/${deleteId}`);
      showToast("Task deleted!");
      setDeleteId(null);
      setTodos((prev) => prev.filter((t) => t.id !== deleteId));
    } catch {
      showToast("Failed to delete task.", "error");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    clearAuthCache();
    await authClient.signOut();
    router.push("/sign-in");
  }

  const greeting = getGreeting();
  const displayName = userName ?? userEmail ?? "there";

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppNavbar
        userEmail={userEmail}
        userName={userName}
        onSignOut={handleSignOut}
        signingOut={signingOut}
        search={filters.search}
        onSearchChange={(s) => setFilters((f) => ({ ...f, search: s }))}
      />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome banner */}
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/30">
          <h1 className="text-xl font-bold tracking-tight">
            {greeting}, {displayName.split("@")[0]}!
          </h1>
          <p className="text-sm text-indigo-100 mt-0.5">
            Here&apos;s what&apos;s on your plate today.
          </p>
        </div>

        {/* Stats row */}
        <TodoStats
          total={stats.total}
          pending={stats.pending}
          completed={stats.completed}
        />

        {/* Create todo */}
        <TodoForm onAdd={handleAdd} />

        {/* Filter bar */}
        <TodoFilterBar filters={filters} onChange={setFilters} />

        {/* Results summary */}
        {!loading && (
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
            {isFiltered
              ? `Showing ${todos.length} filtered tasks`
              : `${todos.length} task${todos.length !== 1 ? "s" : ""} total`}
          </p>
        )}

        {/* Todo list */}
        <TodoList
          todos={todos}
          loading={loading}
          filterActive={isFiltered}
          onComplete={handleComplete}
          onEdit={setEditingTodo}
          onDelete={setDeleteId}
        />
      </main>

      {/* Edit modal */}
      <TodoEditModal
        todo={editingTodo}
        onSave={handleSaveEdit}
        onClose={() => setEditingTodo(null)}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Task"
        message="This task will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}

// ─── Page export (wrapped with ToastProvider) ───────────────────────────────
export default function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardInner />
    </ToastProvider>
  );
}
