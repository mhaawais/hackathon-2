# Implementation Plan: Phase I — In-Memory Python Console Todo App

**Branch**: `001-cli-todo-app` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cli-todo-app/spec.md`

## Summary

Build a deterministic, in-memory Python CLI Todo application with five core operations (add, list, update, complete, delete) using an interactive REPL. The app uses Python standard library only, modular architecture (models, store, cli), auto-incrementing IDs, and comprehensive input validation. This is the foundation phase demonstrating Spec-Driven Development workflow.

## Technical Context

**Language/Version**: Python 3.10+ (standard library only)
**Primary Dependencies**: None (stdlib: `dataclasses`, `datetime`, `typing`)
**Storage**: In-memory dictionary (dict[int, Task])
**Testing**: pytest (dev dependency only)
**Target Platform**: Cross-platform CLI (Windows, macOS, Linux)
**Project Type**: Single project
**Performance Goals**: Instant response for all operations (in-memory, no I/O)
**Constraints**: No file persistence, no database, no third-party runtime deps
**Scale/Scope**: Single-user, single-session, <100 tasks per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Phase I Applicability | Status |
|-----------|----------------------|--------|
| I. Spec as Truth | Fully applies — all code generated from specs | PASS |
| II. Deterministic Reproducibility | Fully applies — reproducible setup, deterministic IDs | PASS |
| III. Security by Default | Phase II+ only — N/A for Phase I | PASS (exempt) |
| IV. Stateless Services | Phase III+ only — N/A for Phase I | PASS (exempt) |
| V. Cloud-Native Evolution | Phase IV+ only — N/A for Phase I | PASS (exempt) |
| VI. Observability & Maintainability | Partially applies — clear error messages, modular architecture | PASS |

**Engineering Standards Check**:
- Simple, boring solutions: PASS — stdlib only, dict-based store, REPL loop
- Type safety and validation: PASS — dataclasses with type hints, input validation per FR-009/010
- Testing: PASS — pytest smoke tests + unit tests planned
- Documentation: PASS — README with 90-second demo script planned
- No hardcoded secrets: PASS (exempt) — no secrets in Phase I
- Smallest viable diff: PASS — five commands, nothing more

**Quality Gate (Phase I)**: CLI works end-to-end; no crashes; consistent outputs.

**GATE RESULT: PASS — No violations. Proceeding to Phase 0.**

## Project Structure

### Documentation (this feature)

```text
specs/001-cli-todo-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI command contracts)
│   └── cli-commands.md  # Command syntax and behavior contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
src/
├── __init__.py
├── main.py              # Entry point, REPL loop
├── models.py            # Task dataclass
├── store.py             # In-memory TaskStore
└── cli.py               # Command parser and handlers

tests/
├── __init__.py
├── test_models.py       # Task creation, validation
├── test_store.py        # CRUD operations on store
└── test_cli.py          # Command parsing, integration
```

**Structure Decision**: Single project layout. Flat `src/` with four modules — `main.py` (entry + REPL), `models.py` (Task dataclass), `store.py` (in-memory dict store with ID generation), `cli.py` (command parsing and dispatch). Tests mirror source modules.

## Complexity Tracking

> No violations detected. No complexity justifications needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
