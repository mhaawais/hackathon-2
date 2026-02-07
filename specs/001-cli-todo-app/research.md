# Research: Phase I — In-Memory Python Console Todo App

**Date**: 2026-02-08 | **Branch**: `001-cli-todo-app`

## Research Summary

Phase I has no NEEDS CLARIFICATION items in the Technical Context. All technology choices are straightforward and fully constrained by the spec and constitution. This research documents the decisions and rationale for each choice.

## Decision 1: Python Version

- **Decision**: Python 3.10+
- **Rationale**: Dataclasses (3.7+), match statements (3.10+) available. Python 3.10 is widely installed and the minimum version that supports structural pattern matching for clean command dispatch. However, we will use if/elif for broader compatibility since match is optional.
- **Alternatives considered**:
  - Python 3.12+: Too restrictive for some environments; no features needed beyond 3.10.
  - Python 3.8+: Would work but 3.10 is a reasonable minimum in 2026.

## Decision 2: Data Storage Pattern

- **Decision**: Python `dict[int, Task]` keyed by task ID, wrapped in a `TaskStore` class.
- **Rationale**: Simplest possible in-memory store. O(1) lookup by ID. The store class encapsulates ID generation (auto-increment counter) and CRUD operations. No persistence needed per spec FR-014.
- **Alternatives considered**:
  - List with linear search: O(n) lookup by ID; unnecessary complexity for no benefit.
  - SQLite in-memory: Overkill for Phase I; adds complexity without value.
  - OrderedDict: Regular dict maintains insertion order since Python 3.7; no need.

## Decision 3: CLI Interface Pattern

- **Decision**: Interactive REPL with `input()` loop. Commands parsed by splitting on whitespace. First token is the command, rest are arguments.
- **Rationale**: Simplest approach using only stdlib. Matches spec assumption of REPL interface. No argparse overhead for an interactive loop.
- **Alternatives considered**:
  - argparse/click: Better for single-shot CLI tools, not REPLs. Click is a third-party dep (violates constraint).
  - cmd module (stdlib): Viable but adds framework overhead. Raw input loop is simpler and more transparent.

## Decision 4: Task Model

- **Decision**: Python `dataclass` with fields: id (int), title (str), description (str | None), status (str), created_at (datetime).
- **Rationale**: Dataclasses provide clean, typed data structures with minimal boilerplate. Status is a string enum ("pending", "completed") — simple enough to not warrant a full Enum class.
- **Alternatives considered**:
  - NamedTuple: Immutable; updates would require creating new instances. Dataclass is more natural for mutable entities.
  - Plain dict: Loses type safety and IDE support.
  - Pydantic: Third-party dependency, not allowed.

## Decision 5: Testing Framework

- **Decision**: pytest (dev dependency only)
- **Rationale**: Industry standard for Python testing. Not a runtime dependency — only needed for development. Provides clean assertion syntax and fixtures.
- **Alternatives considered**:
  - unittest (stdlib): More verbose; pytest is universally available and expected.
  - No testing: Violates constitution engineering standards (smoke tests + unit tests minimum).

## Decision 6: Command Syntax

- **Decision**: Space-separated commands with quoted string support for multi-word values.
  - `add "Buy groceries"` — title only
  - `add "Buy groceries" "From the farmers market"` — title + description
  - `list` / `list pending` / `list completed` — all or filtered
  - `update 1 --title "New title"` / `update 1 --description "New desc"` — by flag
  - `complete 1` — by ID
  - `delete 1` — by ID
  - `help` — show commands
  - `exit` / `quit` — leave app
- **Rationale**: Intuitive for CLI users. Quoted strings allow multi-word titles/descriptions. Update uses flags to allow partial updates (title only, description only, or both).
- **Alternatives considered**:
  - Positional-only for update: Ambiguous — hard to distinguish "update title only" vs "update description only".
  - JSON input: Not user-friendly for a REPL.
  - Interactive prompts per field: Slower UX; doesn't match the "under 90 seconds" demo goal.

## Unresolved Items

None. All decisions are final for Phase I.
