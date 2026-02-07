"""Entry point for the In-Memory Python Console Todo App."""

import sys

from src.cli import cmd_add, cmd_complete, cmd_delete, cmd_help, cmd_list, cmd_update, parse_quoted_args
from src.store import TaskStore

WELCOME_MESSAGE = """
========================================
  Todo App — Phase I (In-Memory CLI)
========================================
Type "help" for available commands.
"""

GOODBYE_MESSAGE = "Goodbye!"


def main() -> None:
    """Run the interactive REPL loop."""
    store = TaskStore()
    print(WELCOME_MESSAGE)

    try:
        while True:
            try:
                raw = input("todo> ")
            except EOFError:
                print(f"\n{GOODBYE_MESSAGE}")
                break

            raw = raw.strip()
            if not raw:
                continue

            tokens = parse_quoted_args(raw)
            if not tokens:
                continue

            command = tokens[0].lower()
            args = tokens[1:]

            if command in ("exit", "quit"):
                print(GOODBYE_MESSAGE)
                break
            elif command == "add":
                print(cmd_add(args, store))
            elif command == "list":
                print(cmd_list(args, store))
            elif command == "complete":
                print(cmd_complete(args, store))
            elif command == "update":
                print(cmd_update(args, store))
            elif command == "delete":
                print(cmd_delete(args, store))
            elif command == "help":
                print(cmd_help())
            else:
                print(f'Unknown command: "{command}". Type "help" for available commands.')

    except KeyboardInterrupt:
        print(f"\n{GOODBYE_MESSAGE}")

    sys.exit(0)


if __name__ == "__main__":
    main()
