# Implementation Plan: AI Agent & Chat Endpoint

**Branch**: `006-ai-agent-chat-endpoint` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ai-agent-chat-endpoint/spec.md`

## Summary

Add `POST /api/chat` to the FastAPI backend and implement a stateless Gemini AI agent that
manages tasks via function calling. The agent fetches conversation history from DB on each
request, calls `do_*()` task functions directly (same functions used by the MCP server),
stores both messages to DB, and returns a structured `{conversation_id, response, tool_calls}`
response. No new database tables; no frontend changes; no streaming.

## Technical Context

**Language/Version**: Python 3.11+ (synchronous FastAPI route; Gemini client is sync-callable)
**Primary Dependencies**: `google-genai>=1.0.0` (already installed), `fastapi`, `sqlmodel`
**Storage**: Neon PostgreSQL — conversation/message tables from Spec-4; todo table from Spec-2
**Testing**: pytest — mock `google.genai.Client`; reuse `client` fixture from conftest.py
**Target Platform**: FastAPI backend (same process); no subprocess needed
**Project Type**: Backend API addition — no frontend changes
**Performance Goals**: Chat request completes in < 5s (Gemini latency; single agentic loop)
**Constraints**: user_id from JWT only; GEMINI_API_KEY server-side only; no ORM in routes

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero Trust Backend | ✅ PASS | user_id from JWT via get_current_user; never from request body; never in function declarations |
| II. Strict User Isolation | ✅ PASS | user_id injected into every tool call; conversation ownership enforced by conversation_service |
| III. Spec-Driven Development | ✅ PASS | Spec-6 complete before this plan |
| IV. Separation of Concerns | ✅ PASS | Route calls agent_service; agent_service calls task_tools + conversation_service; no ORM in route |
| V. Deterministic API Contracts | ✅ PASS | ChatRequest/ChatResponse schemas defined in spec; contracts/ has full details |
| VI. Stateless Backend & Agent | ✅ PASS | No in-memory state; all state in Neon DB; agent fetches history per request |
| VII. Production-Ready Standards | ✅ PASS | GEMINI_API_KEY from env via settings; GEMINI_MODEL from env |
| VIII. Security Standards | ✅ PASS | GEMINI_API_KEY never in frontend; user_id not in function declarations |
| IX. Database Standards | ✅ PASS | No new tables; uses existing todo, conversation, message tables via service layers |
| X. Frontend Standards | ✅ PASS | No frontend work in this spec |
| XI. AI Agent Architecture | ✅ PASS | This spec IS the implementation of this principle |
| XII. MCP Tool Design | ✅ PASS | Tools defined in Spec-5; this spec calls their Python functions |
| XIII. Conversation Persistence | ✅ PASS | Uses conversation_service from Spec-4 for all history operations |
| XIV. AI Provider Abstraction | ✅ PASS | Model name from settings.GEMINI_MODEL; client uses settings.GEMINI_API_KEY |

**Post-Design Re-check**: All 14 gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-ai-agent-chat-endpoint/
├── spec.md              # Feature requirements
├── plan.md              # This file
├── research.md          # Design decisions
├── contracts/
│   └── api-contract.md  # Request/response schemas + endpoint details
├── quickstart.md        # Setup and test guide
└── tasks.md             # Task breakdown
```

### Source Code (files touched by this spec)

```text
src/backend/
├── app/
│   ├── main.py                    # UPDATED — include chat router
│   ├── config.py                  # UPDATED — add GEMINI_API_KEY, GEMINI_MODEL
│   ├── routes/
│   │   └── chat.py                # NEW — POST /api/chat endpoint
│   ├── models/
│   │   └── schemas.py             # UPDATED — add ChatRequest, ChatResponse, ToolCallRecord
│   └── services/
│       └── agent_service.py       # NEW — Gemini agent orchestration + run_chat()
└── tests/
    └── test_chat_endpoint.py      # NEW — endpoint tests (mocked agent)
```

**Files NOT touched:**
- `app/models/todo.py` — frozen (Phase 2)
- `app/services/todo_service.py` — frozen (Phase 2)
- `app/routes/todos.py` — frozen (Phase 2)
- `app/models/conversation.py` / `message.py` — frozen (Spec-4)
- `app/services/conversation_service.py` — frozen (Spec-4)
- `src/mcp/tools/task_tools.py` — frozen (Spec-5); agent_service imports from it

## Architecture: Stateless Request Cycle

```
Client (e.g. frontend, curl)
│  POST /api/chat {message, conversation_id?}
│  Authorization: Bearer <jwt>
▼
chat.py (route)
│  1. get_current_user(jwt) → user_id
│  2. validate ChatRequest (message non-empty)
│  3. call agent_service.run_chat(session, user_id, message, conversation_id)
▼
agent_service.py (orchestrator)
│  1. get/create conversation via conversation_service
│  2. add_message(user message) → DB
│  3. get_messages_for_conversation → history
│  4. build Gemini content list from history
│  5. [Agentic loop] → Gemini generate_content
│     ├── tool call? → call do_*(session, user_id, **args)
│     │               feed result back as function_response
│     │               repeat (max 5 iterations)
│     └── text only → exit loop
│  6. add_message(assistant response) → DB
│  7. return ChatResponse
▼
chat.py (route)
│  return 200 {conversation_id, response, tool_calls}
▼
Client
```

## Key Design Decisions

| Decision | Rationale | Alternative Rejected |
|----------|-----------|----------------------|
| Synchronous Gemini client call | `google.genai.Client` supports sync calls; FastAPI route is sync; no async needed | Async Gemini client — adds complexity; sync is simpler and sufficient |
| Call `do_*()` directly (not MCP stdio) | Same functions; avoids subprocess overhead; agent_service imports task_tools via sys.path | Spawn MCP subprocess per request — ~100ms process startup per request; overkill for single-server |
| user_id NOT in function declarations | Constitution Principle I: backend controls identity; AI must not control who the user is | user_id in declarations — security risk: AI could be tricked into using wrong user_id |
| Loop limit of 5 iterations | Prevents infinite tool-call loops if model gets stuck; sufficient for any real task request | No limit — runaway loops possible; higher limit — unnecessary for simple task management |
| Mock Gemini in tests | Tests must be fast and offline; real Gemini calls are slow and require API key | Real Gemini calls — flaky (network), slow, expensive, not deterministic |
| `ChatRequest.message` validated non-empty | Empty messages would waste a Gemini API call | No validation — unnecessary API cost |
| System prompt as constant in agent_service | Simpler; hackathon scope; prompt doesn't change per request | DB-stored or env-stored prompt — overkill for hackathon |

## Gemini Agentic Loop Design

```python
# Simplified pseudocode — see agent_service.py for full implementation
def _run_gemini_agent(session, user_id, history_messages):
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    contents = _build_contents(history_messages)  # Convert DB messages to Gemini Content list
    tool_calls_record = []

    for _ in range(MAX_ITERATIONS):  # MAX_ITERATIONS = 5
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                tools=[TASK_TOOLS],          # FunctionDeclaration list (no user_id)
                system_instruction=SYSTEM_PROMPT,
            )
        )

        candidate_content = response.candidates[0].content
        function_calls = [p.function_call for p in candidate_content.parts
                          if p.function_call]

        if not function_calls:
            # Final text response — exit loop
            text = "".join(p.text for p in candidate_content.parts if p.text)
            return text or FALLBACK_MESSAGE, tool_calls_record

        # Append model's response (with function calls) to contents
        contents.append(candidate_content)

        # Execute each function call, build function response parts
        fn_response_parts = []
        for fc in function_calls:
            args = dict(fc.args)
            args["user_id"] = user_id           # Inject from JWT — model never controls this
            result = _dispatch_tool(session, fc.name, args)
            tool_calls_record.append({"tool_name": fc.name, "arguments": args, "result": result})
            fn_response_parts.append(
                types.Part.from_function_response(name=fc.name, response=result)
            )

        # Feed function results back into content for next Gemini turn
        contents.append(types.Content(role="user", parts=fn_response_parts))

    return FALLBACK_MESSAGE, tool_calls_record
```

## Complexity Tracking

| Concern | Resolution |
|---------|-----------|
| Converting DB messages to Gemini Content format | `role` maps: DB `"user"` → Gemini `"user"`, DB `"assistant"` → Gemini `"model"` |
| Session management in agent_service (called from route) | Route injects `session` via `Depends(get_session)`; agent_service receives it as a parameter |
| Test mocking: `google.genai.Client` | `unittest.mock.patch("app.services.agent_service.genai.Client")` to mock the client |
| sys.path for `task_tools` import in agent_service | Same pattern as `test_mcp_task_tools.py`: add `src/mcp/` to sys.path at module load |
| Gemini response may have multiple parts (text + tool calls) | Filter by `part.function_call is not None` vs `part.text` |
