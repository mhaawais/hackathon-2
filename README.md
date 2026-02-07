# Phase I — In-Memory Python Console Todo App

A deterministic, in-memory CLI Todo application built using Spec-Driven Development with Claude Code.

## Quick Setup (under 2 minutes)

**Prerequisites**: Python 3.10+

```bash
# Clone and run
git clone <repo-url>
cd hackathon-2
python -m src.main
```

No virtual environment needed. No pip install. No configuration.

## 90-Second Demo Script

```text
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

## Available Commands

| Command | Description |
|---------|-------------|
| `add "<title>" ["<description>"]` | Add a new task |
| `list [pending\|completed]` | List tasks (optionally filter by status) |
| `complete <id>` | Mark a task as completed |
| `update <id> --title "<title>" --description "<desc>"` | Update a task |
| `delete <id>` | Delete a task |
| `help` | Show available commands |
| `exit` / `quit` | Exit the application |

## Running Tests

```bash
pip install pytest
pytest tests/ -v
```

## Architecture

```
src/
├── main.py      # Entry point, REPL loop
├── models.py    # Task dataclass
├── store.py     # In-memory TaskStore
└── cli.py       # Command handlers and parsing

tests/
├── test_models.py   # Task model tests
├── test_store.py    # Store CRUD tests
└── test_cli.py      # CLI integration tests + 90-second demo flow
```

## Spec-Driven Development

This project was built entirely through specs, plans, and tasks — no manual coding:

```
specs/001-cli-todo-app/
├── spec.md              # Feature specification (19 acceptance scenarios)
├── plan.md              # Implementation plan with constitution check
├── tasks.md             # 33 atomic tasks across 7 phases
├── research.md          # 6 design decisions with rationale
├── data-model.md        # Task entity and store operations
├── quickstart.md        # Setup and demo instructions
└── contracts/
    └── cli-commands.md  # Full I/O contracts for all commands
```
