# Feature Specification: MCP Task Server

**Feature Branch**: `005-mcp-task-server`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Spec-5: MCP Task Server — Official Python MCP SDK, stdio transport,
5 tools (add_task, list_tasks, complete_task, delete_task, update_task), each tool calls
todo_service layer, structured error responses, user isolation via user_id parameter"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a Task via Natural Language (Priority: P1)

As an authenticated user chatting with the AI assistant, I want to say something like
"add a task to buy groceries" and have the AI create that task in my to-do list, so that
I can manage tasks through a natural conversation without navigating UI forms.

**Why this priority**: `add_task` is the most fundamental tool — without it, the AI chatbot
cannot create any tasks at all. All other tools operate on existing tasks; `add_task` creates
the tasks that all other tools will manage.

**Independent Test**: Call the `add_task` tool handler directly with valid `user_id` and `title`
arguments. Verify a new row exists in the `todo` table with the correct user_id, title, and
`status="pending"`. Verify the tool returns `{"task_id": <uuid>, "title": <str>, "status": "pending"}`.

**Acceptance Scenarios**:

1. **Given** valid `user_id` and `title`, **When** `add_task` is called, **Then** a new task is
   created in the database and the tool returns `{task_id, title, status: "pending"}`.
2. **Given** valid arguments including an optional `description`, **When** `add_task` is called,
   **Then** the task is stored with the description and the tool response includes it.
3. **Given** a `title` that is empty or whitespace only, **When** `add_task` is called,
   **Then** the tool returns `{"error": "...", "code": "VALIDATION_ERROR"}` — no task created.

---

### User Story 2 - List Tasks via Natural Language (Priority: P1)

As an authenticated user, I want to say "show me all my tasks" or "what tasks are pending?"
and have the AI return a readable list of my tasks with their current statuses, so that I
can get an overview of my workload in a conversational way.

**Why this priority**: Listing tasks is the most frequent tool call — it enables the AI to
answer virtually any status question. Required for the AI agent to give context-aware responses.

**Independent Test**: Create 3 tasks for user_a (2 pending, 1 completed). Call `list_tasks`
with `user_id=user_a` and no status filter → verify 3 tasks returned. Call with
`status="pending"` → verify 2 tasks returned. Call with `user_id=user_b` → verify empty list.

**Acceptance Scenarios**:

1. **Given** a user with 3 tasks, **When** `list_tasks` is called with no filter, **Then**
   all 3 tasks are returned with their `task_id`, `title`, `status`, and `description`.
2. **Given** a user with pending and completed tasks, **When** `list_tasks` is called with
   `status="pending"`, **Then** only pending tasks are returned.
3. **Given** a user with no tasks, **When** `list_tasks` is called, **Then** an empty tasks
   array is returned — not an error.
4. **Given** two users each with their own tasks, **When** user A calls `list_tasks`,
   **Then** only user A's tasks appear — zero cross-user leakage.

---

### User Story 3 - Manage Existing Tasks (Complete / Delete / Update) (Priority: P1)

As an authenticated user, I want to say things like "mark task X as done", "delete task Y",
or "rename task Z to a new name" and have the AI perform those changes to my tasks, so that
I can manage my task lifecycle entirely through conversation.

**Why this priority**: These three tools cover the full CRUD lifecycle for existing tasks.
Once tasks exist (via `add_task`), the user needs to progress and manage them.

**Independent Test**: Create a task. Call `complete_task` → verify status toggled to
"completed". Call `update_task` with new title → verify title changed in DB. Call
`delete_task` → verify task no longer exists in DB. All tool responses contain correct fields.

**Acceptance Scenarios**:

1. **Given** a pending task owned by the user, **When** `complete_task` is called with its
   `task_id`, **Then** the task status toggles to "completed" and the tool returns the updated
   task data.
2. **Given** a completed task, **When** `complete_task` is called again, **Then** the task
   status toggles back to "pending" (toggle behavior matches existing API).
3. **Given** a task owned by the user, **When** `update_task` is called with a new title or
   description, **Then** the task is updated and the tool returns the updated task data.
4. **Given** a task owned by the user, **When** `delete_task` is called, **Then** the task
   is removed from the database and the tool confirms deletion.

---

### User Story 4 - Graceful Tool Error Handling (Priority: P2)

As a developer integrating the MCP server with the AI agent, I need every tool call to
return a structured error response when operations fail (task not found, wrong user, invalid
input), rather than raising an exception that crashes the MCP server or the AI agent.

**Why this priority**: Error handling is critical for reliability but tools function without
it for the happy path. The AI agent needs structured error responses to tell the user why
an operation failed.

**Independent Test**: Call `complete_task` with a non-existent `task_id`. Verify the tool
returns `{"error": "Task not found", "code": "NOT_FOUND"}` without crashing. The MCP server
process continues accepting new tool calls after the error.

**Acceptance Scenarios**:

1. **Given** a non-existent `task_id`, **When** any tool that requires it is called, **Then**
   the tool returns `{"error": "Task not found", "code": "NOT_FOUND"}` — no exception raised.
2. **Given** a `task_id` that belongs to a different user, **When** any tool that requires
   it is called with a different `user_id`, **Then** the tool returns a "not found" error —
   no cross-user data exposure.
3. **Given** an unexpected database error, **When** any tool is called, **Then** the tool
   returns `{"error": <message>, "code": "INTERNAL_ERROR"}` — the server does not crash.

---

### Edge Cases

- What happens when `title` is empty or whitespace? `add_task` returns a validation error;
  `todo_service` raises ValueError which the tool handler converts to a structured error.
- What happens when `task_id` is not a valid UUID? The tool handler catches the validation error
  and returns `{"error": "Invalid task_id format", "code": "VALIDATION_ERROR"}`.
- What happens when `update_task` is called with neither `title` nor `description`?
  The tool calls `todo_service.update_todo` with empty `TodoUpdate`; service applies no-op.
- What happens if the MCP server cannot connect to the database? Server fails to start with
  a clear error message in stderr — not a silent failure.
- What happens when `list_tasks` is called with `status="all"`? Returns all tasks regardless
  of status (equivalent to no filter).

## Requirements *(mandatory)*

### Functional Requirements

**Tool Definitions**

- **FR-001**: MCP server MUST expose exactly 5 tools with the following names:
  `add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`.
- **FR-002**: Each tool MUST include a JSON Schema `inputSchema` defining all parameters
  with type, description, and required fields.
- **FR-003**: Each tool MUST include a human-readable `description` for the AI agent's
  tool selection.

**Tool Input/Output Contracts**

- **FR-004**: `add_task` MUST accept: `user_id: str` (required), `title: str` (required),
  `description: str` (optional). Returns: `{task_id, title, status, description}`.
- **FR-005**: `list_tasks` MUST accept: `user_id: str` (required), `status: str` (optional,
  values: "all"|"pending"|"completed", default "all"). Returns: `{tasks: [...], count: int}`.
- **FR-006**: `complete_task` MUST accept: `user_id: str` (required), `task_id: str`
  (required). Returns: `{task_id, status, toggled: bool}`.
- **FR-007**: `delete_task` MUST accept: `user_id: str` (required), `task_id: str`
  (required). Returns: `{task_id, deleted: bool}`.
- **FR-008**: `update_task` MUST accept: `user_id: str` (required), `task_id: str`
  (required), `title: str` (optional), `description: str` (optional). Returns: `{task_id, title, status, description}`.

**Error Handling**

- **FR-009**: Every tool MUST catch all exceptions and return a structured JSON error
  response instead of raising: `{"error": <message>, "code": <ERROR_CODE>}`.
- **FR-010**: Error codes MUST be: `"NOT_FOUND"` (404 from service), `"VALIDATION_ERROR"`
  (invalid input), `"INTERNAL_ERROR"` (unexpected exceptions).
- **FR-011**: MCP server process MUST continue accepting tool calls after any single tool error.

**Service Layer Integration**

- **FR-012**: All 5 tools MUST delegate to the existing `todo_service` functions:
  `create_todo`, `list_todos`, `complete_todo`, `delete_todo`, `update_todo`.
- **FR-013**: MCP tools MUST NOT contain any direct SQLModel queries or task business logic —
  all logic stays in `todo_service.py`.
- **FR-014**: MCP tools MUST convert `todo_service` inputs from string arguments to the
  required types (e.g., `task_id: str → uuid.UUID`).

**Transport & Architecture**

- **FR-015**: MCP server MUST use stdio transport (the `mcp` package's `stdio_server()`).
- **FR-016**: MCP server MUST start with `python server.py` or `python -m mcp.server` and
  accept tool calls on stdin, respond on stdout.
- **FR-017**: MCP server MUST load `DATABASE_URL` from environment to create its own
  SQLModel session — no shared session state with the FastAPI backend.

**User Isolation**

- **FR-018**: User isolation MUST be enforced by passing `user_id` from tool arguments to
  `todo_service` — the service layer enforces the ownership check.
- **FR-019**: Tools MUST NOT access tasks belonging to a different user; `todo_service`
  raises `HTTPException(404)` for cross-user access which tools convert to `NOT_FOUND` error.

### Key Entities

- **MCP Tool**: Defined by name, description, JSON Schema inputSchema, and async handler
  function. No new database tables — all task data uses the existing `todo` table via
  `todo_service`.
- **Tool Response**: JSON-serializable dict returned as `TextContent(type="text", text=json.dumps(...))`.
  Success responses include task data; error responses include `{"error": str, "code": str}`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: MCP server starts without errors when `DATABASE_URL` is set and the `mcp`
  package is installed — clean `python server.py` execution.
- **SC-002**: All 5 tool handlers produce the correct database outcomes (task created,
  listed, completed, deleted, updated) — verified against SQLite in-memory DB in unit tests.
- **SC-003**: All 5 tools return structured JSON responses on both success and failure — 0
  unhandled exceptions propagate to the caller across all test scenarios.
- **SC-004**: User A's tasks are completely isolated from User B's — all 5 tools return
  only the requesting user's data; cross-user access returns NOT_FOUND, not task data.
- **SC-005**: All tool handlers have typed function signatures and docstrings per constitution
  Principle XII requirements.
- **SC-006**: pytest test suite with ≥ 10 tests covering happy-path and error-path for all
  5 tools passes with 0 failures and 0 regressions in existing Phase 2/Spec-4 tests.

## Assumptions

- The `mcp` Python package (Official Python MCP SDK) is installable via pip and compatible
  with Python 3.11+. Version pinned to `>=1.0.0,<2.0.0` in requirements.
- The MCP server uses synchronous `todo_service` functions wrapped in async handlers using
  `asyncio.to_thread()` to avoid blocking the event loop.
- `task_id` values are UUID strings — the tool handler converts `str → uuid.UUID` before
  passing to `todo_service`.
- The `status` filter for `list_tasks` maps directly to `todo_service.list_todos(status_filter=...)`.
  When `status="all"`, `status_filter=None` is passed.
- The MCP server is started as a subprocess by the AI agent in Spec-6 using stdio transport.
  Spec-5 does not specify how the agent starts it (that is Spec-6's concern).
- Error responses are returned as `TextContent` with JSON string — not as MCP error objects.
  The AI agent will parse the JSON and inform the user appropriately.
- No authentication within the MCP server itself — `user_id` is passed as a tool parameter,
  derived from JWT at the chat endpoint level (Spec-6).

## Dependencies

- **Spec-2 (002-persistence-domain)**: `todo_service.py` and the `todo` table — the MCP
  tools delegate all task logic to these existing functions.
- **Spec-4 (004-conversation-persistence)**: Conversation service (no dependency for tool
  logic, but Spec-4 and Spec-5 are both prerequisites for Spec-6).

## Scope Boundaries

**In scope:**
- MCP server entry point (`src/mcp/server.py`) using Official Python MCP SDK with stdio transport
- 5 tool definitions with JSON Schema input schemas and typed descriptions
- 5 async tool handler functions in `src/mcp/tools/task_tools.py`
- SQLModel session creation within the MCP server using `DATABASE_URL` env var
- Structured error handling in all tool handlers
- Unit tests for all 5 tools (happy path + error path) in `src/backend/tests/test_mcp_task_tools.py`
- Add `mcp` and `google-generativeai` to `src/backend/requirements.txt`

**Out of scope:**
- AI agent orchestration (Spec-6)
- Chat API endpoint (Spec-6)
- Chat frontend (Spec-7)
- HTTP transport for MCP (stdio is sufficient for hackathon scope)
- Authentication within the MCP server (handled at chat endpoint level in Spec-6)
- Any new database tables (all task data is in the existing `todo` table)
- FastAPI router changes (no new HTTP endpoints in this spec)
- Streaming responses from MCP tools
