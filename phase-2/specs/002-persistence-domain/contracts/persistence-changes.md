# Contract Changes: Persistence & Domain Layer

**Branch**: `002-persistence-domain` | **Date**: 2026-02-18
**Base contracts**: `specs/001-identity-security/contracts/todo-endpoints.md`

This spec does NOT add new API endpoints. It refines the existing data layer behavior.

## Change 1: Cross-User Access Returns 404 (Not 403)

**Spec-1 behavior**: `get_todo()` returns 403 Forbidden when user accesses another user's task.
**Spec-2 behavior**: Returns 404 Not Found — avoids leaking resource existence (FR-009).

**Affected endpoints**: PATCH /api/todos/{id}, PATCH /api/todos/{id}/complete, DELETE /api/todos/{id}

**Before**:
```json
// 403
{"detail": "Access denied"}
```

**After**:
```json
// 404
{"detail": "Todo not found"}
```

## Change 2: Complete Endpoint Becomes Toggle

**Spec-1 behavior**: `PATCH /api/todos/{id}/complete` only sets status to "completed".
**Spec-2 behavior**: Toggles between "pending" and "completed".

**Response**: Same schema, but `status` field may now return `"pending"` after toggling back.

## Change 3: Field Length Validation

**New validation on POST /api/todos and PATCH /api/todos/{id}**:
- `title`: max 500 characters (422 if exceeded)
- `description`: max 5,000 characters (422 if exceeded)
