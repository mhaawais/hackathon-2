---
id: 0004
title: API Frontend Integration Implementation
stage: green
date: 2026-02-19
surface: claude-code
model: claude-sonnet-4-6
feature: 003-api-frontend-integration
branch: 003-api-frontend-integration
user: LENOVO
command: /sp.implement
labels: [green, implementation, backend, frontend, middleware, rest-api, tests]
links:
  spec: specs/003-api-frontend-integration/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  created:
    - src/frontend/src/middleware.ts
    - history/prompts/003-api-frontend-integration/0004-api-frontend-integration-implementation.green.prompt.md
  modified:
    - src/backend/app/routes/todos.py
    - src/backend/app/models/schemas.py
    - src/backend/tests/test_todo_routes.py
    - specs/003-api-frontend-integration/tasks.md
  verified_unchanged:
    - src/backend/app/auth/dependencies.py
    - src/backend/app/services/todo_service.py
    - src/frontend/src/app/dashboard/page.tsx
    - src/frontend/src/lib/api.ts
    - src/frontend/src/proxy.ts
    - src/frontend/src/app/(auth)/sign-in/page.tsx
tests:
  before: 15/15 passing (src/backend/tests/)
  after: 18/18 passing (src/backend/tests/) — 3 new tests added, all green
---

## Prompt

/sp.implement — Execute all tasks from tasks.md for Spec-3: API & Frontend Integration Layer.

Context:
- tasks.md has 31 tasks across 8 phases
- Checklist (checklists/requirements.md): 16/16 ✓ PASS — all items complete
- Codebase is ~80-85% implemented from Spec-1/Spec-2
- 2 guaranteed implementation tasks identified in plan: GET /api/todos/{todo_id} and middleware.ts
- Additional gaps may be discovered during verification passes

## Response snapshot

Executed full verification pass across all 31 tasks. Identified 5 files requiring changes:

**Phase 1–2 (Setup + Foundational Verification): T001–T006 — all PASS, no changes**
- `.env.example`: has all required vars (DATABASE_URL, BETTER_AUTH_SECRET, BACKEND_URL, NEXT_PUBLIC_API_URL, FRONTEND_URL). Note: JWT_SECRET not needed; codebase uses BETTER_AUTH_SECRET for JWT signing.
- `dependencies.py`: raises 401 on missing/invalid credentials ✓
- `todos.py`: all 5 routes have `user_id: str = Depends(get_current_user)` ✓
- `todo_service.py`: `get_todo()` method exists (named differently from plan but functionally identical) ✓

**Phase 3 (US1 — CRUD API): T007–T010 — IMPLEMENTED**

T007 — Added `GET /api/todos/{todo_id}` to `src/backend/app/routes/todos.py`:
```python
@router.get("/todos/{todo_id}", response_model=TodoResponse)
def get_todo_by_id(
    todo_id: uuid.UUID,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> TodoResponse:
    todo = todo_service.get_todo(session, todo_id, user_id)
    return TodoResponse.model_validate(todo)
```

T008+T009 — Added `test_get_todo_by_id_success` and `test_get_todo_by_id_not_found` tests.

**Phase 4 (US2 — Protected Routes): T011–T015 — IMPLEMENTED**

T011 — Verified: all routes use `uuid.UUID` type annotation → FastAPI auto-returns 422 ✓

T012 — Added `@field_validator("title")` to `TodoCreate` in `schemas.py`:
```python
@field_validator("title")
@classmethod
def title_not_empty(cls, v: str) -> str:
    if not v.strip():
        raise ValueError("title cannot be empty or contain only whitespace")
    return v
```

T013 — Verified: `get_todo()` raises HTTPException(404) for cross-user access ✓

T014 — Added `test_create_todo_empty_title` test (whitespace title → 422).

T015 — Full test run: **18/18 PASS**, 0 regressions.

**Phase 5 (US3 — Frontend UI): T016–T018 — all PASS, no changes**
- Dashboard has all 5 operations, empty state, and all API calls through api.ts ✓
- T019 (manual responsive check) left for human verification.

**Phase 6 (US4 — Auth Flows): T020–T023 — IMPLEMENTED**

T020 — Created `src/frontend/src/middleware.ts`:
```typescript
export { proxy as middleware, config } from './proxy';
```
Note: Tasks.md originally said `{ middleware, config }` but proxy.ts exports the function as `proxy` (not `middleware`), so `proxy as middleware` is the correct re-export.

T021 — Verified: `proxy.ts` exports `config` with correct matcher ✓
T022 — Verified: `handleSignOut` calls `authClient.signOut()` + `router.push('/sign-in')` ✓
T023 — Verified: `sign-in-form.tsx` has `setError("Invalid credentials")` on signInError ✓
T024 — Manual auth flow verification left for human.

**Phase 7 (US5 — API Client): T025–T027 — all PASS, no changes**
- `api.ts`: get/post/patch/delete methods cover all 6 endpoint patterns ✓
- 401 handler: `window.location.href = "/sign-in"` ✓
- No raw fetch calls with Authorization headers in dashboard ✓

**Phase 8 (Polish): T028–T031**
T028 — Final test run: 18/18 PASS ✓
T029 — Verified: `todos.py` contains only `todo_service.*` calls, no direct SQLModel queries ✓
T030 — Manual E2E smoke test left for human.
T031 — `.env.example` has all required vars, no real secrets ✓

## Outcome

- ✅ Impact: 5 files changed; 2 new code files (route + middleware.ts); 3 test additions; 18/18 tests green
- 🧪 Tests: 18/18 PASS (up from 15). New tests: test_get_todo_by_id_success, test_get_todo_by_id_not_found, test_create_todo_empty_title. All 15 prior tests still pass.
- 📁 Files: 1 created (middleware.ts), 3 modified (routes/todos.py, schemas.py, test_todo_routes.py), 8 verified unchanged
- 🔁 Next prompts: Run /sp.git.commit_pr to commit and create PR; or manual E2E test (T019, T024, T030) first
- 🧠 Reflection: Verification-first approach was highly effective — most "tasks" confirmed existing implementation was correct. Real code additions were minimal (~25 lines total). The middleware.ts rename discovery (proxy → middleware re-export) was the only unexpected wrinkle.

## Evaluation notes (flywheel)

- Failure modes observed: (1) tasks.md had middleware export wrong (`{ middleware }` instead of `{ proxy as middleware }`) — caught during T021 verification; (2) service method named `get_todo` not `get_todo_by_id` — harmless naming difference, same functionality
- Graders run and results (PASS/FAIL): pytest 18/18 PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run manual E2E flow (T024, T030) to confirm middleware redirect works in browser before creating PR
