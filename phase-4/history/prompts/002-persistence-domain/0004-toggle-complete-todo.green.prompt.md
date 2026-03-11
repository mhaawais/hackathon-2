---
id: "0004"
title: Toggle Complete Todo Implementation
stage: green
date: 2026-02-18
surface: backend
model: claude-sonnet-4-5-20250929
feature: persistence-domain
branch: 001-identity-security
user: human
command: targeted edit + pytest
labels: [todo, complete, toggle, test, service]
links:
  spec: specs/002-persistence-domain/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: src/backend/app/services/todo_service.py
    change: changed complete_todo() to toggle status between pending/completed
  - path: src/backend/tests/test_todo_routes.py
    change: added second PATCH call in test_complete_todo to verify toggle back to pending
tests:
  - name: test_complete_todo
    file: src/backend/tests/test_todo_routes.py
    result: PASSED
    command: "python -m pytest tests/test_todo_routes.py::test_complete_todo -v"
---

## Prompt

Make the following targeted changes for toggle completion:

T012: Update complete_todo() in src/backend/app/services/todo_service.py to toggle between "pending" and "completed" instead of always setting "completed".

T013: Update test_complete_todo in src/backend/tests/test_todo_routes.py to add a second PATCH call verifying the toggle back to "pending".

Run `cd src/backend && python -m pytest tests/test_todo_routes.py::test_complete_todo -v` to confirm it passes.

## Response snapshot

Applied two targeted edits:

1. `src/backend/app/services/todo_service.py` line 66: replaced `todo.status = "completed"` with `todo.status = "pending" if todo.status == "completed" else "completed"`.

2. `src/backend/tests/test_todo_routes.py` `test_complete_todo`: appended a second PATCH call and two assertions confirming the status toggles back to "pending".

Test result: `1 passed in 12.86s`.

## Outcome

- Impact: complete_todo() now implements idempotent toggle semantics; a second call on a completed todo returns it to pending
- Tests: test_complete_todo PASSED — verifies completed -> pending round-trip
- Files: 2 files modified, smallest viable diff, no unrelated code touched
- Next prompts: verify remaining todo route tests still pass; update frontend toggle button to reflect new bidirectional behavior
- Reflection: Toggle via ternary on existing status field is the simplest, safest approach — no schema changes required

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): test_complete_todo PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): run full test suite to confirm no regressions in other todo route tests
