# Quickstart: AI Agent & Chat Endpoint (Spec-6)

## Prerequisites

- Spec-4 complete: `conversation` and `message` tables in Neon DB
- Spec-5 complete: `src/mcp/tools/task_tools.py` with `do_*()` functions
- `google-genai>=1.0.0` installed (done in Spec-5)
- `GEMINI_API_KEY` set in `.env` (Google AI Studio free key)

## Environment Setup

Add to `.env`:
```bash
GEMINI_API_KEY=your_google_ai_studio_key_here
GEMINI_MODEL=gemini-2.0-flash
```

Get a free key: https://aistudio.google.com/apikey

## Run the Backend

```bash
# From phase-3/src/backend/
uvicorn app.main:app --reload
```

## Test the Chat Endpoint (Manual)

```bash
# 1. Get a JWT (sign in via frontend or use a test token)
TOKEN="your_jwt_here"

# 2. Start a new conversation
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task to buy milk"}'

# Expected response:
# {
#   "conversation_id": 1,
#   "response": "Done! I've added 'Buy milk' to your task list.",
#   "tool_calls": [{"tool_name": "add_task", "arguments": {...}, "result": {...}}]
# }

# 3. Resume conversation
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all my tasks", "conversation_id": 1}'

# 4. Test auth protection
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task"}'
# Expected: 401 Unauthorized
```

## Run Tests

```bash
# From phase-3/src/backend/
pytest tests/test_chat_endpoint.py -v
```

Expected output:
```
tests/test_chat_endpoint.py::test_chat_requires_auth PASSED
tests/test_chat_endpoint.py::test_chat_empty_message_returns_422 PASSED
tests/test_chat_endpoint.py::test_chat_creates_new_conversation PASSED
tests/test_chat_endpoint.py::test_chat_resumes_existing_conversation PASSED
tests/test_chat_endpoint.py::test_chat_response_has_required_fields PASSED

5 passed in Xs
```

## Run Full Suite (Regression Check)

```bash
pytest tests/ -v
# Expected: 51 tests pass (46 existing + 5 new chat tests), 0 failures
```

## File Locations

| File | Purpose |
|------|---------|
| `src/backend/app/routes/chat.py` | `POST /api/chat` FastAPI endpoint |
| `src/backend/app/services/agent_service.py` | Gemini agent orchestration |
| `src/backend/app/models/schemas.py` | Updated with ChatRequest, ChatResponse, ToolCallRecord |
| `src/backend/app/config.py` | Updated with GEMINI_API_KEY, GEMINI_MODEL |
| `src/backend/app/main.py` | Updated to include chat router |
| `src/backend/tests/test_chat_endpoint.py` | 5 endpoint tests (mocked agent) |
