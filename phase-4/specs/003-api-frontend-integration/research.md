# Research: API & Frontend Integration Layer (Spec-3)

**Branch**: `003-api-frontend-integration` | **Date**: 2026-02-19 | **Phase**: Phase 0

## Overview

This document records the five key research decisions made before implementation planning began for Spec-3. Spec-1 (auth) and Spec-2 (persistence/todos) are complete and verified (15/15 tests passing). The integration layer is approximately 80–85% implemented; the purpose of this research is to document existing decisions, surface the true gaps, and lock the design before task generation.

---

## Decision 1 — Route Prefix: `/api/todos` vs `/api/tasks`

**Question**: The spec.md for Spec-3 uses `/api/tasks` in some places. The codebase uniformly uses `/api/todos`. Which wins?

**Finding**:
- `src/backend/app/routes/todos.py` — router prefix is `/api/todos`
- `src/frontend/src/lib/api.ts` — all fetch calls target `/api/todos/*`
- `tests/backend/` — all 15 tests use `/api/todos`
- No code or test file references `/api/tasks`

**Decision**: **Keep `/api/todos`.**

Rationale: Renaming to `/api/tasks` provides zero functional benefit and would break all existing tests and frontend calls atomically. The spec.md reference to `/api/tasks` is a naming inconsistency introduced during spec drafting; the implementation (which predates Spec-3) established `/api/todos` and it is treated as authoritative.

**Status**: Resolved — no action needed.

---

## Decision 2 — HTTP Verb for Update: `PATCH` vs `PUT`

**Question**: The spec mentions `PUT` for the update endpoint. The implementation uses `PATCH`. Which is correct?

**Finding**:
- `src/backend/app/routes/todos.py` — `PATCH /api/todos/{todo_id}` accepts `TodoUpdate` (partial fields)
- `TodoUpdate` schema has `title: str | None` and `description: str | None` — partial update semantics
- HTTP RFC: `PATCH` = partial update; `PUT` = full replacement (all fields required)

**Decision**: **Keep `PATCH`.**

Rationale: The update endpoint accepts partial fields (title and/or description independently). `PATCH` is semantically correct for partial update. `PUT` would require sending all fields every time, which is a worse API contract. The spec reference to `PUT` is a specification error.

**Status**: Resolved — no action needed.

---

## Decision 3 — Single-Task GET Endpoint: Add or Omit?

**Question**: Should `GET /api/todos/{todo_id}` be added? It is absent from the current routes.

**Finding**:
- `src/backend/app/routes/todos.py` — implements list, create, update, complete, delete. Missing: single-task fetch.
- `src/backend/app/services/todo_service.py` — `get_todo_by_id` service method already exists.
- Frontend (`app/dashboard/page.tsx`) — loads all todos via `GET /api/todos` and operates on local state; does not call a single-task endpoint.
- Tests — no test for single-task fetch.

**Decision**: **Add `GET /api/todos/{todo_id}`.**

Rationale:
1. The service method already exists — the route is a 5-line addition.
2. Standard REST convention. Any future optimistic-update or deep-link feature would require it.
3. Without it the API surface is incomplete for any consumer beyond the current dashboard.
4. Adds one test to verify it.

**Status**: Gap — add to tasks.

---

## Decision 4 — Token Strategy: Server-Side vs Client-Side Fetch

**Question**: How does the frontend authenticate? Should tokens be managed server-side (cookies, server components) or client-side (localStorage/sessionStorage + fetch)?

**Finding**:
- `src/frontend/src/lib/auth-client.ts` — Better Auth client configured with `baseURL` pointing to the backend
- `src/frontend/src/lib/api.ts` — `ApiClient` class: calls `authClient.getSession()` to retrieve session, extracts JWT, sends `Authorization: Bearer <token>` header on every request
- `src/frontend/src/lib/auth.ts` — server-side Better Auth instance used for session validation in `proxy.ts`
- `src/frontend/src/proxy.ts` — validates session cookie server-side; redirects unauthenticated users to `/sign-in`

**Decision**: **Hybrid: client-side fetch via `api.ts` (JWT Bearer), server-side session check via middleware.**

Current implementation is correct and complete. No change needed for token strategy. The only gap is activating the middleware (Decision 5).

**Status**: Resolved — no action needed except middleware fix.

---

## Decision 5 — Next.js Middleware: Fix `proxy.ts` → `middleware.ts`

**Question**: Why is the dashboard not protected server-side despite `proxy.ts` existing?

**Finding**:
- `src/frontend/src/proxy.ts` — contains the route protection logic with `export default` named `middleware`
- Next.js App Router requires the middleware to be in a file named exactly `middleware.ts` at `src/` (or project root), with a named export `middleware` and optionally `config`
- `src/frontend/src/middleware.ts` — **does not exist**
- Result: The dashboard is reachable without authentication at the server level (the client side will redirect on 401, but the page shell renders first)

**Decision**: **Create `src/frontend/src/middleware.ts` that re-exports from `proxy.ts`.**

Rationale: Minimal change — one new file, two lines. Activates server-side route protection without touching auth logic. Keeps proxy logic in `proxy.ts` where it can be tested independently.

**Status**: Gap — add to tasks.

---

## Summary of Gaps

| # | Gap | File(s) to touch | Effort |
|---|-----|------------------|--------|
| G1 | `GET /api/todos/{todo_id}` missing | `routes/todos.py`, `tests/backend/test_todos.py` | XS |
| G2 | `middleware.ts` not active | `src/frontend/src/middleware.ts` (new, 2 lines) | XS |
| G3 | `api.ts` missing `put` method | `src/frontend/src/lib/api.ts` | XS (optional, PATCH is correct) |

**G3 note**: Since `PATCH` is the correct verb (Decision 2), the `put` method is not needed for correctness. It may be added as a utility method for completeness but is not a functional gap.

---

## What Is NOT a Gap

The following were considered and confirmed complete:

- All 5 todo CRUD operations (add, list, update, complete, delete) — implemented and tested
- JWT auth middleware on all todo routes — implemented via `get_current_user` dependency
- User isolation (users see only their own todos) — enforced in service layer, tested
- Better Auth integration (signup, signin, signout) — implemented, frontend auth pages exist
- 401 redirect loop fix — resolved in Spec-1 history (PHR 6)
- Field length constraints (max 500/5000) — added in Spec-2 history (PHR 3)
- Toggle complete endpoint — implemented in Spec-2 history (PHR 4)
