"""CLI command handlers and parsing utilities for the Todo app."""

import shlex

from src.models import Task
from src.store import TaskStore


def parse_quoted_args(raw_input: str) -> list[str]:
    """Split input on whitespace, respecting double-quoted strings.

    Returns a list of tokens with quotes stripped.
    """
    try:
        return shlex.split(raw_input)
    except ValueError:
        return raw_input.split()


def parse_id(value: str) -> int:
    """Parse and validate a task ID string.

    Returns a positive integer.
    Raises ValueError if not a positive integer.
    """
    try:
        task_id = int(value)
    except ValueError:
        raise ValueError("ID must be a positive integer.")
    if task_id <= 0:
        raise ValueError("ID must be a positive integer.")
    return task_id


def format_task_table(tasks: list[Task]) -> str:
    """Format a list of tasks as a table string.

    Output format:
      ID | Title            | Description          | Status
    -----+------------------+----------------------+-----------
       1 | Buy groceries    | —                    | pending
    """
    if not tasks:
        return "No tasks found."

    headers = ["ID", "Title", "Description", "Status"]

    rows: list[list[str]] = []
    for t in tasks:
        desc = t.description if t.description else "\u2014"
        rows.append([str(t.id), t.title, desc, t.status])

    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(cell))

    def format_row(cells: list[str]) -> str:
        parts = []
        for i, cell in enumerate(cells):
            if i == 0:
                parts.append(cell.rjust(col_widths[i]))
            else:
                parts.append(cell.ljust(col_widths[i]))
        return " | ".join(parts)

    header_line = format_row(headers)
    separator = "-+-".join("-" * w for w in col_widths)
    separator = "-" + separator + "-"

    lines = [header_line, separator]
    for row in rows:
        lines.append(format_row(row))

    return "\n".join(lines)


def parse_update_flags(args: list[str]) -> tuple[str | None, str | None]:
    """Extract --title and --description values from update command args.

    Returns (title, description) tuple where either may be None.
    """
    title = None
    description = None
    i = 0
    while i < len(args):
        if args[i] == "--title" and i + 1 < len(args):
            title = args[i + 1]
            i += 2
        elif args[i] == "--description" and i + 1 < len(args):
            description = args[i + 1]
            i += 2
        else:
            i += 1
    return title, description


def cmd_add(args: list[str], store: TaskStore) -> str:
    """Handle the add command. Returns output message."""
    if not args:
        return 'Error: Title is required. Usage: add "<title>" ["<description>"]'

    title = args[0]
    if not title or not title.strip():
        return "Error: Title cannot be empty."

    description = args[1] if len(args) > 1 else None
    task = store.add(title=title, description=description)
    return f'Task {task.id} added: "{task.title}"'


def cmd_list(args: list[str], store: TaskStore) -> str:
    """Handle the list command. Returns output message."""
    if args:
        status_filter = args[0].lower()
        if status_filter not in ("pending", "completed"):
            return "Error: Invalid status filter. Use: list [pending|completed]"
        tasks = store.list_by_status(status_filter)
    else:
        tasks = store.list_all()

    return format_task_table(tasks)


def cmd_complete(args: list[str], store: TaskStore) -> str:
    """Handle the complete command. Returns output message."""
    if not args:
        return "Error: ID is required. Usage: complete <id>"

    try:
        task_id = parse_id(args[0])
    except ValueError as e:
        return f"Error: {e}"

    task = store.get(task_id)
    if task is None:
        return f"Error: Task {task_id} not found."

    if task.status == "completed":
        return f"Error: Task {task_id} is already completed."

    store.complete(task_id)
    return f'Task {task_id} completed: "{task.title}"'


def cmd_update(args: list[str], store: TaskStore) -> str:
    """Handle the update command. Returns output message."""
    if not args:
        return 'Error: ID is required. Usage: update <id> --title "<title>" --description "<desc>"'

    try:
        task_id = parse_id(args[0])
    except ValueError as e:
        return f"Error: {e}"

    flag_args = args[1:]
    title, description = parse_update_flags(flag_args)

    if title is None and description is None:
        return "Error: Provide at least a title or description to update."

    if title is not None and not title.strip():
        return "Error: Title cannot be empty."

    task = store.get(task_id)
    if task is None:
        return f"Error: Task {task_id} not found."

    store.update(task_id, title=title, description=description)
    return f"Task {task_id} updated."


def cmd_delete(args: list[str], store: TaskStore) -> str:
    """Handle the delete command. Returns output message."""
    if not args:
        return "Error: ID is required. Usage: delete <id>"

    try:
        task_id = parse_id(args[0])
    except ValueError as e:
        return f"Error: {e}"

    if not store.delete(task_id):
        return f"Error: Task {task_id} not found."

    return f"Task {task_id} deleted."


def cmd_help() -> str:
    """Return help text listing all available commands."""
    return """Available commands:
  add "<title>" ["<description>"]  - Add a new task
  list [pending|completed]         - List tasks (optionally filter by status)
  update <id> --title "<title>" --description "<desc>"  - Update a task
  complete <id>                    - Mark a task as completed
  delete <id>                      - Delete a task
  help                             - Show this help message
  exit / quit                      - Exit the application"""
