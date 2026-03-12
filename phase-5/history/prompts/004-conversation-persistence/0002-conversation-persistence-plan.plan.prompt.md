---
id: 2
title: Conversation Persistence Implementation Plan
stage: plan
date: 2026-02-27
surface: claude-code
model: claude-sonnet-4-6
feature: 004-conversation-persistence
branch: 004-conversation-persistence
user: user
command: /sp.plan go
labels: [plan, phase3, conversation, message, sqlmodel, neon, persistence]
links:
  spec: specs/004-conversation-persistence/spec.md
  ticket: n/a
  adr: n/a
  pr: n/a
files:
  - path: phase-3/specs/004-conversation-persistence/plan.md
    action: created
    note: Main plan — technical context, constitution check (14/14 pass), structure decision, complexity tracking
  - path: phase-3/specs/004-conversation-persistence/research.md
    action: created
    note: 6 decisions — PK type, role field, updated_at refresh, content validation, migration strategy, test strategy
  - path: phase-3/specs/004-conversation-persistence/data-model.md
    action: created
    note: Full entity definitions for Conversation and Message with field specs, indexes, ERD, validation rules
  - path: phase-3/specs/004-conversation-persistence/contracts/persistence-changes.md
    action: created
    note: Python service API contract — 5 function signatures with params, returns, errors, caller workflow
  - path: phase-3/specs/004-conversation-persistence/quickstart.md
    action: created
    note: Setup guide — table creation, test run, manual REPL verification, environment variables
  - path: phase-3/CLAUDE.md
    action: updated
    note: Agent context update via update-agent-context.sh — added Spec-4 active technologies
tests:
  - none at plan stage — 14 test cases specified in quickstart.md for tasks phase
---

## Prompt

User ran `/sp.plan go` to generate the implementation plan for Spec-4 (004-conversation-persistence).
Context: Phase 3, Python/FastAPI/SQLModel/Neon stack, following existing todo_service.py patterns.
No Alembic — using SQLModel.metadata.create_all() as in Phase 2. No HTTP endpoints this spec.

## Response snapshot

Ran setup-plan.sh → copied plan template to specs/004-conversation-persistence/plan.md.

Phase 0 (Research) — 6 decisions documented in research.md:
1. Integer PKs (spec assumption; simpler than UUID for non-security-sensitive IDs)
2. Role as constrained str (matches todo.py status pattern; avoids Enum complexity)
3. updated_at refresh in service layer (explicit, testable; matches todo_service pattern)
4. Content validation in service layer (guards all callers including MCP tools in Spec-5)
5. create_all() migration (existing pattern; idempotent)
6. pytest unit tests (same harness as Spec-1/2 tests)

Phase 1 (Design) — 4 artifacts:
- data-model.md: Conversation (id/user_id/created_at/updated_at) + Message (id/conversation_id/user_id/role/content/created_at) with indexes, ERD, validation rules, inherited patterns table
- contracts/persistence-changes.md: 5 function signatures with full input/output/error specs + caller workflow showing how Spec-6 will use them + reference DDL
- quickstart.md: 4-step setup guide — table creation, 14 smoke tests, full backend suite, REPL verification
- plan.md: Constitution check 14/14 pass; structure decision (backend-only, 3 new files + 1 update); complexity tracking with 5 decisions justified

Agent context updated via update-agent-context.sh — CLAUDE.md now tracks Spec-4 active technologies.

## Outcome

- ✅ Impact: Complete implementation blueprint; 0 open questions; ready for /sp.tasks
- 🧪 Tests: 14 test cases specified in quickstart.md; formal test file defined in tasks phase
- 📁 Files: plan.md, research.md, data-model.md, contracts/persistence-changes.md, quickstart.md, PHR
- 🔁 Next prompts: /sp.tasks for 004-conversation-persistence
- 🧠 Reflection: Strict adherence to existing Phase 2 patterns (todo_service, todo.py model style,
  create_all migration) means implementation can proceed with zero architectural surprises.
  The contracts/persistence-changes.md caller workflow doc will directly accelerate Spec-6 planning.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): constitution check — 14/14 PASS
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): proceed to /sp.tasks
