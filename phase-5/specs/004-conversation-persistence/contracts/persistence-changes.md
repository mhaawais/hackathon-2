# Persistence Contract: Conversation & Message Domain

**Branch**: `004-conversation-persistence` | **Date**: 2026-02-27
**Contract type**: Python service API (internal — no HTTP endpoints this spec)
**Consumer**: Spec-6 (`agent_service.py`, `chat.py` route), Spec-5 (MCP tools)

---

## Module: `conversation_service`

**Location**: `src/backend/app/services/conversation_service.py`
**Import pattern**: `from app.services.conversation_service import create_conversation, ...`
**Session**: All functions accept `session: Session` as first argument (FastAPI DI via `get_session()`)

---

### Function 1: `create_conversation`

```
create_conversation(session: Session, user_id: str) -> Conversation
```

| | Detail |
|---|---|
| **Purpose** | Create a new conversation record for a user |
| **Parameters** | `session` — SQLModel session; `user_id` — string from JWT |
| **Returns** | The created `Conversation` object (id, user_id, created_at, updated_at populated) |
| **Side effects** | Inserts one row into `conversation` table |
| **Errors** | None expected under normal conditions |
| **Example** | `conv = create_conversation(session, user_id="user_abc123")` → `conv.id == 1` |

---

### Function 2: `get_conversation`

```
get_conversation(session: Session, conversation_id: int, user_id: str) -> Conversation | None
```

| | Detail |
|---|---|
| **Purpose** | Retrieve a conversation by ID, only if it belongs to the given user |
| **Parameters** | `session`; `conversation_id` — integer; `user_id` — string from JWT |
| **Returns** | `Conversation` object if found and owned by user; `None` if not found or wrong owner |
| **Side effects** | None |
| **Errors** | None raised — caller handles `None` result |
| **Security** | Returns `None` for both "not found" and "wrong owner" — no existence leakage |
| **Example** | `conv = get_conversation(session, 99, "user_abc123")` → `None` (if 99 doesn't exist) |

---

### Function 3: `list_conversations`

```
list_conversations(session: Session, user_id: str) -> list[Conversation]
```

| | Detail |
|---|---|
| **Purpose** | Retrieve all conversations for a user, ordered most recently updated first |
| **Parameters** | `session`; `user_id` — string from JWT |
| **Returns** | List of `Conversation` objects (may be empty list) |
| **Ordering** | Descending by `updated_at` |
| **Side effects** | None |
| **Errors** | None — returns `[]` if user has no conversations |
| **Example** | `convs = list_conversations(session, "user_abc123")` → `[conv3, conv1, conv2]` (by updated_at desc) |

---

### Function 4: `add_message`

```
add_message(
    session: Session,
    conversation_id: int,
    user_id: str,
    role: str,
    content: str
) -> Message
```

| | Detail |
|---|---|
| **Purpose** | Add a message to a conversation and refresh the conversation's `updated_at` |
| **Parameters** | `session`; `conversation_id` — integer; `user_id` — string; `role` — "user" or "assistant"; `content` — non-empty string |
| **Returns** | The created `Message` object (id, conversation_id, user_id, role, content, created_at populated) |
| **Side effects** | Inserts one row into `message` table; updates `conversation.updated_at` to now |
| **Errors** | `ValueError("role must be 'user' or 'assistant'")` if role is invalid |
| **Errors** | `ValueError("content must not be empty")` if content is blank/whitespace-only |
| **Errors** | Underlying DB error if `conversation_id` does not exist (FK violation — caller must ensure conversation exists first) |
| **Example** | `msg = add_message(session, 1, "user_abc123", "user", "Show my tasks")` |

---

### Function 5: `get_messages_for_conversation`

```
get_messages_for_conversation(
    session: Session,
    conversation_id: int,
    user_id: str
) -> list[Message]
```

| | Detail |
|---|---|
| **Purpose** | Retrieve all messages for a conversation in chronological order (oldest first) |
| **Parameters** | `session`; `conversation_id` — integer; `user_id` — string (used to verify ownership before fetching) |
| **Returns** | List of `Message` objects ordered by `created_at` ascending |
| **Ordering** | Ascending by `created_at` (oldest message first — correct agent context order) |
| **Side effects** | None |
| **Errors** | Returns `[]` if conversation doesn't exist or doesn't belong to user (same as empty history) |
| **Security** | Verifies conversation belongs to user before returning messages |
| **Example** | `msgs = get_messages_for_conversation(session, 1, "user_abc123")` → `[msg1, msg2, msg3]` |

---

## Caller Workflow (Used by Spec-6 Chat Endpoint)

```python
# Step 1 — Resolve or create conversation
if conversation_id:
    conv = get_conversation(session, conversation_id, user_id)
    if conv is None:
        raise HTTPException(404, "Conversation not found")
else:
    conv = create_conversation(session, user_id)

# Step 2 — Load history for agent context
messages = get_messages_for_conversation(session, conv.id, user_id)

# Step 3 — Store user message
add_message(session, conv.id, user_id, "user", user_input)

# Step 4 — Run agent (Spec-6)
agent_response = run_agent(messages + [user_input], tools=mcp_tools)

# Step 5 — Store assistant response
add_message(session, conv.id, user_id, "assistant", agent_response)

# Step 6 — Return
return {"conversation_id": conv.id, "response": agent_response}
```

---

## Table DDL (generated by SQLModel.metadata.create_all)

```sql
CREATE TABLE conversation (
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_conversation_user_id ON conversation (user_id);

CREATE TABLE message (
    id               SERIAL PRIMARY KEY,
    conversation_id  INTEGER NOT NULL REFERENCES conversation(id),
    user_id          VARCHAR NOT NULL,
    role             VARCHAR NOT NULL,
    content          TEXT NOT NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_message_conversation_id ON message (conversation_id);
```

*Note*: Actual DDL generated by SQLModel — shown here for reference only.
