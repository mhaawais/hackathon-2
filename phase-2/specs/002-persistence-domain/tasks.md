# Tasks: Persistence & Domain Layer

**Input**: Design documents from `specs/002-persistence-domain/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Existing tests will be updated as part of implementation tasks. No separate TDD phase — tests are inline with each task.

**Organization**: Tasks grouped by user story. Since this is a refinement spec (not greenfield), most tasks are targeted edits to existing files.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Consolidate DB configuration and add connection resilience (Gap 1, Gap 4, Gap 8 from research.md)

- [x] T001 Add `pool_pre_ping=True` and `pool_recycle=300` to engine in `src/backend/app/db.py`
- [x] T002 [P] Update `src/db/connection.py` to import engine and get_session from `src/backend/app/db` instead of creating its own
- [x] T003 [P] Update `src/db/init_db.py` to import engine from `src/backend/app/db` instead of `src/db/connection`

**Checkpoint**: Single source of truth for DB connection. `pool_pre_ping` active in production engine. No duplicate engine creation.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add field length constraints at model and schema level (Gap 3 from research.md)

**Why blocking**: Field constraints affect all CRUD operations across all user stories.

- [x] T004 Add `max_length=500` to `title` field and `max_length=5000` to `description` field in `src/backend/app/models/todo.py`
- [x] T005 [P] Add `max_length=500` to `title` and `max_length=5000` to `description` in `TodoCreate` schema in `src/backend/app/models/schemas.py`
- [x] T006 [P] Add `max_length=500` to `title` and `max_length=5000` to `description` in `TodoUpdate` schema in `src/backend/app/models/schemas.py`

**Checkpoint**: Field length enforced at both ORM and Pydantic validation layers. Requests with oversized fields return 422.

---

## Phase 3: User Story 1 — Task Data Persists Across Sessions (Priority: P1) MVP

**Goal**: Ensure all task data survives server restarts with 100% fidelity.

**Independent Test**: Create a task, restart the backend, verify the task is still retrievable with all fields intact.

### Implementation for User Story 1

- [x] T007 [US1] Verify `SQLModel.metadata.create_all` is called on app startup or via `src/db/init_db.py` — confirm table exists in Neon after fresh schema init
- [x] T008 [US1] Run `python -m pytest src/backend/tests/ -v` and confirm all existing persistence-related tests pass (create, list, update, delete, complete)

**Checkpoint**: Tasks persist in Neon Postgres. Server restart does not lose data. All existing CRUD tests pass.

---

## Phase 4: User Story 2 — Strict User Isolation (Priority: P1)

**Goal**: User A cannot access any of User B's tasks. Cross-user access returns 404 (not 403).

**Independent Test**: Create tasks as User A, attempt to access/modify/delete as User B — all return 404.

### Implementation for User Story 2

- [x] T009 [US2] Change `get_todo()` in `src/backend/app/services/todo_service.py` to return 404 (not 403) when `todo.user_id != user_id` — use same error message as "not found" case
- [x] T010 [US2] Update `src/backend/tests/test_user_isolation.py` to expect 404 status code instead of 403 for all cross-user access tests
- [x] T011 [US2] Run `python -m pytest src/backend/tests/test_user_isolation.py -v` and confirm all 4 isolation tests pass

**Checkpoint**: Cross-user access returns 404. No information leakage about resource existence. All isolation tests pass.

---

## Phase 5: User Story 3 — Reliable Task Lifecycle Operations (Priority: P2)

**Goal**: All CRUD + complete operations work correctly with proper timestamp updates and toggle behavior.

**Independent Test**: Create a task, update it (verify updated_at changes), mark complete (verify toggle), delete it (verify removal).

### Implementation for User Story 3

- [x] T012 [US3] Update `complete_todo()` in `src/backend/app/services/todo_service.py` to toggle status between "pending" and "completed" instead of only setting "completed"
- [x] T013 [US3] Update `test_complete_todo` in `src/backend/tests/test_todo_routes.py` to verify toggle behavior — complete then uncomplete
- [x] T014 [US3] Run `python -m pytest src/backend/tests/test_todo_routes.py -v` and confirm all 6 route tests pass including updated toggle test

**Checkpoint**: Completion toggles correctly. All CRUD operations persist. updated_at updates on every modification. All route tests pass.

---

## Phase 6: User Story 4 — Data Integrity Under Edge Conditions (Priority: P3)

**Goal**: Database-level constraints reject invalid data even if application layer has bugs.

**Independent Test**: Attempt to create a task without a title or user_id — verify rejection.

### Implementation for User Story 4

- [x] T015 [US4] Verify NOT NULL constraint on `title` and `user_id` fields in `src/backend/app/models/todo.py` — confirm `nullable=False` is set (already exists, verify only)
- [x] T016 [US4] Verify UUID primary key auto-generation in `src/backend/app/models/todo.py` — confirm `default_factory=uuid.uuid4` is set (already exists, verify only)

**Checkpoint**: DB-level constraints prevent invalid data. UUID uniqueness guaranteed. Required fields enforced at storage level.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all user stories

- [x] T017 Run full test suite: `python -m pytest src/backend/tests/ -v` — all tests must pass
- [x] T018 Verify no stray `src/db/connection.py` engine creation (should only import from `app.db`)
- [x] T019 Update `specs/002-persistence-domain/quickstart.md` if any setup steps changed during implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must complete before schema changes)
- **US1 (Phase 3)**: Depends on Phase 2 — verify persistence after constraints added
- **US2 (Phase 4)**: Depends on Phase 2 — can run parallel with US1
- **US3 (Phase 5)**: Depends on Phase 2 — can run parallel with US1 and US2
- **US4 (Phase 6)**: Depends on Phase 2 — can run parallel with US1, US2, US3
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent — only needs foundational phase
- **US2 (P1)**: Independent — only needs foundational phase
- **US3 (P2)**: Independent — only needs foundational phase
- **US4 (P3)**: Independent — verification only, no code changes expected

### Parallel Opportunities

```
Phase 1:  T001 ──┬── T002 (parallel)
                  └── T003 (parallel)

Phase 2:  T004 ──┬── T005 (parallel, different section of same file)
                  └── T006 (parallel, different section of same file)

Phase 3-6 (all parallel after Phase 2):
  US1: T007, T008
  US2: T009 → T010 → T011
  US3: T012 → T013 → T014
  US4: T015, T016 (parallel, verification only)

Phase 7:  T017 → T018 → T019 (sequential)
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: DB consolidation (T001–T003)
2. Complete Phase 2: Field constraints (T004–T006)
3. Complete Phase 3: Verify persistence (T007–T008)
4. Complete Phase 4: Fix isolation (T009–T011)
5. **STOP and VALIDATE**: All data persists, strict user isolation enforced

### Full Delivery

6. Complete Phase 5: Toggle completion (T012–T014)
7. Complete Phase 6: Verify integrity (T015–T016)
8. Complete Phase 7: Polish (T017–T019)

### Task Summary

| Phase | Tasks | Parallel | Files Modified |
|-------|-------|----------|----------------|
| Setup | T001–T003 | T002, T003 parallel | 3 files |
| Foundational | T004–T006 | T005, T006 parallel | 2 files |
| US1 (Persistence) | T007–T008 | — | 0 files (verify) |
| US2 (Isolation) | T009–T011 | — | 2 files |
| US3 (Lifecycle) | T012–T014 | — | 2 files |
| US4 (Integrity) | T015–T016 | T015, T016 parallel | 0 files (verify) |
| Polish | T017–T019 | — | 1 file |
| **Total** | **19 tasks** | **7 parallelizable** | **5 unique files** |

---

## Notes

- This is a refinement spec — most infrastructure already exists from Spec-1
- Only 5 unique files are modified; no new files created
- US1 and US4 are verification-only phases (no code changes expected)
- The heaviest code changes are in US2 (isolation fix) and US3 (toggle)
- All tasks reference exact file paths for LLM executability
