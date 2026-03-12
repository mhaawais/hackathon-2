# Tasks: API & Frontend Integration Layer

**Input**: Design documents from `specs/003-api-frontend-integration/`
**Branch**: `003-api-frontend-integration` | **Date**: 2026-02-19
**Prerequisites**: plan.md ✓ | spec.md ✓ | research.md ✓ | data-model.md ✓ | contracts/ ✓ | quickstart.md ✓

**Organization**: Tasks grouped by user story; implementation state noted per task.
Spec-1 (auth) and Spec-2 (persistence) are **complete** — their foundation is assumed available.

---

## Phase 1: Setup Verification

**Purpose**: Confirm the Spec-1/Spec-2 foundation is intact and the environment is ready before integration work begins.

- [x] T001 Verify `.env` contains all 5 required variables (`DATABASE_URL`, `JWT_SECRET`, `BETTER_AUTH_SECRET`, `BACKEND_URL`, `NEXT_PUBLIC_API_URL`) as documented in `specs/003-api-frontend-integration/quickstart.md`
- [x] T002 [P] Run backend smoke test — `cd src/backend && pytest tests/ -v` — confirm all 15 existing tests pass before any changes
- [x] T003 [P] Start backend and verify `GET /health` returns 200 — `uvicorn app.main:app --reload` from `src/backend/`

**Checkpoint**: Green baseline — all 15 existing tests pass and backend starts cleanly.

---

## Phase 2: Foundational Verification

**Purpose**: Confirm shared infrastructure (JWT dependency, service layer, DB connection) works end-to-end before per-story work.

⚠️ **CRITICAL**: No user story work should begin until this phase passes.

- [x] T004 Verify `get_current_user` FastAPI dependency in `src/backend/app/auth/dependencies.py` returns 401 when `Authorization` header is absent — confirm by reading the implementation and cross-checking with existing test assertions
- [x] T005 [P] Verify all 5 existing todo routes in `src/backend/app/routes/todos.py` declare `current_user: str = Depends(get_current_user)` — read the file and confirm each route handler includes the dependency
- [x] T006 [P] Verify `src/backend/app/services/todo_service.py` contains `get_todo_by_id(session, todo_id, user_id)` method — needed for T008 — confirm method signature exists

**Checkpoint**: Foundation verified — JWT guard is on all existing routes; service layer has the method needed for the GET-by-ID gap.

---

## Phase 3: User Story 1 — Authenticated Task CRUD via API (Priority: P1) 🎯 MVP

**Goal**: All 6 REST endpoints are implemented, tested, and callable with a valid JWT. The single true API gap (`GET /api/todos/{todo_id}`) is closed.

**Independent Test**: Using curl or the FastAPI `/docs` UI with a valid Bearer token, call all 6 endpoints in sequence: list → create → get-by-id → update → complete → delete. Verify correct status codes (200/201/204) and response shapes per `specs/003-api-frontend-integration/contracts/api-endpoints.md`.

### Implementation for User Story 1

- [x] T007 [US1] Add `GET /api/todos/{todo_id}` route to `src/backend/app/routes/todos.py` — place after the list route; use `todo_service.get_todo_by_id(session, todo_id, current_user)`, return `TodoResponse` on success, `HTTPException(404)` if `None` is returned; apply `Depends(get_current_user)` identical to sibling routes
- [x] T008 [US1] Add test `test_get_todo_by_id_success` to `tests/backend/test_todos.py` — create a todo, then GET it by ID with valid token, assert 200 and `response.json()["id"]` matches
- [x] T009 [P] [US1] Add test `test_get_todo_by_id_not_found` to `tests/backend/test_todos.py` — GET a random UUID that was never created, assert 404
- [x] T010 [US1] Run full backend test suite — `pytest tests/ -v` — confirm T008 and T009 pass and no regressions among the 15 existing tests (expected: 17+ passing)

**Checkpoint**: `GET /api/todos/{todo_id}` is live and tested. All 6 API endpoints now callable. Test count: 17+.

---

## Phase 4: User Story 2 — Protected Routes with Correct Error Responses (Priority: P1)

**Goal**: All todo endpoints enforce JWT auth and return predictable error codes — 401, 404, 422 — for every documented failure scenario.

**Independent Test**: Using curl, send (a) no token, (b) expired/tampered token, (c) valid token with non-UUID path param, (d) valid token with valid UUID not belonging to user, (e) valid token with whitespace-only title. Verify each returns the correct status code.

### Implementation for User Story 2

- [x] T011 [US2] Verify UUID path parameter validation in `src/backend/app/routes/todos.py` — check that `todo_id` is typed as `uuid.UUID` (not `str`) in all 4 single-item routes; if typed as `str`, change to `uuid.UUID` so FastAPI auto-returns 422 for invalid UUID format
- [x] T012 [P] [US2] Verify `TodoCreate` in `src/backend/app/models/schemas.py` rejects empty/whitespace-only titles — check for a `@field_validator` or `@validator` on `title`; if absent, add `@field_validator('title') def title_not_empty(cls, v): v = v.strip(); assert v, 'title cannot be empty or whitespace'; return v`
- [x] T013 [US2] Verify cross-user access returns 404 — read `src/backend/app/services/todo_service.py` to confirm `get_todo_by_id`, `update_todo`, `complete_todo`, and `delete_todo` all filter by `user_id` and return `None` (which maps to 404 at the route layer) rather than raising 403
- [x] T014 [US2] Add test `test_create_todo_empty_title` to `tests/backend/test_todos.py` — POST `{"title": "   "}` with valid token, assert 422
- [x] T015 [US2] Run full backend test suite — `pytest tests/ -v` — confirm T014 passes and no regressions (expected: 18+ passing)

**Checkpoint**: All protection scenarios verified. API returns 401/404/422 consistently. Test count: 18+.

---

## Phase 5: User Story 3 — Frontend Task Management UI (Priority: P1)

**Goal**: The dashboard provides a fully functional, responsive UI for all 5 todo operations (add, list, edit, delete, complete) visible and working at mobile/tablet/desktop sizes.

**Independent Test**: Open `http://localhost:3000/dashboard` in a browser (signed in). Add a task, edit it, mark complete, then delete it. Resize to 375px width (mobile) and verify all controls are visible and usable.

### Implementation for User Story 3

- [x] T016 [US3] Audit `src/frontend/src/app/dashboard/page.tsx` — verify it renders: (a) task list via `api.get('/api/todos')`, (b) add-task form with title input, (c) edit control per task, (d) delete control per task, (e) complete toggle per task; note any missing UI controls for T017
- [x] T017 [US3] Add empty-state UI to `src/frontend/src/app/dashboard/page.tsx` — if the task list is empty, display a message (e.g., "No tasks yet. Add your first task above.") instead of an empty list; only add if not already present
- [x] T018 [P] [US3] Verify all API calls in `src/frontend/src/app/dashboard/page.tsx` route through `src/frontend/src/lib/api.ts` (no raw `fetch()` calls with hardcoded headers) — read both files and confirm
- [ ] T019 [US3] Manual responsive check — open dashboard in browser dev tools at 375px, 768px, 1280px; verify no horizontal overflow, all buttons are tappable (≥ 44px touch target), single-column layout at 375px

**Checkpoint**: Dashboard renders all 5 operations; empty state present; mobile layout verified.

---

## Phase 6: User Story 4 — Signup, Login, and Logout Flows (Priority: P2)

**Goal**: Unauthenticated users are redirected to sign-in (server-side); sign-up/sign-in pages work; logout clears session and redirects.

**Independent Test**: Open `http://localhost:3000/dashboard` in an incognito window — should redirect to `/sign-in`. Sign up with a new email, land on dashboard, then log out, then navigate back to `/dashboard` — should redirect again.

### Implementation for User Story 4

- [x] T020 [US4] Route protection verified: Next.js 16 uses `proxy.ts` convention (not `middleware.ts`). `src/frontend/src/proxy.ts` is already the active proxy file — no new file needed. middleware.ts creation was reverted after discovering the Next.js 16 naming convention conflict.
- [x] T021 [US4] Verify `src/frontend/src/proxy.ts` exports both `middleware` (default or named) and `config` (matcher array) — read the file; if `config` export is missing, add `export const config = { matcher: ['/dashboard/:path*'] }` to `proxy.ts`
- [x] T022 [P] [US4] Verify logout button/action exists in `src/frontend/src/app/dashboard/page.tsx` (or a shared layout/navbar component) — confirm it calls `authClient.signOut()` or equivalent Better Auth client method
- [x] T023 [US4] Verify `src/frontend/src/app/sign-in/page.tsx` displays an inline error message when credentials are invalid (does not redirect on failure) — read the page and confirm error state handling; add error display if missing
- [ ] T024 [US4] Manual auth flow verification: (a) visit `/dashboard` unauthenticated → redirects to `/sign-in`; (b) sign up new account → lands on dashboard; (c) sign out → redirect to `/sign-in`; (d) navigate to `/dashboard` again → redirects to `/sign-in`

**Checkpoint**: Middleware active. Protected routes reject unauthenticated access server-side. Auth flows complete.

---

## Phase 7: User Story 5 — Single API Client with Token Attachment (Priority: P2)

**Goal**: Every backend call from the frontend goes through `api.ts`; JWT is attached automatically; 401 triggers redirect.

**Independent Test**: Open browser DevTools Network tab, sign in, and perform any task operation. Verify the request has `Authorization: Bearer <token>` header. Expire the session (or clear the cookie) and attempt an action; verify redirect to `/sign-in`.

### Implementation for User Story 5

- [x] T025 [US5] Audit `src/frontend/src/lib/api.ts` — verify it includes methods for all 6 todo operations (list, create, get-by-id, update, complete, delete) and that each sends `Authorization: Bearer <token>`; add any missing convenience methods
- [x] T026 [P] [US5] Confirm `src/frontend/src/lib/api.ts` 401 handler redirects to `/sign-in` — read the response interceptor or error handler section; confirm `window.location.href = '/sign-in'` or `router.push('/sign-in')` is called on 401
- [x] T027 [US5] Search for any raw `fetch(` calls in `src/frontend/src/` (outside `api.ts` and `auth.ts`) that include `Authorization` headers — verify none exist; if found, refactor to use the shared `api.ts` client

**Checkpoint**: All task API calls use the shared client. JWT attached to every request. 401 auto-redirects.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, quality checks, and end-to-end smoke test across all user stories.

- [x] T028 [P] Run full backend test suite one final time — `pytest tests/ -v --tb=short` — all tests must be green
- [x] T029 [P] Verify `src/backend/app/routes/todos.py` has no direct SQLModel session queries (all DB access via `todo_service.*`) — satisfies SC-009
- [ ] T030 End-to-end smoke test per `specs/003-api-frontend-integration/quickstart.md` Step 4 — sign up → add → list → complete → update → delete → sign out → verify redirect
- [x] T031 [P] Verify `.env.example` at `phase-2/.env.example` documents all 5 required variables with placeholder values (no real secrets) — read and update if any variable is missing

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup Verification)
  └── Phase 2 (Foundational Verification)
        ├── Phase 3 (US1: CRUD API) — P1 🎯 MVP
        │     └── Phase 4 (US2: Protected Routes) — P1
        ├── Phase 5 (US3: Frontend UI) — P1 (depends on Phase 3 endpoint being callable)
        ├── Phase 6 (US4: Auth Flows) — P2
        └── Phase 7 (US5: API Client) — P2
              └── Phase 8 (Polish)
```

### User Story Dependencies

| Story | Depends On | Can Parallelize With |
|-------|-----------|---------------------|
| US1 (P1) — CRUD API | Phase 2 complete | US3 setup tasks |
| US2 (P1) — Protected Routes | US1 complete (T007–T010) | US3 implementation |
| US3 (P1) — Frontend UI | US1 complete (API callable) | US4, US5 |
| US4 (P2) — Auth Flows | Phase 2 complete | US5 |
| US5 (P2) — API Client | Phase 2 complete | US4 |

### Within Each User Story

- Verify → Implement (if gap found) → Test → Checkpoint

### Parallel Opportunities

- T002 and T003 can run in parallel (different services)
- T004, T005, T006 can run in parallel (read-only verification)
- T008 and T009 are independent tests, can be written in parallel
- T011 and T012 are in different files, can be done in parallel
- T018 and T019 are independent (one is code audit, one is browser check)
- T025, T026 can be read in parallel
- T028, T029, T031 are independent audits, all parallelizable

---

## Parallel Execution Examples

### Phase 3 (US1) parallel opportunities

```bash
# T008 and T009 — write both tests in parallel (different test functions, same file is fine sequentially)
Task: "Add test_get_todo_by_id_success to tests/backend/test_todos.py"
Task: "Add test_get_todo_by_id_not_found to tests/backend/test_todos.py"
```

### Phase 5+6 parallel opportunities (after Phase 3 done)

```bash
# US3 frontend work and US4 middleware work can proceed in parallel
Task: "Audit dashboard/page.tsx for all 5 operations" (US3 T016)
Task: "Create middleware.ts" (US4 T020)
```

---

## Implementation Strategy

### MVP (Phases 1–3 only)

1. Complete Phase 1: Verify environment ✓
2. Complete Phase 2: Confirm foundation ✓
3. Complete Phase 3: Close the GET /{id} gap
4. **STOP and VALIDATE**: Run pytest, call all 6 endpoints via curl/docs
5. API layer is 100% complete — demonstrable without frontend

### Full Integration (All Phases)

1. Phases 1–3: API MVP
2. Phase 4: Error response hardening (P1 — include in MVP demo)
3. Phase 5: Frontend UI verification
4. Phase 6: Middleware activation (unlocks server-side route protection)
5. Phase 7: API client audit
6. Phase 8: End-to-end smoke test

### Key Insight

The codebase is ~85% implemented. **Only 2 tasks create new code**:
- T007 (`GET /api/todos/{todo_id}` route — ~10 lines)
- T020 (`middleware.ts` — 2 lines)

All other tasks are verification, testing, or minor fixes revealed by verification. Total new code: < 50 lines.

---

## Notes

- [P] = can run in parallel with other [P] tasks in the same phase
- [US1]–[US5] label maps task to specific user story for traceability
- Route naming: all endpoints use `/api/todos` (not `/api/tasks`) per research.md Decision 1
- Update verb: PATCH (not PUT) per research.md Decision 2
- Most tasks are verification — if the existing implementation passes, move immediately to the next task
- Stop at each Checkpoint to run tests before proceeding
