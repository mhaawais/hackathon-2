# Implementation Plan: API & Frontend Integration Layer

**Branch**: `003-api-frontend-integration` | **Date**: 2026-02-19 | **Spec**: `specs/003-api-frontend-integration/spec.md`
**Input**: Feature specification from `/specs/003-api-frontend-integration/spec.md`

## Summary

Spec-3 wires together the already-implemented backend (FastAPI + SQLModel + Neon) and frontend (Next.js App Router + Better Auth) into a fully verified, end-to-end working application. Spec-1 (auth) and Spec-2 (persistence) are complete with 15/15 tests passing. The integration layer is approximately 80–85% implemented; this plan documents reality, identifies the two true gaps (missing single-task GET endpoint and inactive Next.js middleware), and prescribes the minimal changes needed to close them.

## Technical Context

**Language/Version**: Python 3.11 (backend), TypeScript / Node 18 (frontend)
**Primary Dependencies**: FastAPI, SQLModel, Better Auth, Next.js 14 (App Router), Tailwind CSS
**Storage**: PostgreSQL on Neon (serverless), accessed via SQLModel ORM
**Testing**: pytest (backend), manual/visual (frontend)
**Target Platform**: Local development → any Linux server; browser client
**Project Type**: Web application (separate frontend + backend)
**Performance Goals**: < 500ms p95 for CRUD operations on Neon free tier
**Constraints**: JWT secret shared between backend and Better Auth; no hardcoded secrets
**Scale/Scope**: Hackathon scope — single-user demo to functional multi-user MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] No hardcoded secrets — all env vars referenced via `config.py` and `.env`
- [x] OWASP Top 10 — no SQL injection (SQLModel parameterized), no XSS (React escapes), JWT validated server-side
- [x] Smallest viable diff — only the two identified gaps are in scope
- [x] Type hints on all Python functions — enforced in existing backend code
- [x] TypeScript strict mode — frontend is strict; no `any` without justification
- [x] No Phase 1 (CLI) or Phase 3+ (chatbot/K8s) code in scope

## Project Structure

### Documentation (this feature)

```text
specs/003-api-frontend-integration/
├── plan.md              # This file
├── spec.md              # Feature requirements
├── research.md          # Phase 0 output — 5 key decisions
├── data-model.md        # Phase 1 output — entity shapes & schemas
├── quickstart.md        # Phase 1 output — local run instructions
├── contracts/
│   └── api-endpoints.md # Phase 1 output — full endpoint contracts
├── checklists/
│   └── requirements.md  # Acceptance checklist
└── tasks.md             # Phase 2 output (created by /sp.tasks, not this plan)
```

### Source Code

```text
src/backend/
├── app/
│   ├── main.py               # FastAPI app entry point
│   ├── routes/
│   │   ├── todos.py          # 5 todo endpoints (+ GET /{id} gap)
│   │   └── health.py         # Health check
│   ├── models/
│   │   ├── todo.py           # SQLModel table
│   │   └── schemas.py        # TodoCreate, TodoUpdate, TodoResponse
│   ├── services/
│   │   └── todo_service.py   # Business logic (get_todo_by_id exists)
│   ├── auth/
│   │   ├── dependencies.py   # get_current_user dependency
│   │   └── jwt_bearer.py     # EdDSA JWKS + HS256 fallback
│   └── config.py             # Settings / env loading
└── tests/
    └── backend/
        └── test_todos.py     # 15 passing tests (+ 1 new for GET /{id})

src/frontend/src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Todo management UI (all 5 ops)
│   ├── sign-in/
│   │   └── page.tsx          # Sign-in page
│   └── sign-up/
│       └── page.tsx          # Sign-up page
├── components/               # Reusable UI components (if split out)
├── lib/
│   ├── api.ts                # ApiClient (JWT Bearer, 401→redirect)
│   ├── auth.ts               # Better Auth server-side instance
│   └── auth-client.ts        # Better Auth client-side instance
├── proxy.ts                  # Route protection logic (middleware impl)
└── middleware.ts             # GAP: must re-export from proxy.ts
```

## Complexity Tracking

No constitution violations for this feature — both gaps are XS changes.

| Gap | Change | Justification |
|-----|--------|---------------|
| `GET /api/todos/{todo_id}` | ~10 lines in routes + 1 test | REST completeness; service method already exists |
| `middleware.ts` | 2 lines (new file) | Activates already-written route protection logic |

---

## Phase 0: Research Decisions

All 5 decisions are documented in `research.md`. Summary:

1. **Route prefix**: `/api/todos` — keep as-is; renaming breaks all tests
2. **Update verb**: `PATCH` — semantically correct for partial update; keep as-is
3. **Single-task GET**: **Add** `GET /api/todos/{todo_id}` — only true API gap
4. **Token strategy**: Hybrid (client-side fetch + server-side session check) — correct, no change
5. **Middleware**: **Fix** by creating `middleware.ts` that re-exports from `proxy.ts`

---

## Phase 1: Design Artifacts

All design artifacts are complete:

- [x] `data-model.md` — Todo entity, request/response schemas, JWT payload, frontend types
- [x] `contracts/api-endpoints.md` — All 6 endpoints with request/response shapes and error codes
- [x] `quickstart.md` — Step-by-step local setup and verification guide

---

## Phase 2: Implementation Tasks (delegated to /sp.tasks)

The following tasks are in scope for `/sp.tasks` to generate in `tasks.md`:

### Task Group A — Backend gap (single-task GET)

**A1**: Add `GET /api/todos/{todo_id}` route to `src/backend/app/routes/todos.py`
- Use existing `todo_service.get_todo_by_id(session, todo_id, user_id)` service method
- Return `TodoResponse` on success, 404 if not found or wrong user
- Auth: `get_current_user` dependency (already pattern-matched by other routes)
- Test: Add happy-path test + 404 test to `tests/backend/test_todos.py`

### Task Group B — Frontend gap (middleware activation)

**B1**: Create `src/frontend/src/middleware.ts` with content:
```typescript
export { middleware, config } from './proxy';
```
This activates Next.js route protection without touching the proxy logic.

### Task Group C — UI polish (if time permits, not blocking)

**C1**: Navbar component with user email + sign-out button
**C2**: Empty state for todo list (illustration or message)
**C3**: Loading skeleton while fetching todos
**C4**: Toast notifications for add/update/delete/complete actions

*Note: C1–C4 are quality-of-life improvements. The app is functionally complete without them.*

---

## Verification Criteria

### Backend (all must pass before merge)

- [ ] `GET /api/todos/{todo_id}` returns 200 with correct todo for owner
- [ ] `GET /api/todos/{todo_id}` returns 404 for non-existent ID
- [ ] `GET /api/todos/{todo_id}` returns 404 when accessed by non-owner
- [ ] All existing 15 tests still pass (no regression)

### Frontend (manual verification)

- [ ] Sign-up creates account; dashboard loads with empty state
- [ ] Add todo → appears in list
- [ ] Complete todo → status changes visually
- [ ] Update todo → changes persist after reload
- [ ] Delete todo → removed from list
- [ ] Sign out → `/dashboard` redirects to `/sign-in`
- [ ] Accessing `/dashboard` without session → redirects to `/sign-in` (middleware active)
- [ ] Mobile layout renders correctly at 375px width

### End-to-end

- [ ] Full flow: sign up → add → list → complete → update → delete → sign out → attempt access → redirect
- [ ] Todos survive backend restart (confirmed persisted in Neon)
- [ ] User A cannot see User B's todos

---

## Risks and Follow-ups

1. **Neon cold start**: Free tier may introduce 1–3s latency on first request after inactivity. Not a code issue; document in quickstart.
2. **Better Auth JWKS endpoint**: `jwt_bearer.py` attempts EdDSA JWKS fetch before HS256 fallback. Ensure `BETTER_AUTH_SECRET` is set correctly; mismatches cause silent 401s.
3. **C group tasks (UI polish)**: Deprioritize if time-boxed. Core functionality is complete without them.
