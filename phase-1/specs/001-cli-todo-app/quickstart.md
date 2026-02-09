# Quickstart: Phase I — In-Memory Python Console Todo App

**Date**: 2026-02-08 | **Branch**: `001-cli-todo-app`

## Prerequisites

- Python 3.10 or later installed
- No additional dependencies required

## Setup (under 2 minutes)

```bash
# 1. Clone the repository (if not already cloned)
git clone <repo-url>
cd hackathon-2

# 2. Run the application
python src/main.py
```

That's it. No virtual environment needed, no pip install, no configuration.

## 90-Second Demo Script

This is the judging flow that demonstrates all five operations:

```text
# App starts, shows welcome message
todo> add "Buy groceries"
# → Task 1 added: "Buy groceries"

todo> add "Read book" "Chapter 5 of Clean Code"
# → Task 2 added: "Read book"

todo> add "Write tests"
# → Task 3 added: "Write tests"

todo> list
# → Shows all 3 tasks (pending)

todo> complete 1
# → Task 1 completed: "Buy groceries"

todo> list pending
# → Shows tasks 2 and 3 only

todo> list completed
# → Shows task 1 only

todo> update 2 --title "Read Clean Code" --description "Chapters 5-7"
# → Task 2 updated.

todo> delete 3
# → Task 3 deleted.

todo> list
# → Shows tasks 1 (completed) and 2 (pending)

todo> exit
# → Goodbye!
```

## Running Tests

```bash
# Install dev dependencies
pip install pytest

# Run all tests
pytest tests/ -v
```

## Verification Checklist

- [ ] `python src/main.py` starts without errors
- [ ] `add` creates tasks with auto-incrementing IDs
- [ ] `list` shows all tasks; `list pending` / `list completed` filters correctly
- [ ] `complete` changes status; errors on already-completed or missing ID
- [ ] `update` modifies title/description; errors on missing ID or no fields
- [ ] `delete` removes task; errors on missing ID
- [ ] Invalid inputs produce helpful error messages, not stack traces
- [ ] `exit` / `quit` / Ctrl+C exits gracefully
