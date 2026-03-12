# Feature Specification: AI Agent & Chat Endpoint

**Feature Branch**: `006-ai-agent-chat-endpoint`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Spec-6: AI Agent & Chat Endpoint — Gemini AI agent using
google-genai Python SDK, stateless POST /api/chat FastAPI endpoint, conversation history
from DB, MCP tools for task operations, user_id injected from JWT (never from request body)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a Chat and Manage Tasks via Natural Language (Priority: P1)

As an authenticated user, I want to send a plain-English message like "add a task to buy
groceries" to the chat API and receive an AI response that has already performed the action
on my behalf, so that I can manage my tasks through conversation without touching the UI.

**Why this priority**: This is the core value proposition of Phase 3. Without a working chat
endpoint, the AI chatbot is non-functional. All other user stories depend on this foundation.

**Independent Test**: POST `/api/chat` with a valid JWT and `{"message": "Add a task to read
a book"}` (no `conversation_id`). Assert: HTTP 200, `conversation_id` present in response,
`response` text present, a new conversation and two messages exist in the DB (one user, one
assistant). Verify the `todo` table has a new row for the correct user.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no existing conversations, **When** they POST to
   `/api/chat` with a message and no `conversation_id`, **Then** a new conversation is
   created, the AI responds, and the response includes the new `conversation_id`.
2. **Given** a message expressing intent to add a task, **When** the AI processes it,
   **Then** the AI calls the `add_task` MCP tool and the task appears in the user's task list.
3. **Given** a valid JWT, **When** the endpoint processes the request, **Then** the user's
   `user_id` is extracted from the JWT only — the request body never controls identity.
4. **Given** a completed request, **When** the response is returned, **Then** the user
   message and assistant response are both persisted in the `message` table.

---

### User Story 2 - Resume a Previous Conversation (Priority: P1)

As an authenticated user, I want to continue a previous chat session by including a
`conversation_id` in my request, so that the AI has full context of our prior exchanges
and can give coherent, contextually-aware responses.

**Why this priority**: Without conversation resumption, every request starts from scratch.
The AI cannot refer to prior context, making it useless for multi-turn tasks.

**Independent Test**: Create a conversation via the service layer with 2 existing messages.
POST `/api/chat` with that `conversation_id`. Assert: the agent's response was generated
using the full prior history (verified by checking that the Gemini content list included
the prior messages), and the conversation now has 4 messages in the DB.

**Acceptance Scenarios**:

1. **Given** an existing conversation with 3 prior messages, **When** a new message is sent
   with that `conversation_id`, **Then** all 3 prior messages are included in the Gemini
   context before generating the response.
2. **Given** a `conversation_id` belonging to a different user, **When** a request is made,
   **Then** the server treats it as "no prior conversation" and creates a new one — no
   cross-user data exposure.
3. **Given** a non-existent `conversation_id`, **When** a request is made, **Then** the
   server creates a new conversation — not an error.

---

### User Story 3 - The AI Correctly Invokes Task Tools (Priority: P1)

As an authenticated user, I want the AI to correctly identify my intent (add, list,
complete, delete, update) and invoke the right tool on my behalf, so that my natural
language instructions reliably translate into correct task operations.

**Why this priority**: The AI agent must reliably translate user intent to tool calls.
Without correct tool dispatch, task management via chat is unreliable and frustrating.

**Independent Test**: For each of the 5 tool types, send a message expressing that intent.
Verify: (a) the correct tool name appears in `tool_calls` in the response, (b) the DB
reflects the expected change. Example: "mark task <id> as done" → `complete_task` in
tool_calls, task status changed to "completed" in DB.

**Acceptance Scenarios**:

1. **Given** a message like "add task: buy milk", **When** the AI processes it, **Then**
   the `add_task` tool is called and the task is created in the DB.
2. **Given** a message like "show me all my tasks", **When** the AI processes it, **Then**
   the `list_tasks` tool is called and the response describes the user's tasks.
3. **Given** a message to complete/delete/update a specific task, **When** the AI processes
   it with the task's ID, **Then** the respective tool is called and the DB state reflects
   the change.
4. **Given** a tool call result, **When** the AI receives the result, **Then** it formulates
   a natural language confirmation response to include in the API reply.

---

### User Story 4 - Protected Endpoint (Priority: P1)

As a security-conscious system operator, I need the chat endpoint to require a valid JWT
for every request, so that unauthenticated users cannot interact with the AI agent or
access any task data.

**Why this priority**: Auth protection is foundational. An unprotected AI endpoint would
expose all task data and allow unauthorized task manipulation.

**Independent Test**: POST `/api/chat` without an `Authorization` header → assert HTTP 401.
POST with an expired or malformed token → assert HTTP 401. POST with a valid token for
user A → assert task operations only affect user A's data.

**Acceptance Scenarios**:

1. **Given** a request with no `Authorization` header, **When** POST `/api/chat` is called,
   **Then** the server returns HTTP 401 without invoking the AI agent.
2. **Given** a request with an expired JWT, **When** POST `/api/chat` is called,
   **Then** the server returns HTTP 401.
3. **Given** two users each with their own tasks, **When** user A sends a "list my tasks"
   message, **Then** only user A's tasks appear in the response — user B's tasks are never
   visible or accessible.

---

### Edge Cases

- What if the Gemini API returns no text and no tool calls? Return a fallback message:
  "I couldn't process that request. Please try again."
- What if a tool call returns an error dict (`{"error": "...", "code": "NOT_FOUND"}`)? The
  error is passed back to Gemini as the function result so it can inform the user.
- What if the agentic tool-call loop exceeds a maximum iteration count? Break the loop and
  return whatever response text is available, preventing infinite loops.
- What if `conversation_id` is provided but belongs to another user? Treat as "not found" —
  create a new conversation silently (no leakage of existence).
- What if the Gemini API raises an exception? Return HTTP 500 with a safe error message.
- What if the message is empty or whitespace? Return HTTP 422 (Pydantic validates `message`
  is non-empty).

## Requirements *(mandatory)*

### Functional Requirements

**Chat Endpoint**

- **FR-001**: `POST /api/chat` MUST require a valid JWT in the `Authorization: Bearer` header;
  return HTTP 401 for missing/invalid/expired tokens.
- **FR-002**: `POST /api/chat` MUST accept `{"message": str, "conversation_id": int | null}`.
- **FR-003**: `POST /api/chat` MUST return `{"conversation_id": int, "response": str, "tool_calls": [...]}`.
- **FR-004**: `message` MUST be validated as non-empty (return 422 for blank messages).
- **FR-005**: `user_id` MUST be extracted from the JWT only — never from the request body.

**Conversation Lifecycle**

- **FR-006**: If `conversation_id` is `null` or not provided, a new conversation MUST be
  created automatically.
- **FR-007**: If `conversation_id` is provided and belongs to the authenticated user, the
  existing conversation MUST be resumed with full history loaded.
- **FR-008**: If `conversation_id` is provided but not found or belongs to a different user,
  a new conversation MUST be created silently — no error returned.
- **FR-009**: The user's message MUST be stored to the DB before the agent runs.
- **FR-010**: The agent's final text response MUST be stored to the DB after the agent runs.
- **FR-011**: Both message storage operations MUST use `conversation_service.add_message()`.

**AI Agent**

- **FR-012**: The AI agent MUST use the Google Gemini model (configured via `GEMINI_MODEL`
  env var, default `gemini-2.0-flash`).
- **FR-013**: The agent MUST be initialized via `google.genai.Client(api_key=GEMINI_API_KEY)`.
- **FR-014**: The agent MUST receive the full conversation history as Gemini `Content` objects
  before generating a response.
- **FR-015**: The agent MUST have access to all 5 task tools via Gemini function declarations.
- **FR-016**: `user_id` MUST be injected into every tool call by the server — it MUST NOT
  appear in the Gemini function declarations (the AI never controls it).
- **FR-017**: The agent MUST follow an agentic loop: generate → check for function calls →
  execute tools → feed results back → generate final response. Loop limit: 5 iterations.
- **FR-018**: On tool call error (tool returns `{"error": ..., "code": ...}`), the error
  result MUST be fed back to Gemini so it can communicate the failure to the user.
- **FR-019**: The agent MUST use a system prompt instructing it to use tools for all task
  operations and to confirm actions clearly.

**Tool Integration**

- **FR-020**: Tool calls MUST execute via the sync functions from `src/mcp/tools/task_tools.py`
  (`do_add_task`, `do_list_tasks`, `do_complete_task`, `do_delete_task`, `do_update_task`).
- **FR-021**: Tool function declarations MUST match the schemas defined in Spec-5 contracts
  (minus `user_id` which is server-injected).
- **FR-022**: All executed tool calls MUST be recorded and returned in `tool_calls` response field.

**Configuration**

- **FR-023**: `GEMINI_API_KEY` MUST be loaded from environment via `settings.GEMINI_API_KEY`.
  The key MUST NOT appear in any frontend code or client-side bundle.
- **FR-024**: `GEMINI_MODEL` MUST be loaded from environment (default: `gemini-2.0-flash`).

### Key Entities

- **ChatRequest**: `{message: str (non-empty), conversation_id: int | None}` — request body
- **ChatResponse**: `{conversation_id: int, response: str, tool_calls: list[ToolCallRecord]}`
- **ToolCallRecord**: `{tool_name: str, arguments: dict, result: dict}` — one per tool invoked

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `POST /api/chat` with a valid JWT and task-related message returns HTTP 200
  with `conversation_id`, `response` (non-empty string), and `tool_calls` (list, possibly empty).
- **SC-002**: A request without JWT returns HTTP 401 — the agent is never invoked.
- **SC-003**: After a chat turn, exactly 2 messages exist in the DB for the conversation
  (user message + assistant response) — 100% persistence rate.
- **SC-004**: When `conversation_id` is provided, the agent's Gemini context includes all
  prior messages — 100% history loading accuracy.
- **SC-005**: `user_id` appears in every tool call result but never in Gemini function
  declarations — 0% chance of AI controlling user identity.
- **SC-006**: pytest test suite with ≥ 4 tests covering auth, conversation lifecycle, and
  structured response passes with 0 failures and 0 regressions in prior specs.

## Assumptions

- `GEMINI_API_KEY` is set in `.env` with a valid Google AI Studio key.
- `GEMINI_MODEL` defaults to `gemini-2.0-flash` (fast, free-tier compatible).
- Tests mock the Gemini API client — no real API calls in the test suite.
- The `agent_service.py` imports `task_tools.do_*()` directly (Python function calls,
  not MCP stdio protocol). The MCP protocol is the external contract; internal Python
  calls are the implementation. Both call the same `todo_service` layer.
- The agentic loop handles at most 5 tool-call iterations to prevent runaway loops.
- Conversation history is loaded without pagination — all messages in one DB round-trip.
- The system prompt is a constant in `agent_service.py` — not configurable via env.
- The response `tool_calls` list preserves the order tools were invoked.

## Dependencies

- **Spec-4 (004-conversation-persistence)**: `conversation_service.py` for create/get/add_message/get_messages
- **Spec-5 (005-mcp-task-server)**: `task_tools.do_*()` for task operations via Gemini function calling
- **Spec-1 (001-identity-security)**: `get_current_user` dependency for JWT extraction
- **Spec-2 (002-persistence-domain)**: `get_session` dependency and SQLModel session management

## Scope Boundaries

**In scope:**
- `POST /api/chat` FastAPI route in `src/backend/app/routes/chat.py`
- `agent_service.py` with `run_chat()` and Gemini agentic loop
- `ChatRequest`, `ChatResponse`, `ToolCallRecord` Pydantic schemas in `schemas.py`
- `GEMINI_API_KEY` and `GEMINI_MODEL` added to `config.py`
- `main.py` updated to include chat router
- Tests: endpoint tests (mocked agent), auth tests

**Out of scope:**
- Chat frontend (Spec-7)
- MCP stdio protocol communication (Spec-5 handles tool definitions; this spec calls Python functions directly)
- Streaming responses (non-streaming for hackathon scope)
- Rate limiting or token counting
- Conversation deletion endpoint
- Any modifications to Spec-1, Spec-2, Spec-4, or Spec-5 code
