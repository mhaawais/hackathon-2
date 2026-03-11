# Data Model: Conversation & Message Persistence Domain

**Branch**: `004-conversation-persistence` | **Date**: 2026-02-27

## Entity: Conversation

**Table name**: `conversation`
**File**: `src/backend/app/models/conversation.py`
**Purpose**: Represents a single chat session between one authenticated user and the AI assistant.

| Field        | Type       | Constraints                        | Notes                                      |
| ------------ | ---------- | ---------------------------------- | ------------------------------------------ |
| `id`         | `int`      | PK, auto-increment                 | Integer for simpler client-side reference  |
| `user_id`    | `str`      | NOT NULL, indexed                  | From JWT; enforces ownership               |
| `created_at` | `datetime` | NOT NULL, default = now (UTC)      | Set on insert, never updated               |
| `updated_at` | `datetime` | NOT NULL, default = now (UTC)      | Refreshed by service when message is added |

**Relationships**:
- One `Conversation` → many `Message` records (via `Message.conversation_id`)
- `user_id` references the user identity from the JWT/Better Auth system (string, not FK to DB users table — consistent with `Todo.user_id` pattern)

**Indexes**:
- `user_id` — for `list_conversations(user_id)` queries

---

## Entity: Message

**Table name**: `message`
**File**: `src/backend/app/models/message.py`
**Purpose**: Represents a single turn in a conversation — either a user input or an AI assistant response.

| Field             | Type       | Constraints                          | Notes                                              |
| ----------------- | ---------- | ------------------------------------ | -------------------------------------------------- |
| `id`              | `int`      | PK, auto-increment                   | Integer; messages not externally addressable       |
| `conversation_id` | `int`      | NOT NULL, FK → conversation.id, indexed | Orphaned messages not permitted                  |
| `user_id`         | `str`      | NOT NULL                             | Denormalized from parent conversation for queries  |
| `role`            | `str`      | NOT NULL, `"user"` or `"assistant"`  | Validated in service layer before insert           |
| `content`         | `str`      | NOT NULL, non-empty                  | Validated in service layer (no blank/whitespace)   |
| `created_at`      | `datetime` | NOT NULL, default = now (UTC)        | Used for chronological ordering                    |

**Relationships**:
- Many `Message` → one `Conversation` (via `conversation_id`)
- `user_id` denormalized from parent conversation for direct user-scoped queries if needed

**Indexes**:
- `conversation_id` — for `get_messages_for_conversation()` queries

---

## Entity Relationship Diagram

```
┌─────────────────────────────┐        ┌──────────────────────────────────────┐
│         conversation         │        │               message                 │
├─────────────────────────────┤        ├──────────────────────────────────────┤
│ id          INT  PK AI       │◄───────│ conversation_id  INT  FK NOT NULL IDX│
│ user_id     STR  NOT NULL IDX│        │ id               INT  PK AI          │
│ created_at  DT   NOT NULL    │        │ user_id          STR  NOT NULL       │
│ updated_at  DT   NOT NULL    │        │ role             STR  NOT NULL       │
└─────────────────────────────┘        │ content          STR  NOT NULL       │
                                        │ created_at       DT   NOT NULL       │
                                        └──────────────────────────────────────┘
```

---

## Validation Rules (Service Layer)

| Entity       | Field     | Rule                                                  | Error raised        |
| ------------ | --------- | ----------------------------------------------------- | ------------------- |
| `Message`    | `role`    | Must be exactly `"user"` or `"assistant"`             | `ValueError`        |
| `Message`    | `content` | Must not be empty or whitespace-only after `.strip()` | `ValueError`        |
| `Conversation` | `user_id` | Must be non-empty string (guaranteed by JWT dep)    | No extra validation |

---

## State Transitions

### Conversation.updated_at

```
[created]  →  updated_at = created_at
   ↓
[message added]  →  updated_at = datetime.now(UTC)   (refreshed by add_message())
   ↓
[next message added]  →  updated_at = datetime.now(UTC)
```

### Message.role (constrained, no transitions)

```
Valid states: "user" | "assistant"
Invalid: any other string → ValueError before DB write
```

---

## Patterns Inherited from Phase 2

| Pattern                   | Source                              | Applied here                               |
| ------------------------- | ----------------------------------- | ------------------------------------------ |
| `str` for constrained field | `Todo.status = "pending"/"completed"` | `Message.role = "user"/"assistant"`       |
| `user_id: str` (not FK)   | `Todo.user_id`                      | `Conversation.user_id`, `Message.user_id` |
| `datetime.now(timezone.utc)` | `Todo.created_at/updated_at`     | Both entities                              |
| Session DI via `get_session()` | `todo_service.py` functions    | `conversation_service.py` functions        |
| Manual `updated_at` refresh | `todo_service.update_todo()`      | `conversation_service.add_message()`       |
