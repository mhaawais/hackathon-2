---
id: 7
title: Fix 403 to 404 User Isolation
stage: green
date: 2026-02-18
surface: backend
model: claude-sonnet-4-5-20250929
feature: identity-security
branch: 001-identity-security
user: LENOVO
command: targeted edit T009 + T010
labels: [bug-fix, user-isolation, http-status, security]
links:
  spec: specs/identity-security/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: src/backend/app/services/todo_service.py
    change: Changed HTTP_403_FORBIDDEN + "Access denied" to HTTP_404_NOT_FOUND + "Todo not found" in get_todo() cross-user ownership check
  - path: src/backend/tests/test_user_isolation.py
    change: Updated all three cross-user test assertions from status_code == 403 / "Access denied" to status_code == 404 / "Todo not found"; updated docstrings to match
tests:
  - name: test_user_cannot_see_other_users_todos
    result: PASS
  - name: test_user_cannot_update_other_users_todo
    result: PASS
  - name: test_user_cannot_complete_other_users_todo
    result: PASS
  - name: test_user_cannot_delete_other_users_todo
    result: PASS
---

## Prompt

Make the following targeted changes for user isolation (403→404 fix):

**T009: Fix get_todo() in src/backend/app/services/todo_service.py**
Change the cross-user access response from 403 to 404. Currently lines 38-43 have:
```python
    if todo.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
```
Change to:
```python
    if todo.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
```

**T010: Update tests in src/backend/tests/test_user_isolation.py**
All 4 test functions check for status 403. Change every `assert response.status_code == 403` to `assert response.status_code == 404`.

Working directory is C:\Users\LENOVO\Desktop\stech-webs\hackathon-2\phase-2. Make the edits, then run `cd src/backend && python -m pytest tests/test_user_isolation.py -v` to confirm all 4 pass.

## Response snapshot

Applied two targeted edits:

1. `todo_service.py` `get_todo()`: the cross-user branch now raises `HTTP_404_NOT_FOUND` with detail `"Todo not found"` instead of `HTTP_403_FORBIDDEN` / `"Access denied"`.
2. `test_user_isolation.py`: updated three test functions' status assertions from 403 to 404; updated the `"Access denied"` detail check to `"Todo not found"`; updated docstrings from "should get 403" to "should get 404".

All 4 tests passed in 33.22 s:
```
tests/test_user_isolation.py::test_user_cannot_see_other_users_todos PASSED
tests/test_user_isolation.py::test_user_cannot_update_other_users_todo PASSED
tests/test_user_isolation.py::test_user_cannot_complete_other_users_todo PASSED
tests/test_user_isolation.py::test_user_cannot_delete_other_users_todo PASSED
4 passed in 33.22s
```

## Outcome

- Impact: Cross-user todo access now returns 404 instead of 403, preventing todo ID enumeration by external users; behaviour is consistent with "resource not visible to this user"
- Tests: 4/4 isolation tests pass
- Files: 2 files modified (todo_service.py, test_user_isolation.py)
- Next prompts: Remaining tasks in identity-security tasks.md (T011+) or integration test sweep
- Reflection: Returning 404 on cross-user access is the correct security posture — it avoids confirming that a resource exists for a different owner

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): pytest test_user_isolation.py — 4 PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add a direct GET /todos/{id} cross-user test to complement the mutating-operation tests
