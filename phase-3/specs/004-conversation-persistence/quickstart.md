# Quickstart: Conversation & Message Persistence Domain

**Branch**: `004-conversation-persistence` | **Date**: 2026-02-27

## Prerequisites

- Phase 2 backend is working: `DATABASE_URL` set in `phase-3/.env`, Neon DB reachable
- Python virtual environment active: `cd phase-3/src/backend && source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
- Dependencies installed: `pip install -r requirements.txt`

## Step 1 — Run DB Table Creation

The new `Conversation` and `Message` tables are created by running `init_db.py` after the
new model files are in place.

```bash
cd phase-3/src/backend
python -c "from db.init_db import init_db; init_db()"
```

Expected output (no errors, tables created or already exist):

```
Creating database tables...
Tables created successfully.
```

Verify tables exist in Neon console or with psql:

```sql
\dt
-- Should list: todo, conversation, message (plus any Better Auth tables)
```

## Step 2 — Run Smoke Tests

```bash
cd phase-3/src/backend
pytest tests/test_conversation_service.py -v
```

Expected output:

```
tests/test_conversation_service.py::test_create_conversation PASSED
tests/test_conversation_service.py::test_get_conversation_own PASSED
tests/test_conversation_service.py::test_get_conversation_not_found PASSED
tests/test_conversation_service.py::test_get_conversation_wrong_user PASSED
tests/test_conversation_service.py::test_list_conversations_empty PASSED
tests/test_conversation_service.py::test_list_conversations_multiple PASSED
tests/test_conversation_service.py::test_list_conversations_isolation PASSED
tests/test_conversation_service.py::test_add_message_user_role PASSED
tests/test_conversation_service.py::test_add_message_assistant_role PASSED
tests/test_conversation_service.py::test_add_message_invalid_role PASSED
tests/test_conversation_service.py::test_add_message_empty_content PASSED
tests/test_conversation_service.py::test_add_message_updates_conversation_updated_at PASSED
tests/test_conversation_service.py::test_get_messages_ordering PASSED
tests/test_conversation_service.py::test_get_messages_wrong_user PASSED

14 passed in Xs
```

## Step 3 — Run Full Backend Test Suite

Verify no regressions in Phase 2 tests:

```bash
cd phase-3/src/backend
pytest tests/ -v
```

All Phase 2 tests must still pass alongside the new Spec-4 tests.

## Step 4 — Manual Verification (Optional)

Quick Python REPL check:

```python
# From phase-3/src/backend directory
from sqlmodel import Session
from app.db import engine
from app.services.conversation_service import (
    create_conversation, get_conversation,
    list_conversations, add_message, get_messages_for_conversation
)

with Session(engine) as session:
    # Create a conversation
    conv = create_conversation(session, user_id="test_user")
    print(f"Created conversation: id={conv.id}")

    # Add messages
    msg1 = add_message(session, conv.id, "test_user", "user", "Show my tasks")
    msg2 = add_message(session, conv.id, "test_user", "assistant", "You have 3 tasks.")
    print(f"Messages: {msg1.role}: {msg1.content} | {msg2.role}: {msg2.content}")

    # Fetch history
    history = get_messages_for_conversation(session, conv.id, "test_user")
    print(f"History length: {len(history)}")  # Expected: 2

    # Cross-user isolation
    wrong = get_conversation(session, conv.id, "other_user")
    print(f"Cross-user access: {wrong}")  # Expected: None
```

## Environment Variables Required

```bash
# phase-3/.env (already set from Phase 2)
DATABASE_URL=postgresql://...     # Neon connection string
BETTER_AUTH_SECRET=...            # Not needed for this spec's tests but required for app startup
```

## Files Created by This Spec

| File | Purpose |
|------|---------|
| `src/backend/app/models/conversation.py` | `Conversation` SQLModel table |
| `src/backend/app/models/message.py` | `Message` SQLModel table |
| `src/backend/app/services/conversation_service.py` | 5 repository operations |
| `src/backend/db/init_db.py` | Updated to import and create new tables |
| `src/backend/tests/test_conversation_service.py` | 14 tests for all operations |
