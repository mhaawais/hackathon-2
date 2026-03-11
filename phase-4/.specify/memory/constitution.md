<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0
- Rationale for MAJOR bump: Phase 3 introduces fundamentally new scope (AI Chatbot, MCP Server,
  Gemini API, Vercel AI SDK, Conversation Persistence). Phase 2's scope lock is lifted and replaced
  with Phase 3's scope lock. Multiple new principles added; Phase 2's hard guardrail against
  chatbot/AI work is inverted — it is now the primary objective.
- Modified principles:
  - VI. Stateless Backend → expanded to explicitly cover AI agent statelessness
  - X. Frontend Standards → expanded with Vercel AI SDK and chat UI requirements
- Added principles:
  - XI. AI Agent Architecture
  - XII. MCP Tool Design
  - XIII. Conversation Persistence
  - XIV. AI Provider Abstraction (Gemini via Vercel AI SDK)
- Added sections:
  - Phase 3 Technology Constraints (MCP SDK, Gemini, Vercel AI SDK)
  - Phase 3 Agent Roster (AI Agent Specialist, MCP Server Specialist)
  - Phase 3 Success Criteria (chat, MCP tools, conversation persistence)
- Removed sections: none (all Phase 2 principles retained — Phase 3 builds on top)
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no structural conflicts
  - .specify/templates/spec-template.md ✅ no structural conflicts
  - .specify/templates/tasks-template.md ✅ no structural conflicts
- Follow-up TODOs: none — all placeholders resolved
-->

# Hackathon II — Phase 3 AI Chatbot Constitution

## Core Principles

### I. Zero Trust Backend

Backend MUST never trust frontend-provided `user_id`. All user identity MUST be derived
exclusively from a verified JWT. Every protected endpoint MUST require a valid JWT in the
`Authorization: Bearer <token>` header. This applies equally to the new chat endpoint.

### II. Strict User Isolation

Every task and every conversation MUST belong to exactly one user. No user may access,
modify, or delete another user's tasks or conversation history. Ownership MUST be enforced
at the database query level — never in application-layer post-filtering alone.

### III. Spec-Driven Development

No manual coding outside approved specifications. All features MUST be defined in Markdown
specs before implementation. Each spec MUST include: Purpose, Constraints, Expected
behavior, Error cases, and Acceptance criteria. The workflow is:
Spec → Plan → Tasks → Implement → Verify.

### IV. Separation of Concerns

- Frontend handles UI, auth session, and chat interface.
- Backend handles data persistence, authorization, agent orchestration, and MCP tool dispatch.
- MCP Server handles the tool interface between the AI agent and task data.
- Database handles integrity, conversation history, and constraints.
- No business logic leakage across layers. No direct DB access from frontend or MCP server
  (MCP tools call the service layer, not the ORM directly).

### V. Deterministic API Contracts

All endpoints MUST have defined request/response schemas. All error responses MUST be
explicit and documented. Status codes MUST follow REST standards. API contracts MUST be
finalized before frontend integration begins. The chat endpoint contract (request/response
shape, tool_calls format) MUST be specified before agent or frontend work begins.

### VI. Stateless Backend & Stateless Agent

Backend MUST NOT rely on in-memory session state. All authentication MUST be JWT-based.
All task state MUST persist in the database. The AI agent MUST be stateless per-request:
it receives conversation history from the DB on each request, runs, and stores its response
back to the DB. The server holds NO conversation state in memory between requests. This
enables horizontal scaling and resilience across server restarts.

### VII. Production-Ready Standards

Environment variables MUST be used for all secrets and configuration. `BETTER_AUTH_SECRET`
MUST be shared between frontend and backend. `DATABASE_URL` controls Neon Postgres
connection. `GEMINI_API_KEY` MUST be stored in `.env` only — never hardcoded or committed.
All code MUST be modular and scalable. `.env.example` committed; `.env` gitignored.

### VIII. Security Standards

JWT signature MUST be verified on every protected request. Expired tokens MUST be rejected
with 401. Missing `Authorization` header MUST return 401. Malformed tokens MUST return 401.
Unauthorized resource access (wrong user) MUST return 403/404 per spec. Passwords MUST be
stored hashed (bcrypt/argon2); never plaintext. `GEMINI_API_KEY` MUST never appear in
frontend code or client-side bundles — only used server-side in the FastAPI backend.

### IX. Database Standards

Use SQLModel ORM for all database operations. Use UUID or integer primary keys as defined
per model. Include `created_at` and `updated_at` timestamps on all records. Enforce NOT NULL
constraints where appropriate. Add indexes on `user_id` and `conversation_id` for query
performance. Foreign key constraints MUST link: todos → users, messages → conversations,
conversations → users.

### X. Frontend Standards

MUST use Next.js App Router. MUST use Better Auth for signup and login flows. MUST send
`Authorization: Bearer <token>` header for all protected API calls. UI MUST be responsive
(mobile < 640px, tablet 640–1024px, desktop > 1024px). Chat UI MUST use Vercel AI SDK
`useChat` hook for streaming-ready integration. No direct DB access from frontend. No
Gemini API key exposed to frontend — all AI calls go through the FastAPI backend.

### XI. AI Agent Architecture

The AI agent MUST be implemented using the Vercel AI SDK (backend tool-calling mode) or
Google Generative AI Python SDK on the FastAPI backend. The agent MUST:
- Receive conversation history (fetched from DB) on every request.
- Use Gemini as the LLM provider (model: `gemini-1.5-flash` or `gemini-2.0-flash`).
- Invoke MCP tools for ALL task operations — the agent MUST NOT implement task logic itself.
- Store the user message and assistant response to DB after every turn.
- Return a structured response: `{conversation_id, response, tool_calls}`.
The agent is a pure function of (history + new message + tools) → response. No side effects
beyond DB writes via the conversation service.

### XII. MCP Tool Design

The MCP server MUST be implemented using the Official Python MCP SDK. It MUST expose
exactly 5 tools corresponding to the 5 core task operations:
`add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`.
Each tool MUST:
- Accept `user_id` as a required parameter (derived from JWT in the chat endpoint, passed down).
- Call the existing task service layer — NO duplicate business logic in MCP tools.
- Return structured, typed responses matching the tool output schema.
- Handle errors gracefully and return error information in the tool response (not raise exceptions
  that crash the agent).
MCP tools are the ONLY interface the AI agent uses to interact with task data.

### XIII. Conversation Persistence

All conversation state MUST persist in the Neon PostgreSQL database. The system MUST:
- Store each conversation as a `Conversation` record linked to a `user_id`.
- Store each message as a `Message` record with `role` (user/assistant), `content`,
  `conversation_id`, and `created_at`.
- Fetch the full message history for a conversation before each agent run.
- Support resuming any previous conversation by `conversation_id`.
- Create a new conversation automatically if no `conversation_id` is provided.
No conversation state MUST exist in server memory — only in the database.

### XIV. AI Provider Abstraction (Gemini)

The AI provider is Google Gemini (`gemini-1.5-flash` recommended for free tier).
The integration MUST use either:
- `google-generativeai` Python SDK (server-side, FastAPI), OR
- Vercel AI SDK with `@ai-sdk/google` (if streaming from Next.js API routes).
Provider choice MUST be configurable via environment variable (`GEMINI_MODEL`).
The system MUST NOT be tightly coupled to any single Gemini model version — use the
model name from env so it can be swapped without code changes.

## Technology Constraints

### Phase 2 Stack (Inherited — All Still Required)

| Component    | Technology                  | Required |
| ------------ | --------------------------- | -------- |
| Frontend     | Next.js 16+ (App Router)    | Yes      |
| Backend      | FastAPI (Python 3.11+)      | Yes      |
| ORM          | SQLModel                    | Yes      |
| Database     | Neon Serverless PostgreSQL  | Yes      |
| Auth         | Better Auth + JWT           | Yes      |
| CSS          | Tailwind CSS (preferred)    | Yes      |

### Phase 3 Stack (New — All Required)

| Component       | Technology                          | Required |
| --------------- | ----------------------------------- | -------- |
| AI Provider     | Google Gemini (gemini-1.5-flash)    | Yes      |
| AI SDK (BE)     | google-generativeai Python SDK      | Yes      |
| AI SDK (FE)     | Vercel AI SDK (@ai-sdk/google)      | Yes      |
| MCP Server      | Official Python MCP SDK             | Yes      |
| Chat UI         | Vercel AI SDK useChat hook          | Yes      |
| New DB Models   | Conversation, Message (SQLModel)    | Yes      |

Additional constraints:
- MUST follow hackathon spec for Phase 3 exactly.
- MUST maintain monorepo structure (`phase-3/` root).
- MUST maintain CLAUDE.md layering.
- No K8s, no Kafka, no Dapr (Phase 4/5 scope).
- No OpenAI SDK — Gemini only.
- No bypassing JWT verification on chat endpoint.
- MCP server MUST call task service layer, not ORM directly.
- `GEMINI_API_KEY` server-side only — never in frontend bundle.

## Agent Roster

| Agent ID                | Domain                                         |
| ----------------------- | ---------------------------------------------- |
| `auth-security`         | JWT, Better Auth, session (Phase 2 — retained) |
| `neon-db-specialist`    | Schema, models, migrations (Phase 2 + new models) |
| `fastapi-backend`       | API routes, validation, service layer          |
| `nextjs-frontend`       | Next.js pages, components, chat UI             |
| `mcp-server-specialist` | MCP server, tool definitions, tool execution   |
| `ai-agent-specialist`   | Gemini agent, chat endpoint, conversation flow |

## Success Criteria

### Phase 2 (Retained)

1. Multi-user system works correctly — users register, login, manage their own tasks.
2. JWT verification enforced on all protected endpoints.
3. Complete user isolation — no cross-user data access.
4. All 5 core todo operations functional: Add, List, Update, Delete, Complete.
5. Data persists in Neon PostgreSQL across server restarts.
6. Frontend is responsive across mobile, tablet, and desktop breakpoints.

### Phase 3 (New)

7. Natural language chat interface works for all 5 task operations via MCP tools.
8. AI agent (Gemini) correctly invokes MCP tools in response to user messages.
9. Conversation history persists in the DB and is correctly loaded on each agent run.
10. Stateless chat endpoint — server restart does not lose conversation context.
11. New conversation created automatically when no `conversation_id` is provided.
12. Existing conversation correctly resumed when `conversation_id` is provided.
13. Chat UI is responsive and usable on mobile, tablet, and desktop.
14. `GEMINI_API_KEY` never appears in client-side code or browser network requests.
15. MCP tools produce correct task outcomes verified against the database.
16. All 4 new specs (004–007) pass their acceptance criteria.

## Governance

- This constitution supersedes the Phase 2 constitution for all Phase 3 work.
- Phase 2 principles are fully retained as the foundation Phase 3 builds upon.
- Amendments require documentation, version bump, and propagation to dependent templates.
- All PRs and reviews MUST verify compliance with all 14 principles.
- Complexity MUST be justified; default to the smallest viable diff.
- New specs begin at 004 — specs 001–003 are locked and must not be modified.
- See `CLAUDE.md` for runtime development guidance and agent coordination rules.

**Version**: 2.0.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-27
