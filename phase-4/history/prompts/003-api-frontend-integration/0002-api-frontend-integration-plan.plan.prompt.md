---
id: 0002
title: API Frontend Integration Plan
stage: plan
date: 2026-02-19
surface: claude-code
model: claude-sonnet-4-6
feature: 003-api-frontend-integration
branch: 003-api-frontend-integration
user: LENOVO
command: /sp.plan
labels: [plan, integration, backend, frontend, middleware, rest-api]
links:
  spec: specs/003-api-frontend-integration/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  created:
    - specs/003-api-frontend-integration/research.md
    - specs/003-api-frontend-integration/data-model.md
    - specs/003-api-frontend-integration/contracts/api-endpoints.md
    - specs/003-api-frontend-integration/quickstart.md
    - history/prompts/003-api-frontend-integration/0002-api-frontend-integration-plan.plan.prompt.md
  modified:
    - specs/003-api-frontend-integration/plan.md
  read:
    - specs/003-api-frontend-integration/spec.md
    - specs/003-api-frontend-integration/plan.md (template)
    - .specify/templates/phr-template.prompt.md
    - src/backend/app/routes/todos.py
    - src/backend/app/services/todo_service.py
    - src/backend/app/models/schemas.py
    - src/frontend/src/lib/api.ts
    - src/frontend/src/proxy.ts
tests:
  before: 15/15 passing (backend)
  after: 15/15 passing (no code changes in this plan phase)
---

## Prompt

Implement the /sp.plan workflow for Spec-3: API & Frontend Integration Layer.

Context:
- Spec-1 (auth) and Spec-2 (persistence) are complete and verified (15/15 tests passing)
- The backend and frontend are ~80-85% implemented already
- The plan must document reality (what exists) and identify true gaps

Required outputs:
1. `specs/003-api-frontend-integration/research.md` — 5 key decisions (Phase 0)
2. `specs/003-api-frontend-integration/data-model.md` — entity shapes and schema (Phase 1)
3. `specs/003-api-frontend-integration/contracts/api-endpoints.md` — full endpoint contracts (Phase 1)
4. `specs/003-api-frontend-integration/quickstart.md` — local run instructions (Phase 1)
5. `specs/003-api-frontend-integration/plan.md` — filled plan (replaces template)
6. PHR at `history/prompts/003-api-frontend-integration/0002-*.plan.prompt.md`

Critical findings from codebase exploration:
- Backend is ~85% complete: 5 todo routes implemented, JWT auth, service layer, 15 tests passing
- Missing: `GET /api/todos/{todo_id}` single-task endpoint (service method exists)
- Frontend is ~80% complete: dashboard, auth pages, api.ts, auth.ts all exist
- Missing: `middleware.ts` (proxy.ts exists but wrong filename — not active as Next.js middleware)
- Route naming: spec says `/api/tasks`, codebase uses `/api/todos` — keep `/api/todos`
- Update verb: spec says PUT, implementation uses PATCH — PATCH is correct

## Response snapshot

Generated all 5 SDD planning artifacts plus the PHR:

**research.md**: Documented 5 decisions:
1. Route prefix `/api/todos` — keep (renaming breaks 15 tests, no benefit)
2. Update verb PATCH — keep (partial update semantics are correct; PUT would require all fields)
3. Single-task GET — add (service method exists, ~10 lines)
4. Token strategy — no change (hybrid client/server already implemented)
5. Middleware — fix by creating `middleware.ts` re-exporting from `proxy.ts` (2 lines)

**data-model.md**: Documented Todo DB entity (id, title, description, status, user_id, created_at, updated_at), all Pydantic schemas (TodoCreate, TodoUpdate, TodoResponse), JWT payload shape, and TypeScript interfaces in api.ts.

**contracts/api-endpoints.md**: Full contract for all 6 endpoints (2 auth + 5 todo — includes the missing GET /{id} as "gap: not yet implemented"). Each endpoint includes request body, response body, query params, auth requirements, and error table.

**quickstart.md**: 4-step local setup (clone → .env → backend → frontend → verify flow), test commands, environment variable reference, troubleshooting section.

**plan.md**: Filled template with summary, technical context, constitution check, project structure tree, phase-by-phase summary, task groups A/B/C (2 mandatory + optional UI polish), verification criteria, and risks.

## Outcome

- ✅ Impact: All SDD planning artifacts for Spec-3 created; plan.md filled with concrete implementation approach; two gaps (GET /{id} + middleware.ts) identified and scoped as XS tasks
- 🧪 Tests: No code changes in this phase; 15/15 existing backend tests remain passing
- 📁 Files: 5 new files created, 1 modified (plan.md overwritten from template)
- 🔁 Next prompts: Run `/sp.tasks` to generate `tasks.md` with ordered, testable implementation tasks for Task Groups A and B
- 🧠 Reflection: The "document reality first" approach was valuable — the codebase was substantially more complete than the spec implied, reducing the implementation scope from a full build to two XS patches

## Evaluation notes (flywheel)

- Failure modes observed: None — artifacts generated cleanly from codebase exploration
- Graders run and results (PASS/FAIL): N/A (plan phase, no tests run)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Run /sp.tasks and verify tasks.md aligns with Task Groups A and B defined in plan.md
