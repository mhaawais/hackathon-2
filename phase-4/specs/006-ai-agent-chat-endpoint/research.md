# Research: AI Agent & Chat Endpoint

**Branch**: `006-ai-agent-chat-endpoint` | **Date**: 2026-02-27

## Decision Log

### D-001: Google Gemini SDK — `google-genai` (New SDK)

**Decision**: Use `google.genai` (the `google-genai` package, already installed in Spec-5).
Import pattern: `import google.genai as genai; from google.genai import types`.

**Rationale**: `google-generativeai` (old `google.generativeai`) is deprecated as of 2025.
The new `google-genai` package has a cleaner API:
- `genai.Client(api_key=KEY)` (not `genai.configure()`)
- `client.models.generate_content(model=NAME, contents=[...], config=...)`
- `types.GenerateContentConfig(tools=[...], system_instruction=...)`
- `types.Tool(function_declarations=[...])`, `types.FunctionDeclaration(name, description, parameters)`
- `types.Schema(type="OBJECT", properties={...}, required=[...])`
- `types.Part.from_function_response(name=..., response=...)` for tool results

**Alternative rejected**: `google-generativeai` / `google.generativeai` — deprecated, FutureWarning on import.

---

### D-002: Gemini Model — `gemini-2.0-flash` as Default

**Decision**: Default to `gemini-2.0-flash`. Configurable via `GEMINI_MODEL` env var.

**Rationale**: `gemini-2.0-flash` is fast, cheap (free tier), and supports function calling.
`gemini-1.5-flash` also works — env var allows switching. Constitution XIV requires model
to be configurable, not hardcoded.

**Alternative rejected**: `gemini-pro` — deprecated. `gemini-1.5-pro` — slower, higher cost.

---

### D-003: Tool Call Strategy — Direct Python Function Calls

**Decision**: `agent_service.py` imports `do_*()` functions from `src/mcp/tools/task_tools.py`
and calls them directly (Python function calls, not MCP stdio protocol).

**Rationale**: The MCP server (Spec-5) exposes the stdio interface for external consumers
(e.g., Claude Desktop, other AI agents). Internally within the same Python process,
calling `do_*()` directly is simpler, faster (~0ms vs ~100ms subprocess spawn), and equally
correct — both call `todo_service` with the same logic. The MCP tool definitions in
`server.py` serve as the external API contract; `task_tools.py` is the shared implementation.

**Alternative rejected**: Spawn MCP subprocess per request — ~100ms subprocess overhead per
request; process lifecycle management complexity; no benefit since we own both sides.

---

### D-004: user_id Security — Injected by Server, Not in Function Declarations

**Decision**: `user_id` is NOT included in any Gemini `FunctionDeclaration`. When dispatching
a tool call, `agent_service` injects `user_id` from the JWT before calling `do_*()`.

**Rationale**: Constitution Principle I — Zero Trust Backend. The AI model must never control
which user's data is accessed. If `user_id` were in the function declaration, a jailbroken
or confused model could invoke tools with a different `user_id`, accessing other users' data.
Keeping `user_id` server-injected is the secure design.

**Implementation**:
```python
args = dict(fc.args)       # args from Gemini (title, description, task_id, etc.)
args["user_id"] = user_id  # injected from JWT — overrides anything Gemini might have sent
result = do_add_task(session, **args)
```

---

### D-005: Agentic Loop — Max 5 Iterations

**Decision**: The Gemini loop runs at most 5 times. If no text response by iteration 5,
return a fallback message: `"I couldn't complete the operation. Please try again."`

**Rationale**: Simple task operations (add/list/complete/delete/update) rarely require more
than 2 tool calls. 5 is a safe upper bound that prevents infinite loops from bugs or
unexpected model behavior. Higher limits waste API quota; lower limits might cut off valid
multi-tool operations.

**Alternative rejected**: Unlimited loop — risk of infinite loop if model keeps requesting tools.

---

### D-006: Testing Strategy — Mock `genai.Client`

**Decision**: Tests use `unittest.mock.patch("app.services.agent_service.genai")` to replace
the Google AI client with a `MagicMock`. This allows tests to:
1. Verify the endpoint returns 401 without auth (no mock needed — auth layer rejects first)
2. Verify HTTP 200 response shape with a mocked `run_chat` return value
3. Verify conversation_id is created/resumed correctly

**Rationale**: Real Gemini API calls in tests are: (1) slow, (2) flaky (network-dependent),
(3) expensive (API quota), (4) non-deterministic (different responses each run). Mocking at
the `agent_service` level or at the `genai.Client` level both work; mocking at the service
level is simpler for endpoint tests.

**Mock approach for endpoint tests**: Patch `app.routes.chat.agent_service.run_chat` to
return a predictable `ChatResponse`. This tests the HTTP layer (auth, request/response shape)
without invoking the AI at all.

---

### D-007: Conversation Resumption — Silent New Conversation on Not-Found

**Decision**: If `conversation_id` is provided but the conversation is not found (or belongs
to another user), `run_chat` silently creates a new conversation without raising an error.

**Rationale**: The frontend may pass a stale or incorrect `conversation_id`. Failing with
an error would break the chat experience. Silently starting fresh is more resilient. The
returned `conversation_id` in the response tells the caller which conversation was used.
This matches the spec's FR-008: "a new conversation MUST be created silently."

**Alternative rejected**: Return HTTP 404 — breaks frontend chat flow for stale IDs.

---

### D-008: System Prompt — Hardcoded Constant in agent_service.py

**Decision**: Define `SYSTEM_PROMPT` as a module-level constant string in `agent_service.py`.

**Rationale**: For hackathon scope, the prompt is fixed. Keeping it in code (not a DB or env
var) makes it auditable and version-controlled. The prompt instructs the model to: use tools
for ALL task operations, confirm actions clearly, keep responses concise.

**System prompt**:
```
You are a helpful todo assistant. You help users manage their tasks through conversation.

Rules:
- Always use the provided tools to perform task operations (add, list, complete, delete, update).
- Never make up task data — only report what the tools return.
- After using a tool, confirm the action clearly and concisely to the user.
- If a tool returns an error, explain it to the user in plain language.
- Keep responses brief and action-focused.
```
