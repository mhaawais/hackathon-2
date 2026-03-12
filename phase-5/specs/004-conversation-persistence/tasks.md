# Tasks: Conversation & Message Persistence Domain

**Input**: Design documents from `/specs/004-conversation-persistence/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅
**Branch**: `004-conversation-persistence`
**Date**: 2026-02-27

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.
**Tests**: Included — service-layer unit tests using existing `conftest.py` `session` fixture (SQLite in-memory).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[US#]**: Maps to user story from spec.md
- All paths relative to `phase-3/`

---

## Phase 1: Setup

**Purpose**: Understand existing patterns before writing any code.

- [x] T001 Read `src/backend/db/init_db.py` and `src/backend/tests/conftest.py` to confirm `SQLModel.metadata.create_all()` pattern and how new model imports register tables in both production and test environments

**Checkpoint**: Confirm that adding a model import to `init_db.py` AND to the test file is sufficient to create the table — no Alembic or separate migration tooling needed.

---

## Phase 2: Foundational — Models & Table Creation

**Purpose**: Define the two new database tables. MUST complete before any service function is written.

**⚠️ CRITICAL**: Both model files must exist and be imported into `init_db.py` before US1–US4 work begins.

- [x] T002 [P] Create `src/backend/app/models/conversation.py` with `Conversation(SQLModel, table=True)`:
  - `__tablename__ = "conversation"`
  - `id: int` — `Field(default=None, primary_key=True)` (auto-increment integer)
  - `user_id: str` — `Field(nullable=False, index=True)`
  - `created_at: datetime` — `Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)`
  - `updated_at: datetime` — `Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)`

- [x] T003 [P] Create `src/backend/app/models/message.py` with `Message(SQLModel, table=True)`:
  - `__tablename__ = "message"`
  - `id: int` — `Field(default=None, primary_key=True)` (auto-increment integer)
  - `conversation_id: int` — `Field(nullable=False, foreign_key="conversation.id", index=True)`
  - `user_id: str` — `Field(nullable=False)`
  - `role: str` — `Field(nullable=False)` (validated to "user"|"assistant" in service layer)
  - `content: str` — `Field(nullable=False)` (validated non-empty in service layer)
  - `created_at: datetime` — `Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)`

- [x] T004 Update `src/backend/db/init_db.py` to import both new models after the Todo import (depends on T002, T003):
  ```python
  from app.models.conversation import Conversation  # noqa: F401, E402
  from app.models.message import Message            # noqa: F401, E402
  ```
  This registers both tables with `SQLModel.metadata` so `create_all()` creates them.

- [x] T005 Verify tables created: run `python -c "from db.init_db import init_db; init_db()"` from `src/backend/` and confirm no errors. Then verify `conversation` and `message` tables exist in Neon via psql or Neon console (depends on T004).

**Checkpoint**: `conversation` and `message` tables exist in Neon DB. `SQLModel.metadata` includes both models. User story implementation can now begin.

---

## Phase 3: User Story 1 — Start a New Chat Session (Priority: P1) 🎯 MVP

**Goal**: `create_conversation()` creates a conversation record; `add_message()` stores a user-role message. A new chat session can be started from scratch with a single function call.

**Independent Test**: Call `create_conversation(session, "user_a")` → verify new Conversation row in DB. Then call `add_message(session, conv.id, "user_a", "user", "Hello")` → verify Message row exists with correct fields. Both operations complete without errors.

- [x] T006 [US1] Create `src/backend/app/services/conversation_service.py` with the `create_conversation` function:
  ```python
  def create_conversation(session: Session, user_id: str) -> Conversation:
      conv = Conversation(user_id=user_id)
      session.add(conv)
      session.commit()
      session.refresh(conv)
      return conv
  ```

- [x] T007 [US1] Add `add_message` function to `conversation_service.py`:
  - Validate `role in ("user", "assistant")` → raise `ValueError("role must be 'user' or 'assistant'")` if invalid
  - Validate `content.strip()` is non-empty → raise `ValueError("content must not be empty")` if blank
  - Create and persist `Message(conversation_id=..., user_id=..., role=..., content=...)`
  - Signature: `add_message(session: Session, conversation_id: int, user_id: str, role: str, content: str) -> Message`

- [x] T008 [US1] Create `src/backend/tests/test_conversation_service.py` — add import block and US1 tests:
  - Import `Conversation`, `Message` models at top of file (required so SQLite `session` fixture creates tables)
  - Import service functions from `app.services.conversation_service`
  - Use `session` fixture from `conftest.py` (in-memory SQLite)
  - `test_create_conversation` — call `create_conversation(session, "user_a")`, assert `conv.id` is not None, `conv.user_id == "user_a"`, `conv.created_at` is set
  - `test_add_message_user_role` — create conversation then `add_message(..., "user", "Hello")`, assert message stored with correct fields
  - `test_add_message_invalid_role` — assert `ValueError` raised when role is `"system"` or `"moderator"`
  - `test_add_message_empty_content` — assert `ValueError` raised when content is `""` or `"   "`

**Checkpoint**: Run `pytest tests/test_conversation_service.py::test_create_conversation tests/test_conversation_service.py::test_add_message_user_role tests/test_conversation_service.py::test_add_message_invalid_role tests/test_conversation_service.py::test_add_message_empty_content -v` — all 4 pass.

---

## Phase 4: User Story 2 — Resume a Previous Chat Session (Priority: P1)

**Goal**: `get_conversation()` returns a conversation only for its owner; `get_messages_for_conversation()` returns all messages in chronological order. An existing session can be fully resumed.

**Independent Test**: Create conversation + 3 messages. Call `get_messages_for_conversation(session, conv.id, user_id)` → assert 3 messages returned in correct order. Call same with wrong `user_id` → assert empty list returned.

- [x] T009 [US2] Add `get_conversation` function to `conversation_service.py`:
  - Fetch by `conversation_id`; return `None` if not found OR if `conversation.user_id != user_id`
  - Returns `None` for both cases — no existence leakage
  - Signature: `get_conversation(session: Session, conversation_id: int, user_id: str) -> Conversation | None`

- [x] T010 [US2] Add `get_messages_for_conversation` function to `conversation_service.py`:
  - First verify conversation belongs to `user_id` (call `get_conversation` internally); return `[]` if not found
  - Fetch all `Message` rows where `conversation_id == conversation_id` ordered by `created_at` ascending
  - Signature: `get_messages_for_conversation(session: Session, conversation_id: int, user_id: str) -> list[Message]`

- [x] T011 [US2] Add US2 tests to `test_conversation_service.py`:
  - `test_get_conversation_own` — create conversation for user_a, fetch with user_a → assert returned
  - `test_get_conversation_not_found` — fetch non-existent id → assert `None`
  - `test_get_conversation_wrong_user` — create for user_a, fetch with user_b → assert `None`
  - `test_get_messages_ordering` — add 3 messages, assert returned in creation order (oldest first)
  - `test_get_messages_wrong_user` — create for user_a + messages, fetch with user_b → assert `[]`

**Checkpoint**: Run `pytest tests/test_conversation_service.py -k "US2 or get_conversation or get_messages" -v` — all 5 new tests pass alongside US1 tests.

---

## Phase 5: User Story 3 — Store AI Responses (Priority: P1)

**Goal**: `add_message()` correctly stores assistant-role messages AND refreshes `conversation.updated_at` on every insert. Both sides of the conversation turn persist durably.

**Independent Test**: Add a user message then an assistant message. Fetch both with `get_messages_for_conversation()` — assert roles alternate correctly (user → assistant). Verify `conversation.updated_at` changed after adding each message.

- [x] T012 [US3] Update `add_message` in `conversation_service.py` to refresh `conversation.updated_at`:
  - After creating and persisting the `Message`, load the parent `Conversation` from session
  - Set `conv.updated_at = datetime.now(timezone.utc)`
  - Commit and return the message
  - Note: Both the message commit and the `updated_at` update are in the same transaction

- [x] T013 [US3] Add US3 tests to `test_conversation_service.py`:
  - `test_add_message_assistant_role` — add message with role `"assistant"`, assert stored with role `"assistant"` and correct content
  - `test_add_message_updates_conversation_updated_at` — record `updated_at` before adding message; add message; fetch conversation; assert `updated_at` is later than original value

**Checkpoint**: Run `pytest tests/test_conversation_service.py -v` — all tests pass including US3. Verify conversation `updated_at` updates correctly by inspecting test assertion output.

---

## Phase 6: User Story 4 — View All Conversations (Priority: P2)

**Goal**: `list_conversations()` returns all conversations for a user ordered by most recently updated first — empty list for users with no conversations, isolated from other users' data.

**Independent Test**: Create 3 conversations for user_a with different update times. Call `list_conversations(session, "user_a")` → assert 3 returned in descending `updated_at` order. Call for user_b (who has none) → assert empty list.

- [x] T014 [US4] Add `list_conversations` function to `conversation_service.py`:
  - Query all `Conversation` rows where `user_id == user_id`
  - Order by `updated_at` descending (most recently active first)
  - Return empty list if none found
  - Signature: `list_conversations(session: Session, user_id: str) -> list[Conversation]`

- [x] T015 [US4] Add US4 tests to `test_conversation_service.py`:
  - `test_list_conversations_empty` — list for user with no conversations → assert `[]`
  - `test_list_conversations_multiple` — create 3 conversations; add message to 3rd then 1st; assert order is [3rd, 1st, 2nd] by `updated_at`
  - `test_list_conversations_isolation` — create 2 for user_a, 2 for user_b; list for user_a → assert exactly 2 returned, none belonging to user_b

**Checkpoint**: Run `pytest tests/test_conversation_service.py -v` — all 14 tests pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation — full suite clean, no Phase 2 regressions, exports correct.

- [x] T016 Run full backend test suite from `src/backend/`: `pytest tests/ -v` — confirm all 14 new Spec-4 tests pass AND all existing Phase 2 tests (JWT verification, todo routes, user isolation) still pass with zero regressions

- [x] T017 [P] Check `src/backend/app/models/__init__.py` — if it exports model names, add `Conversation` and `Message` exports to maintain consistency with existing export pattern

- [x] T018 [P] Update `src/backend/app/models/__init__.py` comment block (if it exists) to document the new models for future agents (Spec-5 MCP tools will import from `app.models`)

- [x] T019 Confirm `src/db/init_db.py` runs cleanly end-to-end: `python -m src.db.init_db` from `phase-3/` root — tables created or already exist, no errors. This is the production table creation path used for Neon.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Models + Tables)  ← BLOCKS ALL user stories
    │
    ├──▶ Phase 3 (US1 - create + add_message)
    │         │
    │         ▼
    │    Phase 4 (US2 - get + history)
    │         │
    │         ▼
    │    Phase 5 (US3 - assistant role + updated_at)
    │
    └──▶ Phase 6 (US4 - list) ← can run after Phase 3 if needed
    │
    ▼
Phase 7 (Polish)  ← after all user stories
```

### User Story Dependencies

| Story | Depends on | Can parallelize with |
|-------|-----------|----------------------|
| US1 (Phase 3) | Phase 2 complete | — |
| US2 (Phase 4) | US1 complete (adds service file) | — |
| US3 (Phase 5) | US1 complete (`add_message` already exists) | US2 |
| US4 (Phase 6) | Phase 2 complete | US1, US2, US3 |

### Within Each Phase

- Models (T002, T003) → import update (T004) → table verification (T005)
- Service function → corresponding tests
- All tests for a phase MUST pass before moving to next phase

### Parallel Opportunities

- T002 and T003 (model files) can be written simultaneously — different files
- T009 and T010 (service functions) — T010 calls T009 internally, but can be drafted in parallel
- T017 and T018 (export updates) — same file, do sequentially
- T016, T017, T019 (polish) — T016 must run after T015; T017/T019 can run any time after T004

---

## Parallel Execution Example: Phase 2

```bash
# Run simultaneously (different files):
Task A: "Create Conversation model in src/backend/app/models/conversation.py"
Task B: "Create Message model in src/backend/app/models/message.py"

# Then sequentially:
Task C: "Update init_db.py imports"  (after A and B complete)
Task D: "Verify tables in Neon"      (after C completes)
```

---

## Implementation Strategy

### MVP First (US1 Only — minimum viable persistence layer)

1. Complete Phase 1 (Setup) — read existing code
2. Complete Phase 2 (Models + Tables) — CRITICAL foundation
3. Complete Phase 3 (US1) — `create_conversation` + `add_message` working
4. **STOP and VALIDATE**: `pytest tests/test_conversation_service.py -k "test_create or test_add_message" -v`
5. US1 working = Spec-5 (MCP tools) can begin `add_task` / `list_tasks` wiring

### Full Delivery (All 4 User Stories)

1. Phase 1 + Phase 2 → foundation
2. Phase 3 → US1 (new session) → 4 tests pass
3. Phase 4 → US2 (resume) → 5 more tests pass (9 total)
4. Phase 5 → US3 (AI responses) → 2 more tests pass (11 total)
5. Phase 6 → US4 (list) → 3 more tests pass (14 total)
6. Phase 7 → polish + full suite validation

---

## Test Summary

| Test | Story | Function tested | Assertion |
|------|-------|-----------------|-----------|
| `test_create_conversation` | US1 | `create_conversation` | New row; correct user_id; id not None |
| `test_add_message_user_role` | US1 | `add_message` | Message stored; role="user"; correct fields |
| `test_add_message_invalid_role` | US1 | `add_message` | `ValueError` on role="system" |
| `test_add_message_empty_content` | US1 | `add_message` | `ValueError` on content="   " |
| `test_get_conversation_own` | US2 | `get_conversation` | Returns Conversation for correct owner |
| `test_get_conversation_not_found` | US2 | `get_conversation` | Returns None for unknown id |
| `test_get_conversation_wrong_user` | US2 | `get_conversation` | Returns None for wrong user (isolation) |
| `test_get_messages_ordering` | US2 | `get_messages_for_conversation` | 3 messages returned oldest-first |
| `test_get_messages_wrong_user` | US2 | `get_messages_for_conversation` | Returns [] for wrong user |
| `test_add_message_assistant_role` | US3 | `add_message` | Message stored with role="assistant" |
| `test_add_message_updates_conversation_updated_at` | US3 | `add_message` | `updated_at` refreshed after insert |
| `test_list_conversations_empty` | US4 | `list_conversations` | Returns [] for user with no conversations |
| `test_list_conversations_multiple` | US4 | `list_conversations` | Returns ordered by `updated_at` desc |
| `test_list_conversations_isolation` | US4 | `list_conversations` | Returns only user's own conversations |

**Total: 14 tests across 4 user stories**

---

## Notes

- `[P]` tasks = different files, no blocking dependencies between them
- `[US#]` label maps task to spec user story for traceability
- conftest.py `session` fixture uses in-memory SQLite — new models must be imported at test file top so SQLModel registers them before `create_all()` runs
- `add_message` must handle the `updated_at` refresh atomically — both message insert and conversation update in the same `session.commit()` call
- Do NOT modify `todo.py`, `todo_service.py`, `routes/todos.py` — frozen Phase 2 files
- Do NOT add a new FastAPI router in this spec — chat route is Spec-6 work
