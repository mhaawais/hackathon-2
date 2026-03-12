"use client";

// T004 — ChatWindow
import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/chat-api";
import { MessageBubble } from "./message-bubble";

const SUGGESTED_PROMPTS = [
  { label: "Show my tasks", icon: "📋" },
  { label: "Add a task", icon: "➕" },
  { label: "What did I complete?", icon: "✅" },
  { label: "Delete completed tasks", icon: "🗑️" },
];

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  onSuggestedPrompt?: (text: string) => void;
}

export function ChatWindow({ messages, loading, onSuggestedPrompt }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-2xl">
          💬
        </div>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Start a conversation
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mt-1">
            Ask me to add, list, complete, or delete your tasks — I&apos;ll handle it for you.
          </p>
        </div>
        {/* Suggested prompts */}
        <div className="grid grid-cols-2 gap-2 w-full max-w-sm mt-1">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p.label}
              onClick={() => onSuggestedPrompt?.(p.label)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
