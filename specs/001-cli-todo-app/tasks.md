# Tasks: Phase I — In-Memory Python Console Todo App

**Input**: Design documents from `/specs/001-cli-todo-app/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli-commands.md

**Tests**: Included — spec references smoke tests + unit tests as engineering standard minimum.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create project structure, entry point, and shared infrastructure

- [x] T001 Create project directory structure: `src/__init__.py`, `src/main.py`, `src/models.py`, `src/store.py`, `src/cli.py`, `tests/__init__.py`, `tests/test_models.py`, `tests/test_store.py`, `tests/test_cli.py`
- [x] T002 Implement Task dataclass with fields (id: int, title: str, description: str | None, status: str, created_at: datetime) and `__str__` method in `src/models.py` per data-model.md entity definition
- [x] T003 Implement TaskStore class with auto-increment counter, internal `dict[int, Task]` storage, and methods (add, get, list_all, list_by_status, update, complete, delete) in `src/store.py` per data-model.md store operations table
- [x] T004 Implement input parsing helper: `parse_quoted_args(raw_input: str) -> list[str]` that splits on whitespace but respects double-quoted strings, in `src/cli.py`
- [x] T005 Implement ID validation helper: `parse_id(value: str) -> int` that returns positive int or raises ValueError, in `src/cli.py` per FR-009
- [x] T006 Implement REPL loop in `src/main.py`: welcome message, `todo> ` prompt, Ctrl+C/EOF handling with goodbye message, empty input skip, unknown command handler per contracts/cli-commands.md REPL Interface and FR-013/FR-015

**Checkpoint**: Core infrastructure ready — all user story commands can now be implemented.

---

## Phase 2: User Story 1 — Add a New Task (Priority: P1) — MVP

**Goal**: Users can add tasks with a title and optional description. Tasks get auto-incrementing IDs and "pending" status.

**Independent Test**: Run `add "Buy groceries"` then `add "Read book" "Chapter 5"` — both should confirm creation with correct IDs.

### Implementation for User Story 1

- [x] T007 [US1] Implement `cmd_add(args: list[str], store: TaskStore)` in `src/cli.py`: validate title non-empty/non-whitespace (FR-010), call `store.add()`, print confirmation message per contracts/cli-commands.md add table
- [x] T008 [US1] Wire `add` command in REPL dispatch in `src/main.py`: parse input, route to `cmd_add`
- [x] T009 [US1] Write unit tests for Task creation and TaskStore.add in `tests/test_models.py` and `tests/test_store.py`: verify auto-increment IDs, default status "pending", title/description stored correctly
- [x] T010 [US1] Write CLI test for add command in `tests/test_cli.py`: valid add, empty title error, whitespace title error, no-args error per acceptance scenarios 1–4

**Checkpoint**: `add` command works end-to-end. Tasks created with sequential IDs.

---

## Phase 3: User Story 2 — List All Tasks (Priority: P1)

**Goal**: Users can list all tasks or filter by status (pending/completed). Tasks display in a formatted table.

**Independent Test**: Add 3 tasks, complete 1, run `list` / `list pending` / `list completed` — verify correct filtering and table output.

### Implementation for User Story 2

- [x] T011 [US2] Implement table formatter function `format_task_table(tasks: list[Task]) -> str` in `src/cli.py` per contracts/cli-commands.md table format (ID, Title, Description, Status columns with separator)
- [x] T012 [US2] Implement `cmd_list(args: list[str], store: TaskStore)` in `src/cli.py`: no args → list all, `pending`/`completed` → filter, invalid status → error per contracts/cli-commands.md list table
- [x] T013 [US2] Wire `list` command in REPL dispatch in `src/main.py`: parse input, route to `cmd_list`
- [x] T014 [US2] Write unit tests for TaskStore.list_all and TaskStore.list_by_status in `tests/test_store.py`: empty store, mixed statuses, filter accuracy
- [x] T015 [US2] Write CLI test for list command in `tests/test_cli.py`: empty list message, full list, filtered by pending, filtered by completed, invalid status error per acceptance scenarios 1–4

**Checkpoint**: `add` + `list` work together. Users can add and view tasks. MVP demonstrable.

---

## Phase 4: User Story 3 — Complete a Task (Priority: P2)

**Goal**: Users can mark a pending task as completed by ID.

**Independent Test**: Add a task, run `complete 1` — verify status changes to "completed".

### Implementation for User Story 3

- [x] T016 [US3] Implement `cmd_complete(args: list[str], store: TaskStore)` in `src/cli.py`: validate ID (FR-009), check task exists (FR-011), check not already completed (FR-012), call `store.complete()`, print confirmation per contracts/cli-commands.md complete table
- [x] T017 [US3] Wire `complete` command in REPL dispatch in `src/main.py`: parse input, route to `cmd_complete`
- [x] T018 [US3] Write unit tests for TaskStore.complete in `tests/test_store.py`: successful completion, non-existent ID returns None, already-completed detection
- [x] T019 [US3] Write CLI test for complete command in `tests/test_cli.py`: valid complete, not found error, already completed error, invalid ID error, no-args error per acceptance scenarios 1–3

**Checkpoint**: `add` + `list` + `complete` form the core workflow.

---

## Phase 5: User Story 4 — Update a Task (Priority: P2)

**Goal**: Users can update the title and/or description of an existing task by ID using flags.

**Independent Test**: Add a task, run `update 1 --title "New title"` — verify title changes.

### Implementation for User Story 4

- [x] T020 [US4] Implement flag parser for update command: extract `--title` and `--description` values from args list in `src/cli.py`
- [x] T021 [US4] Implement `cmd_update(args: list[str], store: TaskStore)` in `src/cli.py`: validate ID (FR-009), require at least one flag, validate title non-empty if provided (FR-010), check task exists (FR-011), call `store.update()`, print confirmation per contracts/cli-commands.md update table
- [x] T022 [US4] Wire `update` command in REPL dispatch in `src/main.py`: parse input, route to `cmd_update`
- [x] T023 [US4] Write unit tests for TaskStore.update in `tests/test_store.py`: update title only, description only, both, non-existent ID
- [x] T024 [US4] Write CLI test for update command in `tests/test_cli.py`: valid update title, description, both, not found error, no flags error, empty title error, no-args error per acceptance scenarios 1–5

**Checkpoint**: All CRUD operations except delete functional.

---

## Phase 6: User Story 5 — Delete a Task (Priority: P3)

**Goal**: Users can remove a task by ID. Deleted task IDs are never reused.

**Independent Test**: Add a task, run `delete 1`, run `list` — verify task is gone. Add another — verify it gets ID 2, not 1.

### Implementation for User Story 5

- [x] T025 [US5] Implement `cmd_delete(args: list[str], store: TaskStore)` in `src/cli.py`: validate ID (FR-009), check task exists (FR-011), call `store.delete()`, print confirmation per contracts/cli-commands.md delete table
- [x] T026 [US5] Wire `delete` command in REPL dispatch in `src/main.py`: parse input, route to `cmd_delete`
- [x] T027 [US5] Write unit tests for TaskStore.delete in `tests/test_store.py`: successful delete, non-existent ID returns False, ID not reused after deletion
- [x] T028 [US5] Write CLI test for delete command in `tests/test_cli.py`: valid delete, not found error, invalid ID error, no-args error, ID not reused per acceptance scenarios 1–4

**Checkpoint**: All five CRUD operations complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Help command, edge case handling, documentation, and full integration validation

- [x] T029 Implement `cmd_help()` in `src/cli.py` and wire in REPL dispatch in `src/main.py` per contracts/cli-commands.md help output format
- [x] T030 Add edge case handling in REPL: empty input skip, non-numeric/negative/zero ID errors across all commands per spec edge cases
- [x] T031 Write integration smoke test in `tests/test_cli.py`: full 90-second demo flow (add 3 → list → complete 1 → list pending → list completed → update 1 → delete 1 → list) per quickstart.md demo script
- [x] T032 Create `README.md` at project root: project description, setup instructions, 90-second demo script, test run instructions per quickstart.md and SC-002
- [x] T033 Run all tests (`pytest tests/ -v`) and verify zero failures, zero unhandled exceptions per SC-001/SC-003

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1 Add)**: Depends on Phase 1 (T001–T006)
- **Phase 3 (US2 List)**: Depends on Phase 1; benefits from Phase 2 (needs tasks to list)
- **Phase 4 (US3 Complete)**: Depends on Phase 1; requires add capability (Phase 2)
- **Phase 5 (US4 Update)**: Depends on Phase 1; requires add capability (Phase 2)
- **Phase 6 (US5 Delete)**: Depends on Phase 1; requires add capability (Phase 2)
- **Phase 7 (Polish)**: Depends on all user story phases (2–6)

### User Story Dependencies

- **US1 (Add)**: Foundation only — no other story dependencies
- **US2 (List)**: Independently testable but needs add to have data to display
- **US3 (Complete)**: Needs add to create tasks, needs list to verify
- **US4 (Update)**: Needs add to create tasks, needs list to verify
- **US5 (Delete)**: Needs add to create tasks, needs list to verify

### Within Each User Story

1. Implement command handler function in `src/cli.py`
2. Wire command into REPL dispatch in `src/main.py`
3. Write unit tests for store operations in `tests/test_store.py`
4. Write CLI integration tests in `tests/test_cli.py`

### Parallel Opportunities

- T002 and T003 could be parallelized (models vs store) but store depends on Task model — sequential is safer
- T009/T010 (US1 tests) can run in parallel with each other
- T014/T015 (US2 tests) can run in parallel with each other
- T018/T019 (US3 tests) can run in parallel with each other
- T023/T024 (US4 tests) can run in parallel with each other
- T027/T028 (US5 tests) can run in parallel with each other
- US3, US4, US5 can all be developed in parallel after US1+US2 are done

---

## Parallel Example: User Story 1

```text
# Sequential (command handler depends on store):
T007: Implement cmd_add in src/cli.py
T008: Wire add command in src/main.py

# Parallel (independent test files):
T009: Unit tests for add in tests/test_store.py  |  T010: CLI tests for add in tests/test_cli.py
```

---

## Implementation Strategy

### MVP First (US1 + US2 = Add + List)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: US1 Add (T007–T010)
3. Complete Phase 3: US2 List (T011–T015)
4. **STOP and VALIDATE**: Can add tasks and see them listed
5. Demo-ready with minimal functionality

### Incremental Delivery

1. Setup → Foundation ready
2. Add US1 (Add) → Can create tasks
3. Add US2 (List) → Can see tasks → **MVP Demo!**
4. Add US3 (Complete) → Core workflow complete
5. Add US4 (Update) → Full edit capability
6. Add US5 (Delete) → Full CRUD
7. Polish → Production-quality demo

### Suggested MVP Scope

Phase 1 (Setup) + Phase 2 (US1 Add) + Phase 3 (US2 List) = **15 tasks** for a demonstrable MVP.

---

## Notes

- All commands trace to specific FRs in the spec — see contracts/cli-commands.md for I/O contracts
- Task IDs (T001–T033) are sequential in execution order
- Tests are included per engineering standards (smoke tests + unit tests minimum)
- Each phase ends with a checkpoint to validate independently
- Total: **33 tasks** across 7 phases
