# Implementation Plan: MCP Task Server

**Branch**: `005-mcp-task-server` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-mcp-task-server/spec.md`

## Summary

Create a standalone MCP server using the Official Python MCP SDK that exposes 5 task
management tools (`add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`).
Each tool delegates to the existing `todo_service.py` layer — no new business logic, no
new database tables. The server uses stdio transport and creates its own SQLModel session
from `DATABASE_URL`. Tests live in `src/backend/tests/` reusing the existing session fixture.

## Technical Context

**Language/Version**: Python 3.11+ (async — MCP SDK requires async handlers)
**Primary Dependencies**: `mcp>=1.0.0,<2.0.0`, `sqlmodel`, `fastapi` (for HTTPException catch)
**Storage**: Neon Serverless PostgreSQL — same `DATABASE_URL` env var; MCP server creates its own engine
**Testing**: pytest — same test harness (`src/backend/tests/`); test tool handlers directly (no subprocess)
**Target Platform**: Linux server — MCP server started as subprocess by AI agent (Spec-6)
**Project Type**: Backend service — no frontend changes, no new HTTP routes
**Performance Goals**: Each tool call completes within one DB round-trip; no streaming required
**Constraints**: No duplicate task logic; no direct SQLModel queries in tools; no new DB tables;
user isolation enforced via `user_id` param passed to `todo_service`
**New Package**: `mcp>=1.0.0,<2.0.0` added to `requirements.txt`

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero Trust Backend | ✅ PASS | user_id passed as explicit param from JWT context (Spec-6 derives it) |
| II. Strict User Isolation | ✅ PASS | todo_service enforces user_id check on every operation |
| III. Spec-Driven Development | ✅ PASS | Spec-5 complete before this plan |
| IV. Separation of Concerns | ✅ PASS | Tools call service layer only; no ORM in tool handlers |
| V. Deterministic API Contracts | ✅ PASS | JSON Schema inputSchema defined for all 5 tools |
| VI. Stateless Backend | ✅ PASS | MCP server creates new session per request; no in-memory state |
| VII. Production-Ready Standards | ✅ PASS | DATABASE_URL from env; no hardcoded values |
| VIII. Security Standards | ✅ PASS | Cross-user access returns NOT_FOUND via todo_service |
| IX. Database Standards | ✅ PASS | Uses existing todo table via service layer |
| X. Frontend Standards | ✅ PASS | No frontend work in this spec |
| XI. AI Agent Architecture | ✅ PASS | MCP tools are the agent's only interface to task data |
| XII. MCP Tool Design | ✅ PASS | This spec IS the implementation of this principle |
| XIII. Conversation Persistence | ✅ PASS | Not in scope for this spec |
| XIV. AI Provider Abstraction | ✅ PASS | Not in scope for this spec |

**Post-Design Re-check**: All 14 gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-mcp-task-server/
├── spec.md              # Feature requirements
├── plan.md              # This file
├── research.md          # Technical decisions and rationale
├── contracts/
│   └── tool-contracts.md  # JSON Schema for all 5 tools + response shapes
├── quickstart.md        # Setup and smoke test guide
└── tasks.md             # Task breakdown (created by /sp.tasks)
```

### Source Code (files created/modified by this spec)

```text
src/
├── mcp/                          # NEW — MCP server package
│   ├── __init__.py               # NEW — empty package marker
│   ├── server.py                 # NEW — MCP server entry point (stdio)
│   └── tools/
│       ├── __init__.py           # NEW — empty package marker
│       └── task_tools.py         # NEW — 5 tool definitions + handlers
├── backend/
│   ├── requirements.txt          # UPDATED — add mcp>=1.0.0,<2.0.0
│   └── tests/
│       └── test_mcp_task_tools.py  # NEW — unit tests for all 5 tool handlers
```

**Files NOT touched:**
- `app/models/todo.py` — frozen (Phase 2)
- `app/services/todo_service.py` — frozen (Phase 2)
- `app/routes/todos.py` — frozen (Phase 2)
- `app/main.py` — no new router this spec
- `app/models/conversation.py` — frozen (Spec-4)
- `app/models/message.py` — frozen (Spec-4)
- `app/services/conversation_service.py` — frozen (Spec-4)
- All frontend files — out of scope

## Architecture: MCP Server + Shared Service Layer

```
┌─────────────────────────────────────────────┐
│  AI Agent (Spec-6)                          │
│  Spawns MCP server as subprocess            │
│  Communicates via stdio                      │
└──────────────────┬──────────────────────────┘
                   │ stdin/stdout (MCP protocol)
┌──────────────────▼──────────────────────────┐
│  MCP Server (src/mcp/server.py)             │
│  • Registers 5 tools                        │
│  • Routes call_tool() to task_tools.py      │
└──────────────────┬──────────────────────────┘
                   │ function calls
┌──────────────────▼──────────────────────────┐
│  task_tools.py                              │
│  • add_task_handler()                       │
│  • list_tasks_handler()                     │
│  • complete_task_handler()                  │
│  • delete_task_handler()                    │
│  • update_task_handler()                    │
│  • Creates Session from DATABASE_URL        │
└──────────────────┬──────────────────────────┘
                   │ Session + typed args
┌──────────────────▼──────────────────────────┐
│  todo_service.py (frozen — Spec-2)          │
│  • create_todo / list_todos / get_todo      │
│  • update_todo / complete_todo / delete_todo│
└──────────────────┬──────────────────────────┘
                   │ SQLModel Session
┌──────────────────▼──────────────────────────┐
│  Neon PostgreSQL — todo table               │
└─────────────────────────────────────────────┘
```

## Key Design Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|----------------------|
| stdio transport | Simplest for hackathon; AI agent (Spec-6) spawns as subprocess; no HTTP overhead | HTTP transport — unnecessary complexity; requires port management; server.py would need to bind a port |
| Tool handlers in `task_tools.py` (not `server.py`) | Separation of concerns; easier unit testing (import handler functions directly); server.py stays thin | All in server.py — harder to test individual handlers without starting full server process |
| Test handlers directly (not via subprocess) | Unit tests call handler functions with mocked session; fast; no process management in tests | Test via subprocess — adds process lifecycle complexity to test suite |
| MCP server creates its own DB session | MCP server is a separate process; cannot share FastAPI session; must create its own engine | Shared session — impossible across process boundaries |
| `asyncio.to_thread()` for DB calls | MCP SDK requires async handlers; SQLModel sessions are synchronous; wrapping prevents event loop blocking | Async SQLAlchemy — large refactor of all service code; out of scope |
| Return `TextContent(json.dumps(result))` | Standard MCP pattern for structured data; AI agent parses the JSON text | Multiple content items — unnecessary; single JSON string is simpler |
| `mcp>=1.0.0,<2.0.0` pinned range | Stable API surface; prevents breaking changes from 2.x | Unpinned — risks incompatibility |

## Complexity Tracking

> No Constitution violations — informational only.

| Concern | Resolution |
|---------|-----------|
| `todo_service` raises `HTTPException` (FastAPI-specific) | Tool handlers catch `HTTPException` explicitly; convert `status_code=404` to `NOT_FOUND`, others to `INTERNAL_ERROR` |
| `task_id` as string in MCP vs UUID in todo_service | Handler converts `str → uuid.UUID` with try/except; invalid UUIDs become `VALIDATION_ERROR` |
| Async MCP handlers calling sync service functions | `asyncio.to_thread(sync_fn, *args)` pattern; keeps event loop unblocked |
| Test helpers need `TodoCreate`, `TodoUpdate` schemas | Import from `app.models.schemas` in test file — same pattern as conftest.py imports |
