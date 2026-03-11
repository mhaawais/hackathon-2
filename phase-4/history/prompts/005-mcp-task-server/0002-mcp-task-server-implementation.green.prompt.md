---
id: 0002
title: MCP Task Server Implementation
stage: green
date: 2026-02-27
surface: claude-code
model: claude-sonnet-4-6
feature: 005-mcp-task-server
branch: 005-mcp-task-server
user: LENOVO
command: /sp.implement
labels: [green, implementation, backend, mcp, tools, stdio, tests]
links:
  spec: specs/005-mcp-task-server/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  created:
    - src/mcp/__init__.py
    - src/mcp/tools/__init__.py
    - src/mcp/tools/task_tools.py
    - src/mcp/server.py
    - src/backend/tests/test_mcp_task_tools.py
    - history/prompts/005-mcp-task-server/0002-mcp-task-server-implementation.green.prompt.md
  modified:
    - src/backend/requirements.txt
    - specs/005-mcp-task-server/tasks.md
  verified_unchanged:
    - src/backend/app/services/todo_service.py
    - src/backend/app/models/todo.py
    - src/backend/app/models/schemas.py
    - src/backend/app/models/conversation.py
    - src/backend/app/models/message.py
    - src/backend/app/services/conversation_service.py
tests:
  before: 32/32 passing (src/backend/tests/) — Spec-4 baseline
  after: 46/46 passing (src/backend/tests/) — 14 new MCP tests added, all green, zero regressions
---

## Prompt

/sp.implement — Execute all tasks T001–T018 from tasks.md for Spec-5: MCP Task Server.

Context:
- tasks.md has 18 tasks across 7 phases
- Phase 1: Read service signatures (TodoCreate, TodoUpdate, all 5 service functions)
- Phase 2: Install mcp>=1.0.0 and google-generativeai (replaced with google-genai>=1.0.0)
- Phase 3: Create package skeleton (src/mcp/__init__.py, src/mcp/tools/__init__.py)
- Phase 4: Implement 5 sync do_*() handler functions in task_tools.py
- Phase 5: 14 unit tests covering all 5 tools (happy path + error path)
- Phase 6: MCP async handle_*() wrappers + server.py entry point
- Phase 7: Full regression check

## Response snapshot

Executed all 18 tasks. Created 4 new files, updated 1 file. 46/46 tests pass.

**Phase 1 (T001): CONFIRMED**
- `TodoCreate(title, description?)` — has `@field_validator("title")` that raises `ValueError` for blank
- `TodoUpdate(title?, description?)` — both optional
- All 5 service functions confirmed: `create_todo`, `list_todos`, `get_todo`, `complete_todo`, `delete_todo`, `update_todo`
- `get_todo` raises `HTTPException(404)` for both not-found and wrong-user cases

**Phase 2 (T002–T003): IMPLEMENTED**
- Added `mcp>=1.0.0,<2.0.0` and `google-genai>=1.0.0,<2.0.0` to requirements.txt
- Note: `google-generativeai` is deprecated; switched to `google-genai` (new package name, `import google.genai`)
- Both packages installed and import successfully. mcp version: 1.26.0, google-genai version: 1.65.0

**Phase 3 (T004–T005): CREATED**
- `src/mcp/__init__.py` and `src/mcp/tools/__init__.py` created

**Phase 4 (T006–T010): IMPLEMENTED**
- `task_tools.py` created with 5 pure sync functions:
  - `do_add_task(session, user_id, title, description?)` → calls `create_todo`, handles ValueError from `title_not_empty` validator
  - `do_list_tasks(session, user_id, status?)` → maps `"all"|None` → `status_filter=None`, calls `list_todos`
  - `do_complete_task(session, user_id, task_id)` → str→UUID conversion, calls `complete_todo`
  - `do_delete_task(session, user_id, task_id)` → str→UUID conversion, calls `delete_todo`
  - `do_update_task(session, user_id, task_id, title?, description?)` → str→UUID conversion, calls `update_todo`
- All functions catch HTTPException, ValueError, Exception → return `{"error": ..., "code": ...}` dicts
- sys.path manipulation at top of task_tools.py adds `src/backend/` if not already present (handles both standalone and test scenarios)

**Phase 5 (T011–T013): 14/14 PASS**
- test file imports: adds `src/mcp/` to sys.path → `from tools.task_tools import do_*` (avoids PyPI `mcp` name clash)
- All 14 tests pass: add (3), list (4), complete/delete/update (7)

**Phase 6 (T014–T015): IMPLEMENTED**
- Async `handle_*()` wrappers added to task_tools.py — each creates its own session via `asyncio.to_thread()`
- `TextContent` import guarded with `try/except ImportError` for test compatibility
- `server.py` created with 5 Tool definitions (JSON Schema), `@server.list_tools()`, `@server.call_tool()` routing, `main()` with `stdio_server()`, `asyncio.run(main())`

**Phase 7 (T016–T018): CONFIRMED**
- T016: 14/14 MCP tests pass independently
- T017: **46/46 PASS** — 14 new + 32 existing (14 Spec-4 + 18 Phase 2). Zero regressions.
- T018: `python server.py` imports verified cleanly (no ImportError, no crash)

**Discovery: google-generativeai deprecated**
- `google-generativeai>=0.8.0` installs but shows FutureWarning: package deprecated, switch to `google-genai`
- Updated requirements.txt to `google-genai>=1.0.0,<2.0.0`
- Spec-6 should use `import google.genai as genai` (new SDK)

## Outcome

- ✅ Impact: 4 files created, 1 file modified, 0 Phase 2/Spec-4 files touched
- 🧪 Tests: 46/46 PASS (up from 32). 14 new MCP tests. All 32 prior tests still pass.
- 📁 Files: task_tools.py (sync+async layers), server.py, test_mcp_task_tools.py, 2× __init__.py; requirements.txt updated
- 🔁 Next prompts: `/sp.specify` for Spec-6 (006-ai-agent-chat-endpoint) — Gemini agent + POST /api/chat
- 🧠 Key decision: PyPI `mcp` package name clash with local `src/mcp/` directory — resolved by: (1) test imports add `src/mcp/` to sys.path → `from tools.task_tools import ...`; (2) `server.py` imports `from mcp.server import Server` (PyPI package, unambiguous from server.py context)

## Evaluation notes (flywheel)

- Failure modes observed: (1) `google-generativeai` deprecated — switched to `google-genai`; (2) PyPI `mcp` namespace clash with `src/mcp/` — resolved with targeted sys.path manipulation
- Graders run and results: pytest 46/46 PASS
- Prompt variant: N/A
- Next experiment: Verify `google.genai` SDK API surface before writing Spec-6 agent code
