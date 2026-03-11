# Implementation Plan: Persistence & Domain Layer

**Branch**: `002-persistence-domain` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-persistence-domain/spec.md`

## Summary

Harden the existing persistence layer by consolidating duplicate DB connections, adding connection resilience (`pool_pre_ping`), enforcing field length constraints, fixing cross-user access responses (403→404), making completion a toggle, and adding Pydantic schema validation. Most of the architecture is already in place from Spec-1 — this plan focuses on targeted refinements, not a rewrite.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI, SQLModel, psycopg2, PyJWT
**Storage**: Neon Serverless PostgreSQL (via `DATABASE_URL` env var)
**Testing**: pytest (15 existing tests)
**Target Platform**: Linux/Windows server
**Project Type**: Web application (FastAPI backend + Next.js frontend)
**Performance Goals**: Task listing < 1s for 100 tasks per user
**Constraints**: `pool_pre_ping` required for Neon idle connection handling
**Scale/Scope**: Multi-user, ~100 tasks per user initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Zero Trust Backend | PASS | user_id from JWT only, never from request body |
| II. Strict User Isolation | NEEDS FIX | `get_todo` returns 403 instead of 404 for cross-user access |
| III. Spec-Driven Development | PASS | Spec → Plan → Tasks workflow followed |
| IV. Separation of Concerns | PASS | Service layer separates DB logic from routes |
| V. Deterministic API Contracts | PASS | Contracts defined in Spec-1, changes documented |
| VI. Stateless Backend | PASS | No in-memory state; all in Postgres |
| VII. Production-Ready Standards | NEEDS FIX | Duplicate DB connection files; missing pool_pre_ping in active engine |
| VIII. Security Standards | PASS | JWT verified on all protected routes |
| IX. Database Standards | NEEDS FIX | No field length constraints; missing pool resilience |
| X. Frontend Standards | N/A | No frontend changes in this spec |

**Gate result**: PASS with fixes — all issues are addressed in the implementation tasks below.

### Post-Design Re-Check

After implementing all tasks:
- Principle II: PASS — 404 for all cross-user access
- Principle VII: PASS — Single DB connection with pool_pre_ping
- Principle IX: PASS — Field length constraints enforced

## Project Structure

### Documentation (this feature)

```text
specs/002-persistence-domain/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: gap analysis and decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: setup instructions
├── contracts/
│   └── persistence-changes.md  # Contract delta from Spec-1
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /sp.tasks)
```

### Source Code (files to modify)

```text
src/backend/
├── app/
│   ├── db.py                    # ADD pool_pre_ping, pool_recycle
│   ├── models/
│   │   ├── todo.py              # ADD max_length to title, description
│   │   └── schemas.py           # ADD Field(max_length=...) validation
│   └── services/
│       └── todo_service.py      # FIX 403→404, ADD toggle complete
└── tests/
    ├── test_todo_routes.py      # UPDATE for toggle behavior
    └── test_user_isolation.py   # UPDATE for 404 instead of 403

src/db/
├── connection.py                # CONSOLIDATE → import from app.db
└── init_db.py                   # UPDATE import to use app.db engine
```

**Structure Decision**: Existing web application structure is correct. No new directories needed. Changes are targeted edits to existing files.

## Implementation Tasks (Summary)

### Task 1: Consolidate DB Connection (FR-012, FR-013)
- Add `pool_pre_ping=True, pool_recycle=300` to `src/backend/app/db.py`
- Update `src/db/connection.py` to import from `app.db` (or mark deprecated)
- Update `src/db/init_db.py` to import engine from `app.db`

### Task 2: Add Field Length Constraints (FR-011)
- Add `max_length=500` to `title` field in `todo.py`
- Add `max_length=5000` to `description` field in `todo.py`
- Add `Field(max_length=500)` / `Field(max_length=5000)` to Pydantic schemas

### Task 3: Fix Cross-User Access Response (FR-009)
- Change `get_todo()` in `todo_service.py` to return 404 (not 403) when user doesn't own task
- Update user isolation tests to expect 404

### Task 4: Make Completion a Toggle (FR-010)
- Update `complete_todo()` to toggle between "pending" and "completed"
- Update tests for toggle behavior

### Task 5: Verify Persistence & Run Tests
- Run full test suite
- Verify all 15+ tests pass
- Manual verification: create task, restart server, verify task persists

## Complexity Tracking

No complexity violations. All changes are minimal, targeted edits to existing files.

## Risks & Follow-Ups

- **Risk**: Changing 403→404 may confuse frontend error handling if it distinguishes between "not found" and "access denied". Mitigation: Frontend already shows generic error for both.
- **Follow-up**: Consider adding a migration tool (Alembic) for future schema changes instead of `create_all`.
- **Follow-up**: The legacy `src/db/` directory could be removed entirely once all imports are consolidated.
