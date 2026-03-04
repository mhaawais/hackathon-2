# Research: Conversation & Message Persistence Domain

**Branch**: `004-conversation-persistence` | **Date**: 2026-02-27

## Decision 1: Primary Key Type for Conversation and Message

**Decision**: Auto-incrementing integer PKs for both `Conversation` and `Message`.

**Rationale**: The spec explicitly assumes integer identifiers for conversations (noted in
Assumptions section). Integers are simpler for clients to pass in request bodies and are
perfectly safe because user isolation is enforced by `user_id` checks — not by opaque IDs.
Conversations are not directly addressable from arbitrary untrusted clients (they go through
authenticated endpoints). The existing `Todo` model uses UUID because todos are externally
addressable via REST URLs; conversations are referenced primarily by integer in a chat payload.

**Alternatives considered**:
- UUID: Would provide the same security properties but adds unnecessary complexity given the
  spec assumption and the fact that integer IDs are sufficient here.

---

## Decision 2: Role Field Implementation

**Decision**: `role: str` field with service-layer validation (`"user"` | `"assistant"` only).

**Rationale**: SQLModel's enum support requires defining a Python `Enum` class and mapping it
to the database, which adds boilerplate. The existing project uses plain string fields for
constrained values (e.g., `Todo.status = "pending" | "completed"` in `todo.py`). Following
this established pattern keeps the codebase consistent and avoids SQLModel/Alembic enum
migration complexity. The constraint is enforced in `conversation_service.add_message()` with
a `ValueError` raised on invalid input — identical to how `status_filter` is validated in
`todo_service.list_todos()`.

**Alternatives considered**:
- Python `Enum` + SQLModel: Cleaner type-safety but introduces migration complexity for enum
  type changes and is inconsistent with the existing codebase pattern.
- PostgreSQL `CHECK` constraint: Possible but requires raw DDL not expressible via SQLModel
  Field alone — over-engineered for hackathon scope.

---

## Decision 3: Conversation.updated_at Refresh Strategy

**Decision**: Refresh `Conversation.updated_at` inside `conversation_service.add_message()`.

**Rationale**: The spec requires `updated_at` to be refreshed whenever a new message is added,
for correct "most recently updated" list ordering. The service layer is the correct place to
enforce this side effect — it keeps models passive (data holders only) and the logic explicit
and testable. This matches how `todo_service.update_todo()` and `todo_service.complete_todo()`
manually set `updated_at = datetime.now(timezone.utc)`.

**Alternatives considered**:
- SQLAlchemy `onupdate`: Requires SQLAlchemy-specific column config not used in the existing
  codebase. Would need the conversation record to be explicitly modified.
- PostgreSQL trigger: Adds database infrastructure beyond the project's current complexity
  level; harder to test and audit.

---

## Decision 4: Message Content Validation

**Decision**: Validate non-empty content in `conversation_service.add_message()` with a
`ValueError` before persisting.

**Rationale**: The spec requires blank/whitespace-only content to be rejected (FR-010).
Service-layer validation matches the existing pattern (`TodoCreate` uses a Pydantic validator
for `title` in `schemas.py`). For the persistence layer, a guard at the service function
boundary ensures no invalid data reaches the DB regardless of how the function is called
(from a route handler, a test, or the MCP tool layer in Spec-5).

**Alternatives considered**:
- Pydantic schema validation only: The service layer is called directly by MCP tools (Spec-5)
  which may not go through Pydantic models — service-layer validation ensures the constraint
  holds regardless of caller.

---

## Decision 5: Table Creation (Migration Strategy)

**Decision**: Add `Conversation` and `Message` model imports to `src/backend/db/init_db.py`
so that `SQLModel.metadata.create_all(engine)` picks them up automatically.

**Rationale**: The project uses `init_db.py` with `SQLModel.metadata.create_all()` for table
creation — no Alembic or separate migration tooling. This is the established pattern from
Phase 2. Adding imports is the minimal, consistent approach to register new tables.
`create_all()` is idempotent (skips existing tables) so running it again after adding models
is safe.

**Alternatives considered**:
- Alembic migrations: Production best practice but significantly more setup than the project
  currently uses; out of scope for hackathon.
- Separate migration script: Adds complexity with no benefit given the idempotent `create_all`
  already in place.

---

## Decision 6: Test Strategy

**Decision**: pytest unit tests in `src/backend/tests/test_conversation_service.py` using
the same `conftest.py` pattern as existing tests (in-memory or test DB session).

**Rationale**: Existing tests (`test_todo_routes.py`, `test_user_isolation.py`) use pytest
fixtures from `conftest.py`. Adding a new test file in the same directory follows the
established pattern. Tests will cover: happy-path for all 5 operations, user isolation
(cross-user access returns None/empty), role constraint rejection, empty content rejection,
and conversation not-found handling.

**Alternatives considered**:
- Integration tests against live Neon DB: Slower, requires live credentials in CI, not
  needed for unit-level service testing.
