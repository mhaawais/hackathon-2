# Implementation Plan: Conversation & Message Persistence Domain

**Branch**: `004-conversation-persistence` | **Date**: 2026-02-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-conversation-persistence/spec.md`

## Summary

Add two new SQLModel table models (`Conversation`, `Message`) to the existing Neon PostgreSQL
database, expose them via a `ConversationService` module with 5 repository operations, and
register the tables with the existing `init_db` creation flow — all without modifying
existing Phase 2 tables or services. This is a pure backend/database addition: no new HTTP
endpoints, no frontend changes, no AI logic. The result is the durable persistence layer that
Spec-5 (MCP tools) and Spec-6 (AI agent) will depend on.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: SQLModel 0.0.21+, FastAPI (session DI reused), psycopg2/asyncpg via Neon
**Storage**: Neon Serverless PostgreSQL — same connection engine and `get_session()` from `src/backend/app/db.py`
**Testing**: pytest — same test harness as Spec-1 and Spec-2 (`src/backend/tests/`)
**Target Platform**: Linux server (FastAPI backend, same container as Phase 2)
**Project Type**: Web application — backend only (no frontend changes this spec)
**Performance Goals**: All 5 repository operations complete within a single DB round-trip;
query performance adequate for up to 500 messages per conversation without pagination
**Constraints**: User isolation enforced at query level (WHERE user_id = ?); no in-memory state;
no modification of existing `todo`, `user` tables or `todo_service.py`
**Scale/Scope**: Same user base as Phase 2; conversations per user expected < 100; messages
per conversation expected < 500 for hackathon scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero Trust Backend | ✅ PASS | user_id derived from JWT only; service layer takes user_id as param |
| II. Strict User Isolation | ✅ PASS | All queries filter by user_id; no cross-user leakage possible |
| III. Spec-Driven Development | ✅ PASS | Spec-4 complete and approved before this plan |
| IV. Separation of Concerns | ✅ PASS | Service layer only; routes in Spec-6; no logic in models |
| V. Deterministic API Contracts | ✅ PASS | Python service contract defined in contracts/persistence-changes.md |
| VI. Stateless Backend | ✅ PASS | All state in Neon DB; no in-memory conversation state |
| VII. Production-Ready Standards | ✅ PASS | DATABASE_URL from env; no hardcoded secrets |
| VIII. Security Standards | ✅ PASS | Role constraint enforced; content non-empty enforced |
| IX. Database Standards | ✅ PASS | SQLModel ORM; integer PKs (per spec assumption); timestamps; indexes; FKs |
| X. Frontend Standards | ✅ PASS | No frontend work in this spec |
| XI. AI Agent Architecture | ✅ PASS | Stateless foundation: all chat state goes to DB (this spec delivers that) |
| XII. MCP Tool Design | ✅ PASS | Not in scope for this spec |
| XIII. Conversation Persistence | ✅ PASS | This spec IS the implementation of this principle |
| XIV. AI Provider Abstraction | ✅ PASS | Not in scope for this spec |

**Post-Design Re-check**: All gates pass. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/004-conversation-persistence/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — entity definitions and field specs
├── quickstart.md        # Phase 1 — setup and smoke test guide
├── contracts/
│   └── persistence-changes.md   # Phase 1 — Python service API contract
└── tasks.md             # Phase 2 — created by /sp.tasks (NOT this command)
```

### Source Code (files touched by this spec)

```text
src/backend/
├── app/
│   ├── models/
│   │   ├── conversation.py        # NEW — Conversation SQLModel table
│   │   └── message.py             # NEW — Message SQLModel table
│   ├── services/
│   │   └── conversation_service.py  # NEW — 5 repository operations
│   └── config.py                  # NO CHANGE
├── db/
│   └── init_db.py                 # UPDATED — import new models so tables are created
└── tests/
    └── test_conversation_service.py  # NEW — smoke + unit tests for all 5 operations
```

**Files NOT touched:**
- `app/models/todo.py` — frozen (Phase 2)
- `app/services/todo_service.py` — frozen (Phase 2)
- `app/routes/todos.py` — frozen (Phase 2)
- `app/routes/health.py` — frozen (Phase 2)
- `app/main.py` — no new router this spec (chat router added in Spec-6)
- `app/db.py` — `get_session()` reused as-is, no changes
- All frontend files — out of scope

**Structure Decision**: Backend-only addition. Follows existing pattern:
one model file per table (matching `app/models/todo.py`), one service file per domain
(matching `app/services/todo_service.py`). Session management reuses `db.get_session()`.

## Complexity Tracking

> No Constitution Check violations — this section is informational only.

| Decision | Rationale | Alternative Rejected |
|----------|-----------|----------------------|
| Integer PKs for Conversation + Message | Spec assumption; simpler client-side handling; conversation IDs not security-sensitive (user_id enforces isolation) | UUID PKs — unnecessary complexity for non-addressable internal entities |
| Separate model files (conversation.py, message.py) | Mirrors existing `todo.py` pattern; each file = one table | Single models.py — would mix concerns and grow unbounded with Phase 3+ additions |
| ConversationService as module (not class) | Mirrors existing `todo_service.py` pattern; stateless functions work well with FastAPI DI | Class-based repository — adds indirection with no benefit at this scale |
| Role as constrained string (not Python Enum) | SQLModel + PostgreSQL handle string columns simply; validation at service layer matches todo.py `status` pattern | Python `Enum` — adds import complexity; SQLModel enum support varies by backend version |
| updated_at refresh in add_message() | Conversation.updated_at must stay current for list ordering; done in service layer to keep model passive | DB trigger — adds infrastructure not present in Phase 2; harder to test |
