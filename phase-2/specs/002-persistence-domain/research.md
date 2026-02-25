# Research: Persistence & Domain Layer

**Branch**: `002-persistence-domain` | **Date**: 2026-02-18

## Existing Implementation Audit

The codebase already has a substantial persistence layer from Spec-1. This research documents what exists, what gaps remain, and decisions for closing them.

### What Already Exists

| Component | File | Status |
|-----------|------|--------|
| DB Engine | `src/backend/app/db.py` | Working, missing `pool_pre_ping` |
| DB Engine (legacy) | `src/db/connection.py` | Duplicate, has `pool_pre_ping` |
| Todo Model | `src/backend/app/models/todo.py` | Working, uses `status: str` not `completed: bool` |
| Service Layer | `src/backend/app/services/todo_service.py` | All 6 methods implemented |
| Schemas | `src/backend/app/models/schemas.py` | Working |
| Routes | `src/backend/app/routes/todos.py` | All 5 endpoints |
| Schema Init | `src/db/init_db.py` | Creates tables via `metadata.create_all` |
| Index on user_id | In model definition | `index=True` on `user_id` field |

### Gaps Identified

#### Gap 1: Duplicate DB Connection Files

- **`src/backend/app/db.py`**: Used by the FastAPI app (via `app.config`). Missing `pool_pre_ping` and `pool_recycle`.
- **`src/db/connection.py`**: Legacy file with `pool_pre_ping=True, pool_recycle=300`. Not used by the running app.

**Decision**: Consolidate into `src/backend/app/db.py` with `pool_pre_ping=True` and `pool_recycle=300`. Remove `src/db/connection.py` or make it import from the canonical source.
**Rationale**: Single source of truth for DB connections prevents configuration drift.
**Alternatives**: Keep both files synced — rejected, violates DRY.

#### Gap 2: `status: str` vs `completed: bool`

The spec requires `completed: boolean (default False)`. The current model uses `status: str (default="pending")` with values "pending" and "completed".

**Decision**: Keep `status: str` field as-is. The string-based status field is more flexible (supports future states if needed) and the existing frontend and API already use it. The spec's `completed: bool` intent is satisfied by the `status` field semantics.
**Rationale**: Changing to `completed: bool` would require a database migration, frontend changes, API contract changes, and test updates — all for no functional benefit. The spec's acceptance criteria (mark complete, toggle) are already met.
**Alternatives**: Add `completed: bool` field — rejected, unnecessary breaking change.

#### Gap 3: No Field Length Constraints

The spec assumes title max 500 chars and description max 5,000 chars. The current model has no `max_length` on string fields.

**Decision**: Add `max_length=500` to `title` and `max_length=5000` to `description` in the SQLModel field definitions. Also add Pydantic validation in schemas.
**Rationale**: Prevents abuse and ensures consistent behavior across DB and app layers.
**Alternatives**: DB-only constraint via `sa_column` — rejected, better to enforce in both layers.

#### Gap 4: Missing `pool_pre_ping` in Active DB Engine

The production engine in `src/backend/app/db.py` lacks connection resilience settings.

**Decision**: Add `pool_pre_ping=True` and `pool_recycle=300` to `src/backend/app/db.py`.
**Rationale**: Neon Serverless Postgres drops idle connections. Already proven necessary (SSL error fix earlier).

#### Gap 5: `get_todo` Returns 403 for Cross-User Access

The spec (FR-009) requires returning "not found" (404) when a user accesses another user's task, not "forbidden" (403), to avoid leaking existence.

**Decision**: Change `get_todo()` to return 404 for all cases where the user doesn't own the task.
**Rationale**: Security best practice — don't reveal that a resource exists if the user doesn't have access.
**Alternatives**: Keep 403 — rejected, violates spec and leaks information.

#### Gap 6: `complete_todo` is One-Way (Not Toggle)

The spec assumes completion is a toggle. Current implementation only sets `status = "completed"` with no way to revert.

**Decision**: Make `complete_todo` toggle between "pending" and "completed".
**Rationale**: Matches spec assumption and common todo app behavior.

#### Gap 7: `updated_at` Not Equal to `created_at` on Creation

The spec edge case states: "updated_at reflects creation time" for new tasks. Current implementation sets both to `datetime.now(timezone.utc)` via separate `default_factory` calls, which could differ by microseconds.

**Decision**: Accept current behavior. Both timestamps are set within the same Python expression evaluation, and microsecond differences are negligible.
**Rationale**: The spirit of the requirement is met. Enforcing exact equality would require unnecessary complexity.

#### Gap 8: `src/db/init_db.py` References Legacy Connection

`src/db/init_db.py` imports from `src.db.connection` which is the legacy file.

**Decision**: Update `init_db.py` to import the engine from `src.backend.app.db` (the canonical source).
**Rationale**: Consistency with the running application.

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ORM | SQLModel (existing) | Required by constitution |
| DB | Neon Postgres (existing) | Required by constitution |
| Primary Key | UUID v4 (existing) | Already implemented |
| Connection Pool | `pool_pre_ping=True, pool_recycle=300` | Proven fix for Neon idle drops |
| User ID type | `str` (not UUID) | Better Auth provides string IDs |
| Status field | `str` (keep as-is) | More flexible than bool, already working |
| Schema creation | `SQLModel.metadata.create_all` (existing) | Simple, reproducible |
