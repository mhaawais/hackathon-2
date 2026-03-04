---
id: 0003
title: Add Field Length Constraints to Todo Model and Schemas
stage: green
date: 2026-02-18
surface: backend
model: claude-sonnet-4-5-20250929
feature: 002-persistence-domain
branch: 001-identity-security
user: LENOVO
command: targeted edits T004, T005-T006
labels: [field-validation, pydantic, sqlmodel, max-length, todo]
links:
  spec: specs/002-persistence-domain/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: src/backend/app/models/todo.py
    change: Added max_length=500 to title Field, max_length=5000 to description Field
  - path: src/backend/app/models/schemas.py
    change: Added Field import from pydantic; added max_length constraints to TodoCreate and TodoUpdate title and description fields
tests:
  - suite: tests/test_jwt_verification.py
    result: 5 passed
  - suite: tests/test_todo_routes.py
    result: 6 passed
  - suite: tests/test_user_isolation.py
    result: 4 passed
  - total: 15 passed, 0 failed
---

## Prompt

Make the following targeted edits to add field length constraints:

T004 — src/backend/app/models/todo.py:
- title: str = Field(nullable=False) → title: str = Field(nullable=False, max_length=500)
- description: str | None = Field(default=None) → description: str | None = Field(default=None, max_length=5000)

T005-T006 — src/backend/app/models/schemas.py:
- In TodoCreate: title: str → title: str = Field(max_length=500) and description: str | None = None → description: str | None = Field(default=None, max_length=5000)
- In TodoUpdate: title: str | None = None → title: str | None = Field(default=None, max_length=500) and description: str | None = None → description: str | None = Field(default=None, max_length=5000)
- Add Field to the existing pydantic import

Then run `cd src/backend && python -m pytest tests/ -v` to verify tests still pass.

## Response snapshot

Read both files, applied two targeted edits (one per file), then ran the full test suite. All 15 tests passed in ~91 seconds.

Changes applied:
- src/backend/app/models/todo.py: max_length=500 on title, max_length=5000 on description at the SQLModel layer.
- src/backend/app/models/schemas.py: Field imported alongside BaseModel; max_length constraints added to TodoCreate.title, TodoCreate.description, TodoUpdate.title, TodoUpdate.description at the Pydantic validation boundary.

## Outcome

- Impact: Field length constraints are now enforced at the Pydantic request validation layer (422 before DB touch) and recorded as SQLModel column metadata.
- Tests: 15 passed, 0 failed — no regressions introduced.
- Files: 2 files modified (todo.py, schemas.py); no new files created.
- Next prompts: T007+ tasks in the persistence-domain feature (migrations, DB smoke tests, etc.).
- Reflection: Smallest viable diff applied; no unrelated code touched. Constraints are consistent between ORM model and Pydantic schemas.

## Evaluation notes (flywheel)

- Failure modes observed: None. Edits were unambiguous; tests passed cleanly.
- Graders run and results (PASS/FAIL): pytest 15/15 PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add min_length=1 to title in both layers to prevent blank-title todos.
