# Claude Code Rules — Hackathon II, Phase 3: Todo AI Chatbot

> **Scope lock:** This file governs **Phase 3 ONLY**.
> Phase 1 (CLI todo) and Phase 2 (full-stack web app) are **complete and frozen**.
> Phase 4+ (Kubernetes, Kafka, event-driven) are **out of scope**.
> Any work outside Phase 3 boundaries MUST be refused.

---

## 1. Project Overview

| Dimension           | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Project**         | Todo AI Chatbot                                                |
| **Phase**           | 3 of Hackathon II (builds on Phase 2 full-stack)               |
| **Frontend**        | Next.js (App Router) + Vercel AI SDK                           |
| **Backend**         | FastAPI (Python 3.11+)                                         |
| **AI Provider**     | Google Gemini (`gemini-1.5-flash`) via `google-generativeai`   |
| **MCP Server**      | Official Python MCP SDK                                        |
| **Database**        | PostgreSQL on Neon, via SQLModel ORM                           |
| **Auth**            | Better Auth + JWT (unchanged from Phase 2)                     |
| **Chat UI**         | Vercel AI SDK `useChat` hook                                    |
| **Core new feature**| Natural language todo management via AI agent + MCP tools      |

### 1.1 What Phase 3 Adds on Top of Phase 2

| Addition                    | Description                                                         |
| --------------------------- | ------------------------------------------------------------------- |
| `Conversation` DB model     | Stores chat sessions per user                                       |
| `Message` DB model          | Stores individual chat messages (user + assistant turns)            |
| MCP Server                  | Exposes 5 task tools for the AI agent                               |
| Gemini AI Agent             | Orchestrates tool calls based on natural language                   |
| `POST /api/chat` endpoint   | Stateless chat endpoint with conversation history management        |
| Chat UI page                | Next.js `/chat` route using Vercel AI SDK `useChat`                |

### 1.2 Non-Goals (Hard Guardrails)

- No CLI todo app work (Phase 1 — frozen)
- No Phase 2 modifications unless fixing bugs that block Phase 3
- No Kubernetes, Helm, Docker deployment (Phase 4)
- No Kafka, Dapr, event-driven architecture (Phase 5)
- No OpenAI SDK — Google Gemini only
- No additional auth providers unless explicitly requested
- No CI/CD pipeline work unless explicitly requested
- No `GEMINI_API_KEY` in frontend code or client-side bundles

---

## 2. Spec-Driven Development (SDD) Workflow — Mandatory

All work MUST follow this sequence. No implementation without specs.

```
1. Spec    →  /specs/<feature>/spec.md        (requirements & acceptance criteria)
2. Plan    →  /specs/<feature>/plan.md         (architecture & design decisions)
3. Tasks   →  /specs/<feature>/tasks.md        (ordered, testable task breakdown)
4. Implement →  Code changes per task          (smallest viable diff)
5. Verify  →  Run tests, confirm acceptance    (all criteria pass)
```

### 2.1 Enforcement Rules

- **No code without a spec.** If a spec does not exist for the feature being requested, create it first.
- **No skipping steps.** Plan before tasks; tasks before implementation.
- **Each task must be testable.** Every task in `tasks.md` includes explicit test/verification criteria.
- **Smallest viable diff.** One task = one focused change. No unrelated refactors.
- **Spec numbering:** Phase 3 specs start at `004`. Specs `001`, `002`, `003` are frozen.

---

## 3. Agent Responsibilities & Coordination

### 3.1 Auth Agent (`auth-security`)

**Owns:** Authentication and authorization (inherited from Phase 2 — no changes expected).

| Responsibility       | Details                                                          |
| -------------------- | ---------------------------------------------------------------- |
| JWT verification     | Verify JWT on all protected routes including chat endpoint       |
| Auth middleware       | `get_current_user` FastAPI dependency — reused by chat route     |
| Better Auth          | Frontend session management — reused by chat UI                 |
| Auth tests           | Existing tests remain valid                                      |

### 3.2 Database Agent (`neon-db-specialist`)

**Owns:** Schema design, models, migrations for ALL tables including new Phase 3 models.

| Responsibility          | Details                                                       |
| ----------------------- | ------------------------------------------------------------- |
| `Conversation` model    | user_id (FK), id (PK), created_at, updated_at                |
| `Message` model         | id (PK), conversation_id (FK), user_id, role, content, created_at |
| Migrations              | Create new tables without touching existing todo/user tables  |
| Indexes                 | Index on `user_id` (Conversation), `conversation_id` (Message)|
| Smoke tests             | Verify Conversation + Message CRUD operations                 |

### 3.3 Backend Agent (`fastapi-backend`)

**Owns:** API routes, validation, service logic — including new chat endpoint.

| Responsibility             | Details                                                    |
| -------------------------- | ---------------------------------------------------------- |
| `POST /api/chat` endpoint  | Accepts `{conversation_id?, message}`, returns `{conversation_id, response, tool_calls}` |
| Request/response schemas   | `ChatRequest`, `ChatResponse` Pydantic models              |
| Conversation service       | Create/fetch conversations, add/list messages              |
| Agent service              | Orchestrate Gemini agent with MCP tools                    |
| Auth guard on chat         | `get_current_user` dependency applied to chat endpoint     |
| Error handling             | 400/401/404/422/500 for chat endpoint                      |
| Backend tests              | Unit + integration tests for chat endpoint                 |

### 3.4 MCP Server Agent (`mcp-server-specialist`)

**Owns:** The MCP server and all tool definitions.

| Responsibility   | Details                                                             |
| ---------------- | ------------------------------------------------------------------- |
| MCP server setup | Official Python MCP SDK; stdio or HTTP transport                   |
| `add_task`       | Parameters: user_id, title, description? → calls todo_service      |
| `list_tasks`     | Parameters: user_id, status? (all/pending/completed) → returns list|
| `complete_task`  | Parameters: user_id, task_id → toggles completion status           |
| `delete_task`    | Parameters: user_id, task_id → removes task                        |
| `update_task`    | Parameters: user_id, task_id, title?, description? → updates fields|
| Tool error handling | Return error info in response; never raise unhandled exceptions  |
| Tool tests       | Verify each tool produces correct DB state                         |

### 3.5 AI Agent Specialist (`ai-agent-specialist`)

**Owns:** Gemini agent orchestration and the stateless request cycle.

| Responsibility        | Details                                                           |
| --------------------- | ----------------------------------------------------------------- |
| Agent definition      | Gemini model + MCP tools + system prompt for task management      |
| Stateless cycle       | Fetch history → build context → run agent → store → return       |
| System prompt         | Instructs agent: use tools for ALL task ops, confirm actions      |
| Tool call routing     | Agent invokes MCP tools; results fed back into agent context      |
| Conversation creation | Auto-create new conversation if no `conversation_id` provided     |
| History loading       | Fetch all messages for conversation from DB before agent run      |
| Response storage      | Store user message + assistant response to DB after agent run     |
| Agent tests           | Mock MCP tools; verify intent → tool mapping correctness          |

### 3.6 Frontend Agent (`nextjs-frontend`)

**Owns:** All Next.js UI including the new chat page and chat components.

| Responsibility      | Details                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `/chat` route       | New page: authenticated chat interface                            |
| Chat components     | Message list, message input, tool-call feedback display           |
| Vercel AI SDK       | `useChat` hook wired to `POST /api/chat` backend endpoint        |
| Auth integration    | JWT attached to chat API calls; redirect to sign-in if 401       |
| Responsive chat UI  | Mobile-first; works on mobile, tablet, desktop                    |
| Navigation          | Link to chat from dashboard; breadcrumb/navbar update             |
| Chat tests          | Component tests for message rendering, input, and error states    |

### 3.7 Agent Coordination Rules

1. **DB Agent runs first** — `Conversation` and `Message` models must exist before any other agent uses them.
2. **MCP Server Agent runs second** — tools must be defined before the AI agent can use them.
3. **AI Agent Specialist runs third** — chat endpoint requires both conversation service and MCP tools.
4. **Backend Agent and MCP Agent coordinate** — `todo_service` is shared; MCP tools call it, not the ORM.
5. **Frontend Agent runs last** — chat UI integrates after the backend chat endpoint is complete.
6. **Auth Agent** — `get_current_user` dependency is reused; no changes needed unless bugs surface.
7. **No agent works outside its domain.** Cross-boundary tasks must be split and assigned correctly.

---

## 4. Authentication Requirements (Inherited from Phase 2 — Unchanged)

All Phase 2 auth requirements remain active. Additionally:

- [ ] **Chat endpoint protected:** `POST /api/chat` MUST require valid JWT (same `get_current_user` dependency).
- [ ] **user_id from JWT only:** Chat endpoint extracts user identity from JWT — never from request body.
- [ ] **Gemini API key server-side only:** `GEMINI_API_KEY` MUST only appear in backend `.env` and FastAPI config — never in Next.js or client-side code.

---

## 5. Core Features

### 5.1 Phase 2 Features (Retained — Must Still Work)

| # | Feature       | Status    |
|---|---------------|-----------|
| 1 | **Add**       | Complete  |
| 2 | **List**      | Complete  |
| 3 | **Update**    | Complete  |
| 4 | **Delete**    | Complete  |
| 5 | **Complete**  | Complete  |

### 5.2 Phase 3 Features (New)

| # | Feature                      | Description                                                                 |
|---|------------------------------|-----------------------------------------------------------------------------|
| 1 | **Natural language chat**    | User types plain English; AI agent determines intent and calls MCP tools.   |
| 2 | **Conversation persistence** | Chat history stored in DB; resumes correctly across sessions/server restarts.|
| 3 | **MCP task tools**           | 5 tools: add, list, complete, delete, update — AI's only interface to tasks. |
| 4 | **Chat UI**                  | Responsive chat page with message history, input, and tool-call feedback.    |
| 5 | **New conversation flow**    | Auto-creates new conversation; returns `conversation_id` in response.        |
| 6 | **Resume conversation**      | Passing `conversation_id` resumes an existing conversation with full history.|

---

## 6. Repository Structure

```
phase-3/
├── CLAUDE.md                              # This file (project rules)
├── .env.example                           # Environment variable template
├── .specify/
│   └── memory/
│       └── constitution.md               # Project principles (v2.0.0)
├── specs/
│   ├── 001-identity-security/            # FROZEN — Phase 2
│   ├── 002-persistence-domain/           # FROZEN — Phase 2
│   ├── 003-api-frontend-integration/     # FROZEN — Phase 2
│   ├── 004-conversation-persistence/     # Phase 3 — Conversation + Message models
│   ├── 005-mcp-task-server/              # Phase 3 — MCP server + 5 tools
│   ├── 006-ai-agent-chat-endpoint/       # Phase 3 — Gemini agent + chat endpoint
│   └── 007-chatkit-frontend/             # Phase 3 — Chat UI (Vercel AI SDK)
├── src/
│   ├── frontend/                          # Next.js app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/               # sign-in, sign-up (Phase 2 — unchanged)
│   │   │   │   ├── (public)/             # marketing pages (Phase 2 — unchanged)
│   │   │   │   ├── dashboard/            # Todo dashboard (Phase 2 — unchanged)
│   │   │   │   ├── chat/                 # NEW — AI chat interface
│   │   │   │   │   └── page.tsx
│   │   │   │   └── api/auth/[...all]/    # Better Auth handler
│   │   │   ├── components/
│   │   │   │   ├── todos/                # Phase 2 components (unchanged)
│   │   │   │   ├── chat/                 # NEW — chat components
│   │   │   │   │   ├── chat-window.tsx
│   │   │   │   │   ├── message-bubble.tsx
│   │   │   │   │   ├── chat-input.tsx
│   │   │   │   │   └── tool-call-badge.tsx
│   │   │   │   ├── layout/               # Navbar, footer (update nav links)
│   │   │   │   └── ui/                   # Shared UI primitives
│   │   │   └── lib/
│   │   │       ├── api.ts                # Existing API client (unchanged)
│   │   │       ├── auth.ts               # Better Auth server config
│   │   │       ├── auth-client.ts        # Better Auth client config
│   │   │       └── chat-api.ts           # NEW — chat API client helper
│   ├── backend/                           # FastAPI app
│   │   ├── app/
│   │   │   ├── main.py                   # Add chat router
│   │   │   ├── config.py                 # Add GEMINI_API_KEY, GEMINI_MODEL
│   │   │   ├── routes/
│   │   │   │   ├── health.py             # Unchanged
│   │   │   │   ├── todos.py              # Unchanged
│   │   │   │   └── chat.py               # NEW — POST /api/chat
│   │   │   ├── models/
│   │   │   │   ├── todo.py               # Unchanged
│   │   │   │   ├── schemas.py            # Add ChatRequest, ChatResponse
│   │   │   │   ├── conversation.py       # NEW — Conversation SQLModel
│   │   │   │   └── message.py            # NEW — Message SQLModel
│   │   │   ├── services/
│   │   │   │   ├── todo_service.py       # Unchanged (reused by MCP tools)
│   │   │   │   ├── conversation_service.py # NEW — conversation + message CRUD
│   │   │   │   └── agent_service.py      # NEW — Gemini agent orchestration
│   │   │   └── auth/                     # Unchanged
│   ├── mcp/                               # NEW — MCP server
│   │   ├── server.py                     # MCP server entry point
│   │   └── tools/
│   │       ├── __init__.py
│   │       └── task_tools.py             # 5 MCP tool definitions
│   └── db/
│       ├── connection.py                 # Unchanged
│       └── init_db.py                    # Updated to create new tables
├── tests/
│   ├── backend/                          # Existing + new chat endpoint tests
│   ├── mcp/                              # NEW — MCP tool tests
│   └── agent/                            # NEW — Agent orchestration tests
├── history/
│   ├── prompts/                          # PHR records (constitution/, 004-007/)
│   └── adr/                              # Architecture Decision Records
└── .specify/                             # SpecKit Plus templates & scripts
```

---

## 7. Environment & Secrets

| Variable                  | Purpose                                        | Required |
| ------------------------- | ---------------------------------------------- | -------- |
| `DATABASE_URL`            | Neon PostgreSQL connection string              | Yes      |
| `JWT_SECRET`              | Shared secret for JWT sign/verify              | Yes      |
| `BETTER_AUTH_SECRET`      | Better Auth secret key                         | Yes      |
| `BACKEND_URL`             | FastAPI base URL for frontend                  | Yes      |
| `NEXT_PUBLIC_API_URL`     | Public API URL for client-side calls           | Yes      |
| `GEMINI_API_KEY`          | Google Gemini API key — **backend only**       | Yes      |
| `GEMINI_MODEL`            | Gemini model name (default: gemini-1.5-flash)  | Yes      |

**Rules:**
- Never hardcode secrets. Always use `.env` (gitignored) and `.env.example` (committed, no real values).
- `GEMINI_API_KEY` MUST NOT appear in any frontend file, Next.js config, or client-side bundle.
- All agents must reference environment variables, never literal secret values.

---

## 8. Verification & Acceptance Criteria

### 8.1 Phase 2 Features (Must Still Pass)

- [ ] Add todo: authenticated user can create a todo; persisted in DB; visible in list.
- [ ] List todos: authenticated user sees only their own todos; empty state handled.
- [ ] Update todo: authenticated user can edit title/description; changes persisted.
- [ ] Delete todo: authenticated user can remove a todo; confirmed removed from DB.
- [ ] Complete todo: authenticated user can mark todo complete; status persisted.

### 8.2 Conversation Persistence (Spec-4)

- [ ] `Conversation` table created in Neon with correct schema.
- [ ] `Message` table created with correct schema and FK to conversations.
- [ ] Conversation created successfully with valid `user_id`.
- [ ] Messages added and retrieved in correct order.
- [ ] Data survives server restart (persisted in DB, no in-memory state).

### 8.3 MCP Tools (Spec-5)

- [ ] MCP server starts and exposes all 5 tools.
- [ ] `add_task` creates a task and returns `{task_id, status, title}`.
- [ ] `list_tasks` returns correct tasks filtered by status.
- [ ] `complete_task` toggles task completion and returns updated status.
- [ ] `delete_task` removes task and confirms deletion.
- [ ] `update_task` updates task fields and returns updated task.
- [ ] All tools return structured errors on failure — no unhandled exceptions.

### 8.4 AI Agent & Chat Endpoint (Spec-6)

- [ ] `POST /api/chat` requires valid JWT — returns 401 without token.
- [ ] New conversation created if `conversation_id` not provided.
- [ ] Existing conversation resumed correctly when `conversation_id` provided.
- [ ] Agent correctly invokes `add_task` for "add" intent messages.
- [ ] Agent correctly invokes `list_tasks` for "show/list" intent messages.
- [ ] Agent correctly invokes `complete_task`, `delete_task`, `update_task` for respective intents.
- [ ] User message and assistant response stored to DB after every turn.
- [ ] Response includes `{conversation_id, response, tool_calls}`.
- [ ] Server restart does not lose conversation history (loaded from DB).

### 8.5 Chat Frontend (Spec-7)

- [ ] `/chat` page is accessible only to authenticated users (redirects to sign-in otherwise).
- [ ] Chat UI displays conversation history on load.
- [ ] User can send a message and receive an AI response without page reload.
- [ ] Tool-call feedback shown (which tools the AI invoked and what it did).
- [ ] Chat UI is responsive: mobile (< 640px), tablet (640–1024px), desktop (> 1024px).
- [ ] `GEMINI_API_KEY` does not appear in browser network requests or JS bundles.
- [ ] 401 response from backend redirects user to sign-in page.

### 8.6 Out-of-Scope Check

- [ ] No Phase 4/5 Kubernetes, Kafka, or Dapr code included.
- [ ] No OpenAI SDK used anywhere.
- [ ] No `GEMINI_API_KEY` in frontend code or environment.
- [ ] MCP tools call `todo_service` layer — no direct ORM/SQL in tools.

---

## 9. Development Guidelines

### 9.1 Authoritative Source Mandate

Agents MUST prioritize MCP tools and CLI commands for all information gathering and task
execution. NEVER assume a solution from internal knowledge; verify externally. For Gemini
SDK usage, always check current `google-generativeai` SDK docs.

### 9.2 Execution Flow

Treat MCP servers as first-class tools. PREFER CLI interactions over manual file creation.
When implementing the agent, always verify the MCP server starts and tools respond correctly
before wiring the agent to call them.

### 9.3 Knowledge Capture (PHR) for Every User Input

After completing requests, you **MUST** create a PHR (Prompt History Record).

**PHR routing for Phase 3 features:**
- `constitution` → `history/prompts/constitution/`
- Spec-4 work → `history/prompts/004-conversation-persistence/`
- Spec-5 work → `history/prompts/005-mcp-task-server/`
- Spec-6 work → `history/prompts/006-ai-agent-chat-endpoint/`
- Spec-7 work → `history/prompts/007-chatkit-frontend/`
- `general` → `history/prompts/general/`

**PHR Creation Process:**
1. Detect stage: `constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general`
2. Generate title: 3–7 words; create slug for filename.
3. Read PHR template from `.specify/templates/phr-template.prompt.md`.
4. Allocate ID (increment from last in the feature folder; on collision, increment again).
5. Fill ALL placeholders (ID, TITLE, STAGE, DATE_ISO, SURFACE, MODEL, FEATURE, BRANCH,
   USER, COMMAND, LABELS, LINKS, FILES_YAML, TESTS_YAML, PROMPT_TEXT, RESPONSE_TEXT).
6. Write file and confirm absolute path.
7. Post-creation validations: no unresolved placeholders, title/stage/dates match.

### 9.4 Explicit ADR Suggestions

When significant architectural decisions are made, run the three-part test (Impact + Alternatives + Scope) and suggest:
> "Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"

Wait for user consent; never auto-create ADRs.

### 9.5 Human as Tool Strategy

Invoke the user for input when encountering:
1. **Ambiguous requirements:** Ask 2–3 targeted clarifying questions.
2. **Unforeseen dependencies:** Surface and ask for prioritization.
3. **Architectural uncertainty:** Present options with tradeoffs.
4. **Completion checkpoints:** Summarize and confirm next steps.

---

## 10. Default Policies

- Clarify and plan first. Keep business understanding separate from technical plan.
- Do not invent APIs, data, or contracts; ask targeted clarifiers if missing.
- Never hardcode secrets or tokens; use `.env` and docs.
- Prefer the smallest viable diff; do not refactor unrelated code.
- Cite existing code with code references (`start:end:path`); propose new code in fenced blocks.
- Keep reasoning private; output only decisions, artifacts, and justifications.
- Do NOT modify specs 001, 002, or 003 — they are frozen.

### 10.1 Execution Contract for Every Request

1. Confirm surface and success criteria (one sentence).
2. List constraints, invariants, non-goals.
3. Produce the artifact with acceptance checks inlined.
4. Add follow-ups and risks (max 3 bullets).
5. Create PHR in appropriate subdirectory under `history/prompts/`.
6. Surface ADR suggestion if decisions meet significance threshold.

### 10.2 Minimum Acceptance Criteria

- Clear, testable acceptance criteria included.
- Explicit error paths and constraints stated.
- Smallest viable change; no unrelated edits.
- Code references to modified/inspected files where relevant.

---

## 11. Code Standards

See `.specify/memory/constitution.md` for code quality, testing, performance, security, and
architecture principles (v2.0.0).

### 11.1 Phase 2 Standards (Inherited)

- **Python (Backend/DB):** Python 3.11+, type hints on all functions, FastAPI dependency injection.
- **TypeScript (Frontend):** Strict mode, no `any` types without justification.
- **Testing:** Each feature must have at least one happy-path and one error-path test.
- **Security:** OWASP Top 10 awareness; no SQL injection, XSS, or insecure token handling.

### 11.2 Phase 3 Specific Standards

- **MCP Tools:** Each tool function MUST have a type-annotated signature and docstring.
  Tool errors MUST be returned as structured responses — never raise bare exceptions.
- **Agent Service:** Agent orchestration MUST be in its own service module (`agent_service.py`).
  No Gemini SDK imports in route handlers — all AI logic lives in the service layer.
- **Gemini SDK:** Use `google-generativeai` Python SDK. Model configured via `settings.GEMINI_MODEL`.
  System prompt defined as a constant in `agent_service.py`.
- **Vercel AI SDK:** Frontend uses `useChat` from `ai/react`. The custom `fetch` handler in
  `useChat` config attaches the JWT from Better Auth session to every chat request.
- **Conversation service:** All conversation + message DB operations go through
  `conversation_service.py`. No direct SQLModel session calls in route handlers.
- **No OpenAI:** Zero imports from `openai` package anywhere in the codebase.

## Active Technologies
- Python 3.11+ + SQLModel 0.0.21+, FastAPI (session DI reused), psycopg2/asyncpg via Neon (004-conversation-persistence)
- Neon Serverless PostgreSQL — same connection engine and `get_session()` from `src/backend/app/db.py` (004-conversation-persistence)
- `mcp>=1.0.0,<2.0.0` — Official Python MCP SDK, stdio transport, Server/Tool/TextContent (005-mcp-task-server)
- `google-genai>=1.0.0,<2.0.0` — New Google Gemini SDK. Use `import google.genai as genai`. NOT `google-generativeai` (deprecated). (005-mcp-task-server, 006-ai-agent-chat-endpoint)

## Recent Changes
- 004-conversation-persistence: Added Conversation + Message SQLModel models, conversation_service.py (5 functions), 14 tests
- 005-mcp-task-server: Added src/mcp/ package (server.py + tools/task_tools.py), 14 unit tests, mcp + google-genai packages
