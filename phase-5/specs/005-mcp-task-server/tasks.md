# Tasks: MCP Task Server

**Input**: Design documents from `/specs/005-mcp-task-server/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | contracts/ ✅ | quickstart.md ✅
**Branch**: `005-mcp-task-server`
**Date**: 2026-02-27

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.
**Tests**: Included — unit tests call pure sync handler functions directly using existing `session` fixture.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[US#]**: Maps to user story from spec.md
- All paths relative to `phase-3/`

---

## Phase 1: Setup

**Purpose**: Read existing patterns and install the `mcp` package before writing any code.

- [x] T001 Read `src/backend/app/services/todo_service.py` and `src/backend/app/models/schemas.py` to confirm `TodoCreate`, `TodoUpdate` schema shapes and `create_todo`, `list_todos`, `complete_todo`, `delete_todo`, `update_todo` function signatures ✓

**Checkpoint**: Confirm `TodoCreate(title, description?)`, `TodoUpdate(title?, description?)`, and all 5 service function signatures. Verify `get_todo` raises `HTTPException(404)` for wrong user.

---

## Phase 2: Dependencies

**Purpose**: Add `mcp` and `google-generativeai` to requirements before any MCP code is written.

- [x] T002 Update `src/backend/requirements.txt` — add two new packages after existing deps:
  ```
  mcp>=1.0.0,<2.0.0
  google-generativeai>=0.8.0,<1.0.0
  ```

- [x] T003 Install updated requirements and verify both packages import correctly:
  ```bash
  pip install -r requirements.txt
  python -c "import mcp; print(mcp.__version__)"
  python -c "import google.generativeai; print('google-generativeai OK')"
  ```
  (depends on T002)

**Checkpoint**: Both `import mcp` and `import google.generativeai` succeed with no errors.

---

## Phase 3: Package Structure

**Purpose**: Create the `src/mcp/` package skeleton before implementing any tool logic.

- [x] T004 [P] Create `src/mcp/__init__.py` — empty file (package marker)

- [x] T005 [P] Create `src/mcp/tools/__init__.py` — empty file (package marker)

**Checkpoint**: `src/mcp/` and `src/mcp/tools/` directories exist with `__init__.py` files.

---

## Phase 4: Tool Handler Functions (Pure Sync Layer)

**Purpose**: Implement the pure sync functions in `task_tools.py` that call `todo_service`.
These are the testable units. Each function takes a `Session` and returns a dict.

**⚠️ CRITICAL**: These functions must NOT create their own session — they accept `session: Session`
as a parameter. The MCP async handlers (Phase 6) will create sessions and call these.

- [x] T006 [US1] Create `src/mcp/tools/task_tools.py` with `do_add_task` function:
  ```python
  def do_add_task(session: Session, user_id: str, title: str, description: str | None = None) -> dict:
      """Create a new task. Returns {task_id, title, status, description}."""
  ```
  - Calls `todo_service.create_todo(session, user_id, TodoCreate(title=title, description=description))`
  - Returns `{"task_id": str(todo.id), "title": todo.title, "status": todo.status, "description": todo.description}`
  - Validates that `title` is non-empty (call `TodoCreate` which has `@field_validator("title")`)
  - On `HTTPException`: return `{"error": exc.detail, "code": "NOT_FOUND" if exc.status_code == 404 else "INTERNAL_ERROR"}`
  - On `ValueError`: return `{"error": str(exc), "code": "VALIDATION_ERROR"}`
  - On `Exception`: return `{"error": str(exc), "code": "INTERNAL_ERROR"}`

- [x] T007 [US2] Add `do_list_tasks` function to `task_tools.py`:
  ```python
  def do_list_tasks(session: Session, user_id: str, status: str | None = None) -> dict:
      """List user's tasks. Returns {tasks: [...], count: int}."""
  ```
  - Maps `status="all"` or `None` → `status_filter=None`; passes `status_filter` to `todo_service.list_todos()`
  - Returns `{"tasks": [{"task_id": str(t.id), "title": t.title, "status": t.status, "description": t.description} for t in todos], "count": len(todos)}`
  - On `Exception`: return `{"error": str(exc), "code": "INTERNAL_ERROR"}`

- [x] T008 [US3] Add `do_complete_task` function to `task_tools.py`:
  ```python
  def do_complete_task(session: Session, user_id: str, task_id: str) -> dict:
      """Toggle task completion. Returns {task_id, title, status, toggled: True}."""
  ```
  - Converts `task_id: str → uuid.UUID` with try/except `ValueError` → `{"error": "Invalid task_id format: expected UUID", "code": "VALIDATION_ERROR"}`
  - Calls `todo_service.complete_todo(session, task_uuid, user_id)`
  - Returns `{"task_id": str(todo.id), "title": todo.title, "status": todo.status, "toggled": True}`
  - On `HTTPException(404)`: return `{"error": exc.detail, "code": "NOT_FOUND"}`
  - On `Exception`: return `{"error": str(exc), "code": "INTERNAL_ERROR"}`

- [x] T009 [US3] Add `do_delete_task` function to `task_tools.py`:
  ```python
  def do_delete_task(session: Session, user_id: str, task_id: str) -> dict:
      """Delete a task. Returns {task_id, deleted: True}."""
  ```
  - Converts `task_id: str → uuid.UUID` with try/except
  - Calls `todo_service.delete_todo(session, task_uuid, user_id)` (returns None)
  - Returns `{"task_id": task_id, "deleted": True}`
  - On `HTTPException(404)`: return `{"error": exc.detail, "code": "NOT_FOUND"}`
  - On `Exception`: return `{"error": str(exc), "code": "INTERNAL_ERROR"}`

- [x] T010 [US3] Add `do_update_task` function to `task_tools.py`:
  ```python
  def do_update_task(session: Session, user_id: str, task_id: str, title: str | None = None, description: str | None = None) -> dict:
      """Update task fields. Returns {task_id, title, status, description}."""
  ```
  - Converts `task_id: str → uuid.UUID` with try/except
  - Calls `todo_service.update_todo(session, task_uuid, user_id, TodoUpdate(title=title, description=description))`
  - Returns `{"task_id": str(todo.id), "title": todo.title, "status": todo.status, "description": todo.description}`
  - On `HTTPException(404)`: return `{"error": exc.detail, "code": "NOT_FOUND"}`
  - On `Exception`: return `{"error": str(exc), "code": "INTERNAL_ERROR"}`

**Checkpoint**: `task_tools.py` has 5 sync functions, all error paths handled.

---

## Phase 5: Unit Tests

**Purpose**: Test all 5 sync handler functions using the existing `session` fixture.

- [x] T011 [US1] Create `src/backend/tests/test_mcp_task_tools.py` — add import block and add_task tests:
  - Import `Todo` model at top (required for SQLite table creation in `session` fixture)
  - Import `do_add_task`, `do_list_tasks`, `do_complete_task`, `do_delete_task`, `do_update_task` from `mcp.tools.task_tools`
  - `test_add_task_success` — call `do_add_task(session, USER_A, "Buy milk")`, assert `task_id` not None, `title == "Buy milk"`, `status == "pending"`, `"error" not in result`
  - `test_add_task_with_description` — add task with description, assert `description` in result
  - `test_add_task_empty_title` — call with `title=""`, assert `result["code"] == "VALIDATION_ERROR"`

- [x] T012 [US2] Add list_tasks tests to `test_mcp_task_tools.py`:
  - `test_list_tasks_all` — add 2 tasks, `do_list_tasks(session, USER_A)`, assert `count == 2`, tasks list has 2 items
  - `test_list_tasks_status_filter` — add 1 pending + 1 completed task, `do_list_tasks(session, USER_A, status="pending")`, assert `count == 1`
  - `test_list_tasks_empty` — `do_list_tasks(session, "no-tasks-user")`, assert `count == 0`, `tasks == []`
  - `test_list_tasks_user_isolation` — add tasks for USER_A and USER_B, `do_list_tasks(session, USER_A)`, assert only USER_A tasks returned

- [x] T013 [US3] Add complete/delete/update tests to `test_mcp_task_tools.py`:
  - `test_complete_task_success` — add task, `do_complete_task(session, USER_A, str(task_id))`, assert `status == "completed"`, `toggled == True`
  - `test_complete_task_not_found` — `do_complete_task(session, USER_A, str(uuid4()))`, assert `code == "NOT_FOUND"`
  - `test_delete_task_success` — add task, `do_delete_task(session, USER_A, str(task_id))`, assert `deleted == True`
  - `test_delete_task_not_found` — `do_delete_task(session, USER_A, str(uuid4()))`, assert `code == "NOT_FOUND"`
  - `test_update_task_success` — add task, `do_update_task(session, USER_A, str(task_id), title="New title")`, assert `title == "New title"`
  - `test_update_task_not_found` — `do_update_task(session, USER_A, str(uuid4()), title="x")`, assert `code == "NOT_FOUND"`
  - `test_invalid_task_id_format` — `do_complete_task(session, USER_A, "not-a-uuid")`, assert `code == "VALIDATION_ERROR"`

**Checkpoint**: Run `pytest tests/test_mcp_task_tools.py -v` — all 14 tests pass.

---

## Phase 6: MCP Server Entry Point

**Purpose**: Implement the MCP async handlers and server entry point that wrap the sync functions.

- [x] T014 Add MCP async handler functions to `src/mcp/tools/task_tools.py`:
  - `handle_add_task(args: dict)` — calls `do_add_task` via `asyncio.to_thread`
  - `handle_list_tasks(args: dict)` — calls `do_list_tasks` via `asyncio.to_thread`
  - `handle_complete_task(args: dict)` — calls `do_complete_task` via `asyncio.to_thread`
  - `handle_delete_task(args: dict)` — calls `do_delete_task` via `asyncio.to_thread`
  - `handle_update_task(args: dict)` — calls `do_update_task` via `asyncio.to_thread`
  - Each handler returns `[TextContent(type="text", text=json.dumps(result))]`
  - Each handler creates its own session using `get_db_session()` from module-level `engine`

- [x] T015 Create `src/mcp/server.py` — MCP server entry point:
  - Create `Server("todo-task-server")`
  - Register `@server.list_tools()` returning all 5 `Tool` definitions with JSON Schema
  - Register `@server.call_tool()` routing to correct handler by tool name
  - Unknown tool name → return `[TextContent(type="text", text=json.dumps({"error": "Unknown tool", "code": "NOT_FOUND"}))]`
  - `main()` async function using `stdio_server()` context manager
  - `if __name__ == "__main__": asyncio.run(main())`

**Checkpoint**: `python server.py` from `src/mcp/` starts without errors.

---

## Phase 7: Polish & Regression

**Purpose**: Full suite validation and import path verification.

- [x] T016 Verify import path: from `phase-3/src/backend/` the test can reach `mcp.tools.task_tools`.
  Add `src/mcp/` directory to the sys.path if needed, or confirm pytest conftest.py handles it.
  Run: `pytest tests/test_mcp_task_tools.py -v` — all 14 pass.

- [x] T017 Run full backend test suite: `pytest tests/ -v` — confirm all 46 tests pass
  (32 existing Spec-4 + 14 new MCP tests), zero regressions.

- [x] T018 [P] Verify `src/mcp/server.py` starts cleanly:
  ```bash
  cd phase-3/src/mcp && DATABASE_URL=sqlite:/// python server.py &
  sleep 1 && kill %1
  # Expect: no ImportError, no startup crash
  ```

---

## Dependencies & Execution Order

```
Phase 1 (Read service signatures)
    │
    ▼
Phase 2 (Install mcp package)
    │
    ├──▶ Phase 3 (Package structure) — can start after Phase 2
    │         │
    │         ▼
    │    Phase 4 (Sync handler functions) ← BLOCKS Phase 5 and Phase 6
    │         │
    │         ├──▶ Phase 5 (Unit tests) — tests sync functions
    │         │
    │         └──▶ Phase 6 (MCP async wrappers + server.py)
    │
    └──▶ Phase 7 (Polish + regression) ← after Phase 5 + Phase 6
```

### Parallel Opportunities

- T004 and T005 (empty `__init__.py` files) can be created simultaneously
- T006–T010 (sync functions) — independent functions in the same file; draft in any order
- T011, T012, T013 (test groups) — different test functions; can write simultaneously
- T016, T017, T018 (polish) — T017 depends on T016; T018 independent

---

## Test Summary

| Test | Story | Function tested | Assertion |
|------|-------|-----------------|-----------|
| `test_add_task_success` | US1 | `do_add_task` | New task in DB; task_id/title/status returned |
| `test_add_task_with_description` | US1 | `do_add_task` | Description stored and returned |
| `test_add_task_empty_title` | US1/US4 | `do_add_task` | VALIDATION_ERROR on empty title |
| `test_list_tasks_all` | US2 | `do_list_tasks` | All tasks returned; count correct |
| `test_list_tasks_status_filter` | US2 | `do_list_tasks` | Only matching status tasks returned |
| `test_list_tasks_empty` | US2 | `do_list_tasks` | Empty tasks array; no error |
| `test_list_tasks_user_isolation` | US2 | `do_list_tasks` | Only user's own tasks returned |
| `test_complete_task_success` | US3 | `do_complete_task` | Status toggled; toggled=True |
| `test_complete_task_not_found` | US3/US4 | `do_complete_task` | NOT_FOUND on unknown task_id |
| `test_delete_task_success` | US3 | `do_delete_task` | deleted=True; task gone from DB |
| `test_delete_task_not_found` | US3/US4 | `do_delete_task` | NOT_FOUND on unknown task_id |
| `test_update_task_success` | US3 | `do_update_task` | Title updated; updated task returned |
| `test_update_task_not_found` | US3/US4 | `do_update_task` | NOT_FOUND on unknown task_id |
| `test_invalid_task_id_format` | US4 | `do_complete_task` | VALIDATION_ERROR on malformed UUID |

**Total: 14 tests across 4 user stories**

---

## Notes

- All sync functions (`do_*`) accept `session: Session` — they are pure, testable, and stateless
- All MCP async handlers (`handle_*`) create their own session via `asyncio.to_thread`
- `conftest.py` `session` fixture uses in-memory SQLite — `Todo` model must be imported at top of test file
- `task_tools.py` must be importable from `src/backend/tests/` — add `src/mcp/` to `sys.path` in conftest or add a `conftest.py` in `src/backend/tests/` that handles path
- Do NOT modify `todo_service.py`, `todo.py`, or any Phase 2 / Spec-4 files
- Do NOT add a FastAPI router in this spec — the chat route is Spec-6 work
