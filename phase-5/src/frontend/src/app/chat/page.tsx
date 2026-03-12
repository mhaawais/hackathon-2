"use client";

// T006 — Chat page
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearAuthCache } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { AppNavbar } from "@/components/layout/app-navbar";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatInput } from "@/components/chat/chat-input";
import { ToastProvider, useToast } from "@/components/ui/toast";
import type { ChatMessage, ChatApiResponse } from "@/lib/chat-api";

const LS_CONV_KEY = "chat_conversation_id";
const LS_MSGS_KEY = "chat_messages";

function ChatInner() {
  const router = useRouter();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasTaskChanges, setHasTaskChanges] = useState(false);

  // Use a ref to track conversationId inside callbacks without stale closure
  const conversationIdRef = useRef<number | null>(null);

  // ── Auth check + session ───────────────────────────────────────────────
  useEffect(() => {
    authClient.getSession().then((session) => {
      if (!session?.data?.user) {
        router.push("/sign-in");
        return;
      }
      setUserEmail(session.data.user.email ?? null);
      setUserName(session.data.user.name ?? null);
      setAuthChecked(true);
    });
  }, [router]);

  // ── Restore from localStorage ──────────────────────────────────────────
  useEffect(() => {
    if (!authChecked) return;
    try {
      const savedId = localStorage.getItem(LS_CONV_KEY);
      const savedMsgs = localStorage.getItem(LS_MSGS_KEY);
      if (savedId) {
        const id = parseInt(savedId, 10);
        setConversationId(id);
        conversationIdRef.current = id;
      }
      if (savedMsgs) {
        setMessages(JSON.parse(savedMsgs) as ChatMessage[]);
      }
    } catch {
      // Ignore corrupt localStorage data
    }
  }, [authChecked]);

  // ── Persist to localStorage on changes ────────────────────────────────
  useEffect(() => {
    if (!authChecked || messages.length === 0) return;
    try {
      localStorage.setItem(LS_MSGS_KEY, JSON.stringify(messages));
    } catch {
      // Storage quota exceeded — ignore
    }
  }, [messages, authChecked]);

  useEffect(() => {
    if (conversationId !== null) {
      localStorage.setItem(LS_CONV_KEY, String(conversationId));
      conversationIdRef.current = conversationId;
    }
  }, [conversationId]);

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const data = await api.post<ChatApiResponse>("/chat", {
        message: text,
        conversation_id: conversationIdRef.current,
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response,
        tool_calls: data.tool_calls.length > 0 ? data.tool_calls : undefined,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setConversationId(data.conversation_id);
      // Show "View Tasks" banner if AI changed any tasks
      const taskMutationTools = ["add_task", "complete_task", "delete_task", "update_task"];
      if (data.tool_calls.some((tc) => taskMutationTools.includes(tc.tool_name))) {
        setHasTaskChanges(true);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong.";
      const msg = raw.includes("rate limit") || raw.includes("503")
        ? "AI is temporarily busy. Please wait a moment and try again."
        : raw.includes("401") || raw.includes("Unauthorized")
        ? "Session expired. Please sign in again."
        : raw;
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ── New chat ───────────────────────────────────────────────────────────
  function handleNewChat() {
    localStorage.removeItem(LS_CONV_KEY);
    localStorage.removeItem(LS_MSGS_KEY);
    setMessages([]);
    setConversationId(null);
    conversationIdRef.current = null;
  }

  // ── Sign out ───────────────────────────────────────────────────────────
  async function handleSignOut() {
    setSigningOut(true);
    clearAuthCache();
    await authClient.signOut();
    router.push("/sign-in");
  }

  // Don't render until auth is verified
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <AppNavbar
        userEmail={userEmail}
        userName={userName}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />

      {/* Chat container */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-0 sm:px-4 py-0 sm:py-4">
        <div className="flex flex-1 flex-col rounded-none sm:rounded-2xl border-0 sm:border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-none sm:shadow-sm">

          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm">
                🤖
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">AI Assistant</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={handleNewChat}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              New Chat
            </button>
          </div>

          {/* Task-changes banner */}
          {hasTaskChanges && (
            <div className="flex items-center justify-between gap-3 border-b border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2">
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                ✓ Your tasks were updated
              </p>
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
              >
                View Tasks →
              </Link>
            </div>
          )}

          {/* Messages */}
          <ChatWindow messages={messages} loading={loading} onSuggestedPrompt={sendMessage} />

          {/* Input */}
          <ChatInput onSubmit={sendMessage} disabled={loading} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ToastProvider>
      <ChatInner />
    </ToastProvider>
  );
}
