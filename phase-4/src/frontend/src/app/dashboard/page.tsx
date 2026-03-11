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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastProvider, useToast } from "@/components/ui/toast";
import type { Todo } from "@/components/todos/todo-card";

type FilterValue = "all" | "pending" | "completed";
type SortValue = "newest" | "oldest" | "az";

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

  // UI state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortValue>("newest");

  // Modal state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchTodos = useCallback(async () => {
    try {
      const data = await api.get<Todo[]>("/todos");
      setTodos(data);
    } catch {
      // 401 handled by api client (redirects to sign-in)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // Re-fetch when tab regains focus (e.g. user returns from chat after AI changed tasks)
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

  // ── Stats ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.status === "completed").length;
    const pending = total - completed;
    return { total, pending, completed };
  }, [todos]);

  // ── Filtered + sorted list ────────────────────────────────────────────
  const displayedTodos = useMemo(() => {
    let list = todos;

    if (filter !== "all") {
      list = list.filter((t) => t.status === filter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      if (sort === "newest")
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest")
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "az")
        return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [todos, filter, search, sort]);

  const isFiltered = filter !== "all" || search.trim() !== "";

  // ── Handlers ─────────────────────────────────────────────────────────
  async function handleAdd(title: string, description: string | null) {
    try {
      await api.post<Todo>("/todos", { title, description });
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
    title: string,
    description: string | null
  ) {
    try {
      await api.patch<Todo>(`/todos/${id}`, { title, description });
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
        search={search}
        onSearchChange={setSearch}
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

        {/* Controls: filter + sort (search is in navbar on desktop, inline on mobile via navbar drawer) */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Mobile inline search (hidden on sm+ because it's in the navbar drawer) */}
          <div className="relative flex-1 sm:hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1.5 shrink-0">
            {(["all", "pending", "completed"] as FilterValue[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={[
                  "rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all",
                  filter === f
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700",
                ].join(" ")}
                aria-pressed={filter === f}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            aria-label="Sort tasks"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shrink-0 sm:ml-auto"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="az">A to Z</option>
          </select>
        </div>

        {/* Results summary */}
        {!loading && (
          <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
            {isFiltered
              ? `Showing ${displayedTodos.length} of ${todos.length} tasks`
              : `${todos.length} task${todos.length !== 1 ? "s" : ""} total`}
          </p>
        )}

        {/* Todo list */}
        <TodoList
          todos={displayedTodos}
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
