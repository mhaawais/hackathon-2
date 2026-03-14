"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Todo } from "./todo-card";

interface TodoEditModalProps {
  todo: Todo | null;
  onSave: (id: string, data: {
    title: string;
    description: string | null;
    priority: "high" | "medium" | "low";
    tags: string[];
    due_date: string | null;
    is_recurring: boolean;
    recurrence_frequency: "daily" | "weekly" | "monthly" | null;
  }) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal for editing a todo's title, description, priority, tags, and due date.
 */
export function TodoEditModal({ todo, onSave, onClose }: TodoEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? "");
      setPriority(todo.priority ?? "medium");
      setTags(todo.tags ?? []);
      setDueDate(
        todo.due_date
          ? new Date(todo.due_date).toISOString().slice(0, 16)
          : ""
      );
      setIsRecurring(todo.is_recurring ?? false);
      setRecurrenceFrequency(todo.recurrence_frequency ?? "weekly");
      setTitleError("");
    }
  }, [todo]);

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Title is required");
      return;
    }
    if (!todo) return;
    setTitleError("");
    setLoading(true);
    try {
      await onSave(todo.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        tags,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        is_recurring: isRecurring,
        recurrence_frequency: isRecurring ? recurrenceFrequency : null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={todo !== null} onClose={onClose} title="Edit Task">
      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) setTitleError("");
          }}
          error={titleError}
          placeholder="Task title"
          autoFocus
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add details... (optional)"
          rows={3}
        />

        {/* Priority + Due Date */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "high" | "medium" | "low")}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Due Date</label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={isRecurring}
              onClick={() => setIsRecurring((v) => !v)}
              className={[
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
                isRecurring ? "bg-violet-500" : "bg-slate-200 dark:bg-slate-700",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                  isRecurring ? "translate-x-4" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Recurring</span>
          </label>

          {isRecurring && (
            <select
              value={recurrenceFrequency}
              onChange={(e) => setRecurrenceFrequency(e.target.value as "daily" | "weekly" | "monthly")}
              aria-label="Recurrence frequency"
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Tags</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              placeholder="Type tag + Enter"
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            <button type="button" onClick={addTag} className="rounded-xl px-3 py-2 text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 text-indigo-400 hover:text-indigo-600" aria-label={`Remove tag ${tag}`}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
