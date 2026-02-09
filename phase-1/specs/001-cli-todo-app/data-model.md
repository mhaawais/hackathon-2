# Data Model: Phase I — In-Memory Python Console Todo App

**Date**: 2026-02-08 | **Branch**: `001-cli-todo-app`

## Entities

### Task

Represents a single todo item managed by the user.

| Field | Type | Required | Default | Constraints |
|-------|------|----------|---------|-------------|
| id | int | Yes (auto) | Auto-increment from 1 | Positive integer, unique, never reused within session |
| title | str | Yes | — | Non-empty, non-whitespace-only (FR-010) |
| description | str or None | No | None | Any string or None |
| status | str | Yes (auto) | "pending" | One of: "pending", "completed" |
| created_at | datetime | Yes (auto) | Current timestamp | Set once at creation, immutable |

### State Transitions

```text
[created] → pending → completed
                ↑         |
                └─────────x (no transition back)
```

- Tasks are created in "pending" status (FR-003).
- Tasks transition to "completed" via the `complete` command (FR-007).
- Completing an already-completed task produces an error (FR-012).
- There is no "reopen" or "uncomplete" operation in Phase I.

### ID Generation

- Counter starts at 1.
- Increments by 1 for each new task.
- Never resets or reuses IDs within a session.
- Deletions do not affect the counter (FR-002).

## Storage

### TaskStore

In-memory store wrapping a `dict[int, Task]`.

| Operation | Behavior | Returns |
|-----------|----------|---------|
| add(title, description?) | Create task with next ID, return task | Task |
| get(id) | Retrieve task by ID | Task or None |
| list_all() | Return all tasks | list[Task] |
| list_by_status(status) | Return tasks matching status | list[Task] |
| update(id, title?, description?) | Update matching fields | Task or None |
| complete(id) | Set status to "completed" | Task or None |
| delete(id) | Remove task from store | bool |

### Validation Rules (from spec)

| Rule | Applies To | Error Message Pattern |
|------|-----------|----------------------|
| Title non-empty | add, update | "Error: Title cannot be empty." |
| Title non-whitespace | add, update | "Error: Title cannot be empty." |
| ID is positive integer | complete, update, delete | "Error: ID must be a positive integer." |
| ID exists in store | complete, update, delete | "Error: Task {id} not found." |
| Task not already completed | complete | "Error: Task {id} is already completed." |
| At least one field provided | update | "Error: Provide at least a title or description to update." |
