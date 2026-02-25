# Claude Code Rules — Hackathon II, Phase 2: Full-Stack Web Todo App

> **Scope lock:** This file governs **Phase 2 ONLY**.
> Phase 1 (CLI todo), Phase 3+ (chatbot, K8s, event-driven) are **out of scope**.
> Any work outside Phase 2 boundaries MUST be refused.

---

## 1. Project Overview

| Dimension        | Value                                              |
| ---------------- | -------------------------------------------------- |
| **Project**      | Full-Stack Web Todo App                            |
| **Phase**        | 2 of Hackathon II                                  |
| **Frontend**     | Next.js (App Router)                               |
| **Backend**      | FastAPI (Python)                                    |
| **Database**     | PostgreSQL on Neon, via SQLModel ORM                |
| **Auth**         | Better Auth + JWT (shared secret between FE & BE)  |
| **Core features**| Add, List, Update, Delete, Complete tasks           |

### 1.1 Non-Goals (Hard Guardrails)

- No CLI todo app work (Phase 1)
- No chatbot, Kubernetes, or event-driven features (Phase 3+)
- No features beyond the 5 core todo operations
- No additional auth providers (OAuth, SSO) unless explicitly requested
- No deployment/CI/CD pipeline work unless explicitly requested

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

---

## 3. Agent Responsibilities & Coordination

### 3.1 Auth Agent (`auth-security`)

**Owns:** Authentication and authorization across the full stack.

| Responsibility                        | Details                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| User sign up                          | Registration endpoint, input validation, duplicate checks  |
| User sign in                          | Login endpoint, credential verification                    |
| Password hashing                      | bcrypt or argon2; never store plaintext                    |
| JWT issuance                          | Issue JWT on successful login with configurable expiry     |
| JWT verification                      | Verify on all protected FastAPI routes via shared secret   |
| Token rejection                       | Reject invalid, expired, or malformed tokens with 401      |
| Better Auth integration               | Configure Better Auth for frontend auth flows              |
| Auth middleware                        | FastAPI dependency that extracts & validates JWT            |
| Auth tests                            | Unit + integration tests for all auth flows                |

### 3.2 Frontend Agent (`nextjs-frontend`)

**Owns:** All Next.js UI, pages, components, and frontend API integration.

| Responsibility                        | Details                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| Pages & layouts                       | App Router pages: login, signup, dashboard/todo list       |
| Components                            | Todo item, todo form, todo list, auth forms, navbar        |
| Styling                               | Tailwind CSS (or project-chosen CSS); clean, consistent    |
| Responsive design                     | Mobile-first; must work on mobile, tablet, desktop         |
| Frontend API integration              | Fetch/axios calls to FastAPI backend with JWT in headers   |
| Auth UI flows                         | Login, signup, logout; token storage; redirect on 401      |
| Better Auth client                    | Client-side Better Auth configuration                      |
| Responsiveness testing                | Document breakpoint tests (mobile/tablet/desktop)          |

### 3.3 Database Agent (`neon-db-specialist`)

**Owns:** Schema design, models, migrations, and Neon configuration.

| Responsibility                        | Details                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| Schema design                         | Users table, Todos table, relationships, constraints       |
| SQLModel models                       | Python model classes with proper types and validators      |
| Tables & migrations                   | Create/alter tables; migration scripts if needed           |
| Indexes                               | Index on `user_id`, `created_at`, or other query patterns  |
| Neon setup                            | Connection string, pooling config, environment variables   |
| DB smoke tests                        | Verify connectivity, CRUD operations, constraint enforcement|

### 3.4 Backend Agent (`fastapi-backend`)

**Owns:** API routes, validation, service logic, and backend integration.

| Responsibility                        | Details                                                    |
| ------------------------------------- | ---------------------------------------------------------- |
| FastAPI routes                        | CRUD endpoints for todos; auth endpoints (signup/signin)   |
| Request/response models               | Pydantic models for all request bodies and responses       |
| Validation                            | Input validation, error responses with proper status codes |
| Service layer                         | Business logic between routes and DB                       |
| DB integration                        | SQLModel session management, queries                       |
| Auth guards                           | Apply JWT verification dependency on all todo routes       |
| Error handling                        | Consistent error format; 400/401/403/404/422/500 taxonomy  |
| Backend tests                         | Unit + integration tests for all endpoints                 |

### 3.5 Agent Coordination Rules

1. **Auth Agent runs first** for any auth-related work (signup, signin, JWT middleware).
2. **DB Agent runs before Backend Agent** — models and tables must exist before routes use them.
3. **Backend Agent runs before Frontend Agent** — API contracts must be defined before the UI integrates.
4. **No agent works outside its domain.** If a task crosses boundaries, split it and assign each part to the correct agent.
5. **Shared contracts:** API request/response schemas and JWT secret configuration are shared touchpoints. Changes to these require updating all affected agents' work.

---

## 4. Authentication Requirements (Detailed)

These are **non-negotiable** and must all be satisfied:

- [ ] **User sign up:** New user registration with email + password; duplicate email rejected.
- [ ] **User sign in:** Login with email + password; returns JWT on success.
- [ ] **Secure password hashing:** Passwords stored hashed (bcrypt/argon2); never plaintext or reversible.
- [ ] **JWT issued on login:** Token contains user ID, email, expiration; signed with shared secret.
- [ ] **JWT verified on all protected routes:** Every todo endpoint requires valid JWT in `Authorization: Bearer <token>` header.
- [ ] **Invalid/expired tokens rejected:** Returns 401 Unauthorized with clear error message.
- [ ] **End-to-end auth flow:** Frontend sends credentials → Backend verifies → Issues JWT → Frontend stores token → Frontend sends token on subsequent requests → Backend validates → Grants or denies access.
- [ ] **Shared secret management:** JWT secret stored in `.env`; never hardcoded. Both frontend (for Better Auth) and backend (for FastAPI) reference the same secret.

---

## 5. Core Todo Features (Exactly 5)

| # | Feature       | Description                                                  |
|---|---------------|--------------------------------------------------------------|
| 1 | **Add**       | Create a new todo with title (required) and optional description. Assigned to authenticated user. |
| 2 | **List**      | Retrieve all todos for the authenticated user. Support optional filters (completed/pending). |
| 3 | **Update**    | Edit title and/or description of an existing todo. User can only update their own todos. |
| 4 | **Delete**    | Remove a todo by ID. User can only delete their own todos.   |
| 5 | **Complete**  | Mark a todo as completed (toggle or one-way). User can only complete their own todos. |

**Guardrail:** No features beyond these 5 (no tags, no sharing, no priorities, no due dates) unless explicitly requested.

---

## 6. Repository Structure

```
phase-2/
├── CLAUDE.md                          # This file (project rules)
├── .env.example                       # Environment variable template
├── .specify/
│   └── memory/
│       └── constitution.md            # Project principles
├── specs/
│   └── <feature>/
│       ├── spec.md                    # Feature requirements
│       ├── plan.md                    # Architecture decisions
│       ├── tasks.md                   # Testable task breakdown
│       ├── checklists/               # Feature checklists
│       └── contracts/                # API contracts
├── src/
│   ├── frontend/                      # Next.js app
│   │   ├── app/                       # App Router pages & layouts
│   │   ├── components/                # Reusable UI components
│   │   ├── lib/                       # Utils, API client, auth helpers
│   │   └── ...
│   ├── backend/                       # FastAPI app
│   │   ├── app/
│   │   │   ├── main.py               # FastAPI app entry point
│   │   │   ├── routes/               # API route modules
│   │   │   ├── models/               # SQLModel / Pydantic models
│   │   │   ├── services/             # Business logic
│   │   │   ├── auth/                 # JWT utilities, middleware
│   │   │   └── config.py             # Settings & env loading
│   │   └── ...
│   └── db/                            # Database layer
│       ├── models.py                  # SQLModel table definitions
│       ├── migrations/                # Schema migration scripts
│       └── connection.py              # Neon connection setup
├── tests/
│   ├── frontend/                      # Frontend tests
│   ├── backend/                       # Backend API tests
│   ├── db/                            # Database smoke tests
│   └── auth/                          # Auth flow tests
├── history/
│   ├── prompts/                       # Prompt History Records
│   │   ├── constitution/
│   │   ├── general/
│   │   └── <feature-name>/
│   └── adr/                           # Architecture Decision Records
└── .specify/                          # SpecKit Plus templates & scripts
```

---

## 7. Environment & Secrets

| Variable              | Purpose                          | Required |
| --------------------- | -------------------------------- | -------- |
| `DATABASE_URL`        | Neon PostgreSQL connection string | Yes      |
| `JWT_SECRET`          | Shared secret for JWT sign/verify| Yes      |
| `BETTER_AUTH_SECRET`  | Better Auth secret key           | Yes      |
| `BACKEND_URL`         | FastAPI base URL for frontend    | Yes      |
| `NEXT_PUBLIC_API_URL` | Public API URL for client-side   | Yes      |

**Rules:**
- Never hardcode secrets. Always use `.env` (gitignored) and `.env.example` (committed, no real values).
- All agents must reference environment variables, never literal secret values.

---

## 8. Verification & Acceptance Criteria

### 8.1 Feature Completeness

- [ ] **Add todo:** Authenticated user can create a todo; persisted in DB; visible in list.
- [ ] **List todos:** Authenticated user sees only their own todos; empty state handled.
- [ ] **Update todo:** Authenticated user can edit title/description; changes persisted.
- [ ] **Delete todo:** Authenticated user can remove a todo; confirmed removed from DB.
- [ ] **Complete todo:** Authenticated user can mark todo complete; status persisted.

### 8.2 Auth Completeness

- [ ] Sign up creates user with hashed password in DB.
- [ ] Sign in with valid credentials returns JWT.
- [ ] Sign in with invalid credentials returns 401.
- [ ] All todo endpoints reject requests without JWT (401).
- [ ] All todo endpoints reject requests with expired/invalid JWT (401).
- [ ] Users cannot access/modify other users' todos (403 or filtered).

### 8.3 Database Persistence

- [ ] Todos survive server restart (persisted in Neon PostgreSQL).
- [ ] User records persist with hashed passwords.
- [ ] Foreign key constraints enforced (todos belong to users).

### 8.4 Frontend Responsiveness

- [ ] Mobile (< 640px): single-column layout, touch-friendly controls.
- [ ] Tablet (640px–1024px): appropriate layout adjustments.
- [ ] Desktop (> 1024px): full layout with comfortable spacing.
- [ ] Breakpoint testing documented in test results or screenshots.

### 8.5 Out-of-Scope Check

- [ ] No Phase 1 CLI code included.
- [ ] No Phase 3+ chatbot/K8s/event-driven code included.
- [ ] No features beyond the 5 core todo operations.
- [ ] No extra auth providers unless explicitly requested.

---

## 9. Development Guidelines (Inherited & Extended)

### 9.1 Authoritative Source Mandate
Agents MUST prioritize MCP tools and CLI commands for all information gathering and task execution. NEVER assume a solution from internal knowledge; verify externally.

### 9.2 Execution Flow
Treat MCP servers as first-class tools. PREFER CLI interactions over manual file creation or reliance on internal knowledge.

### 9.3 Knowledge Capture (PHR) for Every User Input
After completing requests, you **MUST** create a PHR (Prompt History Record).

**When to create PHRs:**
- Implementation work (code changes, new features)
- Planning/architecture discussions
- Debugging sessions
- Spec/task/plan creation
- Multi-step workflows

**PHR Creation Process:**

1. Detect stage: `constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general`
2. Generate title: 3-7 words; create slug for filename.
3. Resolve route (all under `history/prompts/`):
   - `constitution` -> `history/prompts/constitution/`
   - Feature stages -> `history/prompts/<feature-name>/`
   - `general` -> `history/prompts/general/`
4. Read PHR template from `.specify/templates/phr-template.prompt.md` or `templates/phr-template.prompt.md`.
5. Allocate ID (increment; on collision, increment again).
6. Fill ALL placeholders (ID, TITLE, STAGE, DATE_ISO, SURFACE, MODEL, FEATURE, BRANCH, USER, COMMAND, LABELS, LINKS, FILES_YAML, TESTS_YAML, PROMPT_TEXT, RESPONSE_TEXT).
7. Write file and confirm absolute path.
8. Post-creation validations: no unresolved placeholders, title/stage/dates match, PROMPT_TEXT complete, file exists at expected path.

### 9.4 Explicit ADR Suggestions
When significant architectural decisions are made, run the three-part test (Impact + Alternatives + Scope) and suggest:
> "Architectural decision detected: <brief> -- Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"

Wait for user consent; never auto-create ADRs.

### 9.5 Human as Tool Strategy
Invoke the user for input when encountering:
1. **Ambiguous requirements:** Ask 2-3 targeted clarifying questions.
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

See `.specify/memory/constitution.md` for code quality, testing, performance, security, and architecture principles.

### 11.1 Phase 2 Specific Standards

- **Python (Backend/DB):** Python 3.11+, type hints on all functions, FastAPI dependency injection.
- **TypeScript (Frontend):** Strict mode, no `any` types without justification.
- **Testing:** Each feature must have at least one happy-path and one error-path test.
- **Security:** OWASP Top 10 awareness; no SQL injection, XSS, or insecure token handling.
