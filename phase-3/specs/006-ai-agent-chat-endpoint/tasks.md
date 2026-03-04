# Tasks: AI Agent & Chat Endpoint

**Input**: Design documents from `/specs/006-ai-agent-chat-endpoint/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | contracts/ ✅ | quickstart.md ✅
**Branch**: `006-ai-agent-chat-endpoint`
**Date**: 2026-02-27

**Organization**: Tasks grouped by layer — config → schemas → agent service → route → tests.
**Tests**: 5 tests mocking the Gemini client; use existing `client` and `session` fixtures.

---

## Phase 1: Setup

- [x] T001 Read `src/backend/app/config.py`, `src/backend/app/main.py`, and
  `src/backend/app/models/schemas.py` to confirm existing patterns before making changes.

**Checkpoint**: Know the `Settings` class pattern, how routers are added to `main.py`,
and the `TodoCreate`/`TodoUpdate` style in `schemas.py`.

---

## Phase 2: Config & Schema

- [x] T002 Update `src/backend/app/config.py` — add `GEMINI_API_KEY` and `GEMINI_MODEL`:
  - `GEMINI_API_KEY: str` — read from env, raise `ValueError` if missing
  - `GEMINI_MODEL: str` — read from env, default `"gemini-2.0-flash"` (no raise if missing)

- [x] T003 [P] Update `src/backend/app/models/schemas.py` — add 3 new Pydantic models:
  ```python
  class ToolCallRecord(BaseModel):
      tool_name: str
      arguments: dict
      result: dict

  class ChatRequest(BaseModel):
      message: str
      conversation_id: int | None = None

      @field_validator("message")
      @classmethod
      def message_not_empty(cls, v: str) -> str:
          if not v.strip():
              raise ValueError("message cannot be empty")
          return v

  class ChatResponse(BaseModel):
      conversation_id: int
      response: str
      tool_calls: list[ToolCallRecord]
  ```

**Checkpoint**: `from app.models.schemas import ChatRequest, ChatResponse, ToolCallRecord` succeeds.

---

## Phase 3: Agent Service

**Purpose**: The core Gemini orchestration. All AI logic lives here — no AI in routes.

- [x] T004 Create `src/backend/app/services/agent_service.py` with these sections:
  **Section A — Imports and path setup**:
  - Add `src/mcp/` to sys.path (same pattern as `test_mcp_task_tools.py`)
  - Import `import google.genai as genai; from google.genai import types`
  - Import `from app.config import settings`
  - Import `from app.services.conversation_service import ...` (5 functions)
  - Import `do_*` functions from `tools.task_tools`

  **Section B — Constants**:
  ```python
  MAX_ITERATIONS = 5
  FALLBACK_MESSAGE = "I couldn't complete the operation. Please try again."
  SYSTEM_PROMPT = """You are a helpful todo assistant. You help users manage their tasks.
  Rules:
  - Always use the provided tools to perform task operations.
  - Never make up task data — only report what the tools return.
  - After using a tool, confirm the action clearly and concisely.
  - If a tool returns an error, explain it to the user in plain language.
  - Keep responses brief and action-focused."""
  ```

  **Section C — Gemini function declarations** (5 FunctionDeclaration objects, no user_id):
  - `add_task`: required `title`, optional `description`
  - `list_tasks`: optional `status` (enum: all/pending/completed)
  - `complete_task`: required `task_id`
  - `delete_task`: required `task_id`
  - `update_task`: required `task_id`, optional `title`, optional `description`
  - Wrap in `TASK_TOOL = types.Tool(function_declarations=[...])`

  **Section D — Tool dispatcher**:
  ```python
  def _dispatch_tool(session: Session, name: str, args: dict) -> dict:
      """Route a Gemini function call to the correct do_*() handler."""
  ```
  - Routes `name` to `do_add_task`, `do_list_tasks`, `do_complete_task`, `do_delete_task`, `do_update_task`
  - Unknown name → `{"error": f"Unknown tool: {name}", "code": "NOT_FOUND"}`

  **Section E — Gemini agentic loop**:
  ```python
  def _build_contents(messages: list) -> list[types.Content]:
      """Convert DB Message rows to Gemini Content objects."""
      # role mapping: "user" → "user", "assistant" → "model"

  def _run_gemini_agent(
      session: Session, user_id: str, history_messages: list
  ) -> tuple[str, list[dict]]:
      """Run Gemini with function calling loop. Returns (response_text, tool_calls_record)."""
  ```
  - Creates `genai.Client(api_key=settings.GEMINI_API_KEY)`
  - Loops up to `MAX_ITERATIONS` times
  - On function call: inject user_id, dispatch, append function response to contents
  - On text: return text and tool_calls_record
  - On loop exhaustion: return `FALLBACK_MESSAGE`

  **Section F — Public entry point**:
  ```python
  def run_chat(
      session: Session,
      user_id: str,
      message: str,
      conversation_id: int | None = None,
  ) -> ChatResponse:
  ```
  - Get or create conversation (silently create new if not found/wrong user)
  - `add_message(session, conv.id, user_id, "user", message)`
  - `get_messages_for_conversation(session, conv.id, user_id)`
  - `response_text, tool_calls = _run_gemini_agent(session, user_id, messages)`
  - `add_message(session, conv.id, user_id, "assistant", response_text)`
  - Return `ChatResponse(conversation_id=conv.id, response=response_text, tool_calls=[ToolCallRecord(**tc) for tc in tool_calls])`

**Checkpoint**: `from app.services.agent_service import run_chat` imports without error.

---

## Phase 4: Route

- [x] T005 Create `src/backend/app/routes/chat.py`:
  ```python
  from fastapi import APIRouter, Depends
  from sqlmodel import Session
  from app.db import get_session
  from app.auth.dependencies import get_current_user
  from app.models.schemas import ChatRequest, ChatResponse
  from app.services import agent_service

  router = APIRouter()

  @router.post("/chat", response_model=ChatResponse)
  def chat(
      request: ChatRequest,
      user_id: str = Depends(get_current_user),
      session: Session = Depends(get_session),
  ) -> ChatResponse:
      return agent_service.run_chat(
          session, user_id, request.message, request.conversation_id
      )
  ```

- [x] T006 Update `src/backend/app/main.py` — add chat router:
  ```python
  from app.routes import health, todos, chat
  app.include_router(chat.router, prefix="/api")
  ```

**Checkpoint**: `uvicorn app.main:app --reload` starts without import errors. `/api/docs` shows `POST /api/chat`.

---

## Phase 5: Tests

- [x] T007 Create `src/backend/tests/test_chat_endpoint.py`:

  **Import block**:
  - Import `Conversation`, `Message` at top (SQLite table registration for session fixture)
  - Import `ChatResponse`, `ToolCallRecord` from schemas

  **Test: auth required**:
  ```python
  def test_chat_requires_auth(client):
      response = client.post("/api/chat", json={"message": "hello"})
      assert response.status_code == 401
  ```

  **Test: empty message returns 422**:
  ```python
  def test_chat_empty_message_returns_422(client):
      response = client.post("/api/chat", json={"message": "  "}, headers=auth_header(USER_A_ID))
      assert response.status_code == 422
  ```

  **Test: creates new conversation** (mock `agent_service.run_chat`):
  ```python
  def test_chat_creates_new_conversation(client, session):
      from unittest.mock import patch, MagicMock
      mock_response = ChatResponse(conversation_id=1, response="Task added!", tool_calls=[])
      with patch("app.routes.chat.agent_service.run_chat", return_value=mock_response):
          response = client.post("/api/chat", json={"message": "Add a task"}, headers=auth_header(USER_A_ID))
      assert response.status_code == 200
      data = response.json()
      assert data["conversation_id"] == 1
      assert data["response"] == "Task added!"
      assert data["tool_calls"] == []
  ```

  **Test: resumes existing conversation**:
  ```python
  def test_chat_resumes_existing_conversation(client):
      from unittest.mock import patch
      mock_response = ChatResponse(conversation_id=42, response="Here are your tasks.", tool_calls=[])
      with patch("app.routes.chat.agent_service.run_chat", return_value=mock_response) as mock_fn:
          response = client.post("/api/chat",
              json={"message": "list tasks", "conversation_id": 42},
              headers=auth_header(USER_A_ID))
      assert response.status_code == 200
      # Verify run_chat was called with conversation_id=42
      call_args = mock_fn.call_args
      assert call_args.args[3] == 42 or call_args.kwargs.get("conversation_id") == 42
  ```

  **Test: response has required fields + tool_calls structure**:
  ```python
  def test_chat_response_has_required_fields(client):
      from unittest.mock import patch
      tc = ToolCallRecord(tool_name="add_task", arguments={"title": "x"}, result={"task_id": "abc"})
      mock_response = ChatResponse(conversation_id=5, response="Done!", tool_calls=[tc])
      with patch("app.routes.chat.agent_service.run_chat", return_value=mock_response):
          response = client.post("/api/chat", json={"message": "add x"}, headers=auth_header(USER_A_ID))
      assert response.status_code == 200
      data = response.json()
      assert "conversation_id" in data
      assert "response" in data
      assert "tool_calls" in data
      assert data["tool_calls"][0]["tool_name"] == "add_task"
  ```

**Checkpoint**: `pytest tests/test_chat_endpoint.py -v` — all 5 pass.

---

## Phase 6: Polish & Regression

- [x] T008 Run full test suite: `pytest tests/ -v` from `src/backend/` — confirm all 51
  tests pass (46 existing + 5 new chat tests). Zero regressions.

- [x] T009 Verify the FastAPI app starts: `uvicorn app.main:app --reload` starts without
  errors (requires valid `GEMINI_API_KEY` in `.env` — use `sqlite:///:memory:` for DATABASE_URL).

- [x] T010 [P] Confirm `GEMINI_API_KEY` is not exposed: check that no frontend file, Next.js
  config, or test file prints or logs the API key. Verify it's only referenced in `config.py`.

---

## Dependencies & Execution Order

```
Phase 1 (Read existing patterns)
    │
    ▼
Phase 2 (Config + Schemas) — parallel: T002 and T003 can run simultaneously
    │
    ▼
Phase 3 (Agent Service) — depends on Phase 2 (imports schemas)
    │
    ├──▶ Phase 4 (Route + main.py) — depends on Phase 3
    │
    └──▶ Phase 5 (Tests) — depends on Phase 3 (mock run_chat)
    │
    ▼
Phase 6 (Polish) — depends on Phase 4 + Phase 5
```

---

## Test Summary

| Test | What it tests | Mock |
|------|--------------|------|
| `test_chat_requires_auth` | 401 without JWT | None (auth layer handles it) |
| `test_chat_empty_message_returns_422` | Pydantic validation | None |
| `test_chat_creates_new_conversation` | HTTP 200, response shape, new convo | `agent_service.run_chat` |
| `test_chat_resumes_existing_conversation` | conversation_id passed through | `agent_service.run_chat` |
| `test_chat_response_has_required_fields` | All response fields + tool_calls structure | `agent_service.run_chat` |

**Total: 5 tests across 4 user stories**

---

## Notes

- `GEMINI_API_KEY` must be set in `.env` for the server to start (config raises ValueError if missing)
- Tests set `os.environ.setdefault("GEMINI_API_KEY", "test-key")` in conftest (or test file) — no real API call
- `agent_service.py` adds `src/mcp/` to sys.path to import `tools.task_tools` — same pattern as `test_mcp_task_tools.py`
- The `client` fixture in conftest.py already sets `DATABASE_URL=sqlite://` — agent_service imports conftest env
- Do NOT modify `todo_service.py`, any Phase 2 route/model, or Spec-4/5 frozen files
- The `conftest.py` `client` fixture must be updated to set `GEMINI_API_KEY` env var before app import so `config.py` doesn't raise
