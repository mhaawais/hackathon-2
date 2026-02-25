"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Todo } from "./todo-card";

interface TodoEditModalProps {
  todo: Todo | null;
  onSave: (id: string, title: string, description: string | null) => Promise<void>;
  onClose: () => void;
}

/**
 * Modal for editing a todo's title and description.
 * Pre-fills inputs from the selected todo.
 */
export function TodoEditModal({ todo, onSave, onClose }: TodoEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [titleError, setTitleError] = useState("");

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? "");
      setTitleError("");
    }
  }, [todo]);

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
      await onSave(todo.id, title.trim(), description.trim() || null);
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
        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
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
