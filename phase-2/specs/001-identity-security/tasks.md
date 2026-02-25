# Tasks: Identity & Security Layer

**Branch**: `001-identity-security` | **Date**: 2026-02-17
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## FR Coverage Matrix

| FR | Description | Task(s) |
|----|-------------|---------|
| FR-001 | Email + password sign-up | T-301, T-302 |
| FR-002 | Unique email enforcement | T-301 |
| FR-003 | Password hashed (bcrypt) | T-301 (Better Auth default) |
| FR-004 | Email + password sign-in | T-401, T-402 |
| FR-005 | Generic error on bad credentials | T-401 |
| FR-006 | JWT issued on sign-in | T-201, T-403 |
| FR-007 | Backend verifies JWT every request | T-205, T-206 |
| FR-008 | 401 on invalid/expired/missing token | T-205, T-206, T-701 |
| FR-009 | User isolation — 403 on cross-user | T-504, T-505, T-601, T-602 |
| FR-010 | Stateless backend — no session store | T-205, T-206 |
| FR-011 | Shared secret between FE & BE | T-101, T-201, T-204 |
| FR-012 | Todo CRUD (5 endpoints) | T-505 |

---

## Phase 1: Project Scaffolding & Environment

> **Goal**: Repository structure, dependencies, and env config ready.
> **Test checkpoint**: All directories exist; `pip install -r requirements.txt` succeeds; `npm install` succeeds.

- [x] **T-101** Create `.env.example` at `phase-2/.env.example`
  - Variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BACKEND_URL`, `NEXT_PUBLIC_API_URL`
  - Placeholder values only — no real secrets
  - **Verify**: File exists with all 4 variables

- [x] **T-102** Initialize Next.js project in `phase-2/src/frontend/`
  - App Router, TypeScript, Tailwind CSS
  - `package.json` includes: `better-auth`, `next`, `react`, `tailwindcss`
  - **Verify**: `npm install` completes; `npm run build` succeeds (empty app)

- [x] **T-103** Create `requirements.txt` at `phase-2/src/backend/requirements.txt`
  - Dependencies: `fastapi`, `uvicorn[standard]`, `sqlmodel`, `pyjwt`, `psycopg2-binary`, `python-dotenv`, `httpx`
  - Pin major versions
  - **Verify**: `pip install -r requirements.txt` succeeds in clean venv

- [x] **T-104** [P] Create directory structure with `__init__.py` files
  - Directories:
    - `phase-2/src/backend/app/`
    - `phase-2/src/backend/app/auth/`
    - `phase-2/src/backend/app/models/`
    - `phase-2/src/backend/app/routes/`
    - `phase-2/src/backend/app/services/`
    - `phase-2/src/backend/tests/`
    - `phase-2/src/db/`
  - Each `app/` subdirectory gets an `__init__.py`
  - **Verify**: `python -c "import app"` does not error from `src/backend/`

---

## Phase 2: Foundational — Auth & DB Infrastructure

> **Goal**: Better Auth configured on frontend; JWT verification on backend; DB connection established.
> **Test checkpoint**: Better Auth catch-all responds; JWT decode works with test token; DB engine connects.
> **Dependencies**: Phase 1 complete.

- [x] **T-201** [US1] Configure Better Auth server — `phase-2/src/frontend/lib/auth.ts`
  - `betterAuth()` with `emailAndPassword` plugin enabled
  - `database` pointing to `DATABASE_URL` (Neon PostgreSQL)
  - `cookieCache` with `strategy: "jwt"`
  - Export `auth` instance
  - **Verify**: Module imports without error

- [x] **T-202** [US1] Configure Better Auth client — `phase-2/src/frontend/lib/auth-client.ts`
  - `createAuthClient()` with `emailAndPassword` plugin
  - Export `authClient`
  - **Verify**: Module imports without error

- [x] **T-203** [US1] Create catch-all route handler — `phase-2/src/frontend/app/api/auth/[...all]/route.ts`
  - Import `auth` from `lib/auth`
  - Export GET and POST handlers via `toNextJsHandler()`
  - **Verify**: `GET /api/auth/ok` returns 200 (Better Auth health)

- [x] **T-204** [US2] Backend config/settings — `phase-2/src/backend/app/config.py`
  - Load from `.env`: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `FRONTEND_URL` (for CORS)
  - Raise on missing required vars
  - **Verify**: `from app.config import settings` works with `.env` present

- [x] **T-205** [US2] JWT verification — `phase-2/src/backend/app/auth/jwt_bearer.py`
  - Decode HS256 JWT using `BETTER_AUTH_SECRET`
  - Extract `sub` (user_id) from payload
  - Raise `HTTPException(401)` on invalid/expired/malformed token
  - **Verify**: Unit test — valid token returns user_id; expired token raises 401

- [x] **T-206** [US2] `get_current_user()` dependency — `phase-2/src/backend/app/auth/dependencies.py`
  - FastAPI `Depends()` that extracts Bearer token from `Authorization` header
  - Calls `verify_token()` from jwt_bearer
  - Returns user_id string
  - **Verify**: Unit test — dependency extracts user_id from valid request

- [x] **T-207** [P] Database connection — `phase-2/src/db/connection.py`
  - SQLModel `create_engine()` with `DATABASE_URL`
  - `get_session()` generator for FastAPI dependency injection
  - **Verify**: Engine created without error; session yields

- [x] **T-208** [US3] Todo SQLModel model — `phase-2/src/backend/app/models/todo.py`
  - Fields: `id` (UUID, PK), `title` (str, required), `description` (str, optional), `status` (str, default "pending"), `user_id` (str, FK to user.id, indexed), `created_at`, `updated_at`
  - Index on `user_id`
  - **Verify**: `Todo.model_json_schema()` matches data-model.md

---

## Phase 3: US1 — New User Registration

> **Goal**: Users can sign up via the frontend UI; account persisted in DB.
> **Test checkpoint**: Navigate to `/sign-up`, submit form, user row created in DB.
> **Dependencies**: Phase 2 tasks T-201, T-202, T-203 complete.

- [x] **T-301** [US1] Sign-up form component — `phase-2/src/frontend/components/auth/sign-up-form.tsx`
  - Fields: name, email, password
  - Calls `authClient.signUp.email()`
  - Shows validation errors (duplicate email, weak password)
  - On success: redirect to `/dashboard`
  - **Verify**: Component renders; form submits without JS errors

- [x] **T-302** [US1] Sign-up page — `phase-2/src/frontend/app/(auth)/sign-up/page.tsx`
  - Renders `<SignUpForm />`
  - Link to sign-in page
  - Responsive layout (mobile-first)
  - **Verify**: Page loads at `/sign-up`; form visible

- [x] **T-303** [US1] Run Better Auth migrations
  - Execute `npx @better-auth/cli migrate` against Neon DB
  - Creates `user`, `session`, `account`, `verification` tables
  - **Verify**: Tables exist in database; `SELECT * FROM "user"` returns empty result

---

## Phase 4: US2 — User Sign In & Token Issuance

> **Goal**: Users can sign in; JWT token available for API calls.
> **Test checkpoint**: Sign in with valid credentials; session contains JWT; API client sends Bearer header.
> **Dependencies**: Phase 3 complete.

- [x] **T-401** [US2] Sign-in form component — `phase-2/src/frontend/components/auth/sign-in-form.tsx`
  - Fields: email, password
  - Calls `authClient.signIn.email()`
  - Shows generic error on invalid credentials (FR-005)
  - On success: redirect to `/dashboard`
  - **Verify**: Component renders; form submits

- [x] **T-402** [US2] Sign-in page — `phase-2/src/frontend/app/(auth)/sign-in/page.tsx`
  - Renders `<SignInForm />`
  - Link to sign-up page
  - Responsive layout
  - **Verify**: Page loads at `/sign-in`

- [x] **T-403** [US2] API client with Bearer token — `phase-2/src/frontend/lib/api.ts`
  - Fetch wrapper that reads JWT from Better Auth session cookie
  - Attaches `Authorization: Bearer <token>` header to all requests
  - Base URL from `NEXT_PUBLIC_API_URL`
  - Handles 401 → redirect to `/sign-in`
  - **Verify**: `api.get("/health")` sends correct headers

---

## Phase 5: US3 — Protected Resource Access (Todo CRUD)

> **Goal**: Authenticated users can create, read, update, complete, and delete todos via protected API.
> **Test checkpoint**: All 5 CRUD operations work end-to-end; unauthenticated requests get 401.
> **Dependencies**: Phase 2 tasks T-204–T-208 complete; Phase 4 complete.

- [x] **T-501** [US3] [P] Pydantic request/response schemas — `phase-2/src/backend/app/models/schemas.py`
  - `TodoCreate`: title (str, required), description (str | None)
  - `TodoUpdate`: title (str | None), description (str | None)
  - `TodoResponse`: all fields from Todo model
  - **Verify**: Schemas validate sample data correctly

- [x] **T-502** [US3] FastAPI app entry with CORS — `phase-2/src/backend/app/main.py`
  - Create FastAPI app
  - CORS middleware: allow origin `http://localhost:3000`, methods, headers (Authorization, Content-Type), credentials
  - Include routers: health, todos
  - **Verify**: `uvicorn app.main:app` starts without error

- [x] **T-503** [US3] [P] Health endpoint — `phase-2/src/backend/app/routes/health.py`
  - `GET /api/health` → `{"status": "ok"}`
  - No auth required
  - **Verify**: `curl http://localhost:8000/api/health` returns 200

- [x] **T-504** [US3] Todo service with ownership enforcement — `phase-2/src/backend/app/services/todo_service.py`
  - `create_todo(session, user_id, data)` → sets user_id automatically
  - `list_todos(session, user_id, status_filter)` → filters by user_id
  - `get_todo(session, todo_id, user_id)` → 404 if not found, 403 if wrong user
  - `update_todo(session, todo_id, user_id, data)` → ownership check
  - `complete_todo(session, todo_id, user_id)` → ownership check
  - `delete_todo(session, todo_id, user_id)` → ownership check
  - **Verify**: Unit test — service returns 403 when user_id doesn't match

- [x] **T-505** [US3] Todo CRUD routes — `phase-2/src/backend/app/routes/todos.py`
  - `POST /api/todos` → 201 (FR-012)
  - `GET /api/todos` → 200, optional `?status=` filter (FR-006, FR-007)
  - `PATCH /api/todos/{id}` → 200 (FR-007)
  - `PATCH /api/todos/{id}/complete` → 200 (FR-007)
  - `DELETE /api/todos/{id}` → 204 (FR-007)
  - All routes use `Depends(get_current_user)`
  - All routes delegate to `todo_service`
  - **Verify**: `pytest tests/test_todo_routes.py` — all 5 endpoints tested

- [x] **T-506** [US3] Database init script — `phase-2/src/db/init_db.py`
  - `SQLModel.metadata.create_all(engine)` for Todo table only
  - Do NOT touch Better Auth tables
  - **Verify**: Script runs; `todo` table created in DB

- [x] **T-507** [US3] Dashboard page — `phase-2/src/frontend/app/dashboard/page.tsx`
  - Fetch todos via `api.get("/todos")`
  - Display todo list (title, status, actions)
  - Add todo form (title, optional description)
  - Complete, edit, delete actions per todo
  - Empty state message when no todos
  - Responsive layout
  - **Verify**: Page loads; CRUD actions work when backend is running

---

## Phase 6: US4 — Cross-User Access Prevention

> **Goal**: Prove that users cannot access, modify, or delete other users' todos.
> **Test checkpoint**: All isolation tests pass; 403 returned on cross-user attempts.
> **Dependencies**: Phase 5 complete.

- [x] **T-601** [US4] Backend test for user isolation — `phase-2/src/backend/tests/test_user_isolation.py`
  - Create todo as User A
  - Attempt GET/PATCH/DELETE as User B → assert 403 or filtered out
  - List todos as User B → assert User A's todos not visible
  - **Verify**: `pytest tests/test_user_isolation.py` passes

- [x] **T-602** [US4] Verify 403 on cross-user access — `phase-2/tests/test_cross_user_isolation.py`
  - Integration test with two separate JWT tokens
  - Confirm `PATCH /api/todos/{id}` returns 403
  - Confirm `DELETE /api/todos/{id}` returns 403
  - Confirm `PATCH /api/todos/{id}/complete` returns 403
  - **Verify**: Test passes with real HTTP calls

---

## Phase 7: US5 — Verification & Polish

> **Goal**: JWT verification tests, route protection, and quickstart validation.
> **Test checkpoint**: All tests pass; quickstart guide works on clean setup.
> **Dependencies**: Phase 6 complete.

- [x] **T-701** [US5] JWT verification tests — `phase-2/src/backend/tests/test_jwt_verification.py`
  - Test valid token → user_id extracted
  - Test expired token → 401
  - Test malformed token → 401
  - Test missing Authorization header → 401
  - Test token with wrong secret → 401
  - **Verify**: `pytest tests/test_jwt_verification.py` — all 5 cases pass

- [x] **T-702** [US5] Route protection middleware — `phase-2/src/frontend/middleware.ts`
  - Check for Better Auth session on protected routes (`/dashboard`)
  - Redirect to `/sign-in` if no session
  - Allow access to `/sign-in`, `/sign-up`, `/` without session
  - **Verify**: Unauthenticated visit to `/dashboard` redirects to `/sign-in`

- [x] **T-703** [US5] Quickstart validation
  - Follow `specs/001-identity-security/quickstart.md` on clean environment
  - Verify all 5 steps work:
    1. Landing page loads
    2. Sign up succeeds
    3. Sign in succeeds
    4. Dashboard shows empty todo list
    5. Health endpoint returns OK
  - **Verify**: All quickstart steps pass end-to-end

---

## Parallel Execution Opportunities

Tasks marked with `[P]` can run in parallel with adjacent tasks:

| Parallel Group | Tasks | Rationale |
|---------------|-------|-----------|
| Phase 1 scaffolding | T-102, T-103, T-104 | Independent setup steps |
| Phase 2 infrastructure | T-201+T-202+T-203, T-204+T-205+T-206, T-207 | Frontend auth, backend auth, and DB are independent |
| Phase 5 backend | T-501, T-503 | Schemas and health endpoint are independent |

---

## Summary

| Phase | Tasks | User Story | Test Checkpoint |
|-------|-------|------------|-----------------|
| 1 | T-101 – T-104 (4) | Setup | Dependencies install |
| 2 | T-201 – T-208 (8) | Foundation | Auth + DB modules importable |
| 3 | T-301 – T-303 (3) | US1: Registration | Sign-up creates user |
| 4 | T-401 – T-403 (3) | US2: Sign-in | JWT available for API |
| 5 | T-501 – T-507 (7) | US3: Protected CRUD | All 5 endpoints work |
| 6 | T-601 – T-602 (2) | US4: Isolation | 403 on cross-user |
| 7 | T-701 – T-703 (3) | US5: Verification | All tests pass |
| **Total** | **30 tasks** | **5 user stories** | **7 checkpoints** |
