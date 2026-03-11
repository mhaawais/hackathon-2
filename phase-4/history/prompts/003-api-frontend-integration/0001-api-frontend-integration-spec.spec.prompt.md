---
id: 0001
title: API Frontend Integration Spec
stage: spec
date: 2026-02-19
surface: claude-code
model: claude-sonnet-4-6
feature: 003-api-frontend-integration
branch: 003-api-frontend-integration
user: developer
command: /sp.specify
labels: [spec, api, frontend, jwt, crud, better-auth, next-js, fastapi]
links:
  spec: specs/003-api-frontend-integration/spec.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - path: specs/003-api-frontend-integration/spec.md
    action: created
    summary: Full specification for API & Frontend Integration Layer (5 user stories, 22 FRs, 9 SCs)
  - path: specs/003-api-frontend-integration/checklists/requirements.md
    action: created
    summary: Quality checklist — all items pass, no clarifications needed
tests:
  - path: N/A
    result: N/A
    summary: Spec stage — no tests run
---

## Prompt

/sp.specify Phase 2 – Spec 3: API & Frontend Integration Layer

Objective:
Implement the REST API layer and Next.js frontend integration for the Phase 2 multi-user Todo app, using the existing Security (Spec-1) and Persistence/Repository (Spec-2) layers.

Context (Already Done):
- Spec-1: Better Auth + JWT verification in FastAPI is working.
- Spec-2: Neon Postgres + SQLModel + repository layer is working.
- Agents/skills exist and must be used when helpful (auth, backend, database, frontend).

Core Requirements:

1. API Endpoints (FastAPI): GET/POST /api/tasks, GET/PUT/DELETE /api/tasks/{task_id}, PATCH /api/tasks/{task_id}/complete — all JWT-protected, user_id from JWT only, repository calls only.
2. Schemas: TaskCreate (title required, description optional), TaskUpdate (all optional), TaskRead (id, title, description, status, timestamps).
3. Error Handling: 401 (missing/invalid token), 404 (not found or cross-user), 422 (validation), 201 (create), 200 (read/update), 204 (delete).
4. Frontend: Next.js App Router — signup/signin/logout, task CRUD UI, single api.ts client with JWT attachment, 401→redirect, responsive.
5. Data Fetching: consistent client-side fetch pattern.
6. Config: env vars documented, README steps, Vercel-deployable frontend.

## Response snapshot

Created branch `003-api-frontend-integration` and wrote full spec.md with 5 user stories (P1: CRUD API, P1: Auth errors, P1: Frontend UI, P2: Auth flows, P2: API client), 22 functional requirements across API/schema/frontend layers, 9 measurable success criteria, edge cases, assumptions, dependencies, and scope boundaries. Quality checklist created — all items pass, 0 NEEDS CLARIFICATION markers. All files written inside phase-2/specs/003-api-frontend-integration/.

## Outcome

- ✅ Impact: Spec-3 complete — covers API layer, schema contracts, frontend UI, auth flows, and API client pattern
- 🧪 Tests: N/A — spec stage
- 📁 Files: 2 files created (spec.md, checklists/requirements.md)
- 🔁 Next prompts: /sp.plan — architecture decisions for API routes, schema design, frontend client pattern
- 🧠 Reflection: All decisions inherited cleanly from Spec-1 (JWT auth) and Spec-2 (404 strategy, toggle completion) — no clarifications needed. Client-side fetch chosen as the single data-fetching pattern for consistency.

## Evaluation notes (flywheel)

- Failure modes observed: create-new-feature.sh exited with code 1 despite creating the branch and spec file (cosmetic script issue, not blocking)
- Graders run and results (PASS/FAIL): N/A — spec stage, checklist validated manually
- Prompt variant (if applicable): All files strictly inside phase-2/ (no path drift)
- Next experiment (smallest change to try): N/A — proceed to /sp.plan
