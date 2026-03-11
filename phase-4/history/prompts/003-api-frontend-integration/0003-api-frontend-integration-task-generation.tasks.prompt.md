---
id: 0003
title: API Frontend Integration Task Generation
stage: tasks
date: 2026-02-19
surface: claude-code
model: claude-sonnet-4-6
feature: 003-api-frontend-integration
branch: 003-api-frontend-integration
user: LENOVO
command: /sp.tasks
labels: [tasks, integration, backend, frontend, middleware, rest-api, crud]
links:
  spec: specs/003-api-frontend-integration/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  created:
    - specs/003-api-frontend-integration/tasks.md
    - history/prompts/003-api-frontend-integration/0003-api-frontend-integration-task-generation.tasks.prompt.md
  read:
    - specs/003-api-frontend-integration/spec.md
    - specs/003-api-frontend-integration/plan.md
    - specs/003-api-frontend-integration/research.md
    - specs/003-api-frontend-integration/data-model.md
    - specs/003-api-frontend-integration/contracts/api-endpoints.md
    - specs/003-api-frontend-integration/quickstart.md
    - .specify/templates/tasks-template.md
tests:
  before: 15/15 passing (backend, established before this session)
  after: 15/15 passing (no code changes in task generation phase)
---

## Prompt

/sp.tasks — Generate tasks.md for Spec-3: API & Frontend Integration Layer.

Context:
- All design artifacts from /sp.plan are complete (research.md, data-model.md, contracts/, quickstart.md, plan.md)
- The codebase is ~80-85% implemented from Spec-1/Spec-2 work
- Only 2 true implementation gaps exist (GET /api/todos/{todo_id} and middleware.ts)
- 5 user stories defined in spec.md: US1(P1) CRUD API, US2(P1) Protected Routes, US3(P1) Frontend UI, US4(P2) Auth Flows, US5(P2) API Client

Required output:
- specs/003-api-frontend-integration/tasks.md with organized, executable task checklist
- PHR at history/prompts/003-api-frontend-integration/0003-*.tasks.prompt.md

## Response snapshot

Generated `tasks.md` with 31 tasks across 8 phases:

**Phase 1 — Setup Verification** (T001–T003): Confirm .env, run existing 15 tests, verify backend starts.

**Phase 2 — Foundational Verification** (T004–T006): Confirm get_current_user dependency on all routes, verify get_todo_by_id service method exists.

**Phase 3 — US1 CRUD API [P1]** (T007–T010): Add GET /api/todos/{todo_id} route (~10 lines in routes/todos.py), add 2 tests (happy path + 404), run suite to confirm 17+ passing.

**Phase 4 — US2 Protected Routes [P1]** (T011–T015): Verify UUID path param typed as uuid.UUID, add whitespace-title validator to TodoCreate schema, verify cross-user returns 404, add empty-title test, run suite (18+ passing).

**Phase 5 — US3 Frontend UI [P1]** (T016–T019): Audit dashboard for all 5 operations, add empty state if missing, verify no raw fetch calls, manual responsive check.

**Phase 6 — US4 Auth Flows [P2]** (T020–T024): Create middleware.ts (2 lines), verify proxy.ts config export, verify logout, verify sign-in error display, manual auth flow test.

**Phase 7 — US5 API Client [P2]** (T025–T027): Audit api.ts for all 6 endpoints, verify 401 redirect, audit for rogue fetch calls.

**Phase 8 — Polish** (T028–T031): Final test run, service layer audit, end-to-end smoke test, .env.example check.

Key design choices in tasks:
- Verification-first approach: most tasks check existing code before assuming it needs changes
- Only T007 and T020 create new code; all others verify or minimally fix
- Parallel markers on independent verification tasks and test writing tasks
- Story labels on all user story phase tasks for traceability

## Outcome

- ✅ Impact: tasks.md created with 31 tasks; only 2 implementation tasks (T007 route, T020 middleware); all others verification + testing
- 🧪 Tests: No code changes; 15/15 baseline still passing
- 📁 Files: 1 created (tasks.md), 1 PHR filled (this file)
- 🔁 Next prompts: Run /sp.implement to execute tasks in order, or manually work through phases starting at T001
- 🧠 Reflection: The "verify first, implement only gaps" approach produced a lean, practical task list — 31 tasks but only ~50 lines of new code. Most effort is verification of the existing solid implementation.

## Evaluation notes (flywheel)

- Failure modes observed: check-prerequisites.sh script fails on Windows bash — worked around by using known paths from plan artifacts directly
- Graders run and results (PASS/FAIL): N/A (task generation phase, no tests executed)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Execute T007 (add GET /{id} route) to validate the 10-line implementation closes the primary API gap
