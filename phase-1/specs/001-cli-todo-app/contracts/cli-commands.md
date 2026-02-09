# CLI Command Contracts: Phase I — In-Memory Python Console Todo App

**Date**: 2026-02-08 | **Branch**: `001-cli-todo-app`

## REPL Interface

- **Prompt**: `todo> `
- **Welcome message**: Displayed on startup with app name and hint to type `help`.
- **Exit**: `exit`, `quit`, Ctrl+C, or EOF → prints goodbye message and exits with code 0.

## Command: `add`

**Syntax**: `add "<title>"` or `add "<title>" "<description>"`

| Input | Output | Traces To |
|-------|--------|-----------|
| `add "Buy groceries"` | `Task 1 added: "Buy groceries"` | FR-001, FR-002, FR-003 |
| `add "Read book" "Chapter 5"` | `Task 2 added: "Read book"` | FR-001, FR-002, FR-003 |
| `add ""` | `Error: Title cannot be empty.` | FR-010 |
| `add "   "` | `Error: Title cannot be empty.` | FR-010 |
| `add` (no args) | `Error: Title is required. Usage: add "<title>" ["<description>"]` | FR-010 |

## Command: `list`

**Syntax**: `list` or `list <status>`

| Input | Output | Traces To |
|-------|--------|-----------|
| `list` (no tasks) | `No tasks found.` | FR-004 |
| `list` (with tasks) | Table of all tasks: ID, Title, Description, Status | FR-004 |
| `list pending` | Table of pending tasks only | FR-005 |
| `list completed` | Table of completed tasks only | FR-005 |
| `list invalid` | `Error: Invalid status filter. Use: list [pending\|completed]` | FR-005 |

**Table Format**:
```text
  ID | Title            | Description          | Status
-----+------------------+----------------------+-----------
   1 | Buy groceries    | —                    | pending
   2 | Read book        | Chapter 5            | completed
```

## Command: `complete`

**Syntax**: `complete <id>`

| Input | Output | Traces To |
|-------|--------|-----------|
| `complete 1` | `Task 1 completed: "Buy groceries"` | FR-007 |
| `complete 99` | `Error: Task 99 not found.` | FR-011 |
| `complete 1` (already done) | `Error: Task 1 is already completed.` | FR-012 |
| `complete abc` | `Error: ID must be a positive integer.` | FR-009 |
| `complete -1` | `Error: ID must be a positive integer.` | FR-009 |
| `complete 0` | `Error: ID must be a positive integer.` | FR-009 |
| `complete` (no args) | `Error: ID is required. Usage: complete <id>` | FR-009 |

## Command: `update`

**Syntax**: `update <id> --title "<new title>"` and/or `--description "<new desc>"`

| Input | Output | Traces To |
|-------|--------|-----------|
| `update 1 --title "Organic groceries"` | `Task 1 updated.` | FR-006 |
| `update 1 --description "From market"` | `Task 1 updated.` | FR-006 |
| `update 1 --title "New" --description "Desc"` | `Task 1 updated.` | FR-006 |
| `update 99 --title "X"` | `Error: Task 99 not found.` | FR-011 |
| `update abc --title "X"` | `Error: ID must be a positive integer.` | FR-009 |
| `update 1` (no flags) | `Error: Provide at least a title or description to update.` | FR-006 |
| `update` (no args) | `Error: ID is required. Usage: update <id> --title "<title>" --description "<desc>"` | FR-009 |
| `update 1 --title ""` | `Error: Title cannot be empty.` | FR-010 |

## Command: `delete`

**Syntax**: `delete <id>`

| Input | Output | Traces To |
|-------|--------|-----------|
| `delete 1` | `Task 1 deleted.` | FR-008 |
| `delete 99` | `Error: Task 99 not found.` | FR-011 |
| `delete abc` | `Error: ID must be a positive integer.` | FR-009 |
| `delete 0` | `Error: ID must be a positive integer.` | FR-009 |
| `delete` (no args) | `Error: ID is required. Usage: delete <id>` | FR-009 |

## Command: `help`

**Syntax**: `help`

**Output**:
```text
Available commands:
  add "<title>" ["<description>"]  - Add a new task
  list [pending|completed]         - List tasks (optionally filter by status)
  update <id> --title "<title>" --description "<desc>"  - Update a task
  complete <id>                    - Mark a task as completed
  delete <id>                      - Delete a task
  help                             - Show this help message
  exit / quit                      - Exit the application
```

## Command: `exit` / `quit`

**Syntax**: `exit` or `quit`

| Input | Output | Traces To |
|-------|--------|-----------|
| `exit` | `Goodbye!` (app terminates) | FR-015 |
| `quit` | `Goodbye!` (app terminates) | FR-015 |
| Ctrl+C | `Goodbye!` (app terminates) | FR-015 |

## Unknown Commands

| Input | Output | Traces To |
|-------|--------|-----------|
| `foo` | `Unknown command: "foo". Type "help" for available commands.` | FR-013 |
| (empty input) | (re-display prompt, no error) | — |
