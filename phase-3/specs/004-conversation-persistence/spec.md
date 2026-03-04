# Feature Specification: Conversation & Message Persistence Domain

**Feature Branch**: `004-conversation-persistence`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Spec-4: Conversation and Message Persistence Domain — SQLModel models
for Conversation and Message, repository layer for conversation CRUD, database migrations for new
tables, foundation for stateless AI chat architecture"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a New Chat Session (Priority: P1)

As an authenticated user, I want the system to automatically create a new conversation record
for me when I send my first chat message, so that my chat history is tracked from the very
beginning without any manual setup on my part.

**Why this priority**: Every AI chat interaction depends on a conversation record existing first.
Without this, no messages can be stored, no history can be loaded, and the AI agent cannot
function. This is the foundational record for the entire chatbot feature.

**Independent Test**: Using a database client, verify that sending a chat request without a
`conversation_id` results in a new row in the conversations table linked to the correct user,
and a new row in the messages table for that first message.

**Acceptance Scenarios**:

1. **Given** an authenticated user with no prior conversations, **When** a chat message is sent
   without a `conversation_id`, **Then** a new conversation record is created in the database
   and its identifier is returned in the response.
2. **Given** a newly created conversation, **When** the conversation record is inspected,
   **Then** it is linked to the authenticated user's identity and has a creation timestamp.
3. **Given** a conversation has been created, **When** the user's message is stored,
   **Then** the message record references the correct conversation and carries the role "user".

---

### User Story 2 - Resume a Previous Chat Session (Priority: P1)

As an authenticated user, I want to continue an earlier conversation by providing its identifier,
so that the AI agent has full context of what was previously discussed and can give coherent,
contextually aware responses.

**Why this priority**: Without conversation resumption, the AI agent starts blind every time,
making it useless for multi-turn interactions. This is equally critical as creating new conversations.

**Independent Test**: Create a conversation with 5 messages via the repository. Then fetch the
messages for that conversation. Verify all 5 messages are returned in correct chronological order
with correct roles and content.

**Acceptance Scenarios**:

1. **Given** an existing conversation with prior messages, **When** the message history is
   fetched for that conversation, **Then** all messages are returned in chronological order.
2. **Given** a user who owns a conversation, **When** they provide the conversation's identifier,
   **Then** the system loads the full prior history successfully.
3. **Given** a user who does NOT own a conversation, **When** they provide another user's
   conversation identifier, **Then** the system returns nothing — no cross-user data exposure.
4. **Given** a conversation with 20 prior messages, **When** a new message is added,
   **Then** all 21 messages are retrievable in correct order without duplication or loss.

---

### User Story 3 - Store AI Responses in Chat History (Priority: P1)

As a system, I need to persist both the user's messages and the AI assistant's responses to
the database after each conversation turn, so that the complete exchange is durably stored
and survives server restarts.

**Why this priority**: Without persisting both sides of the conversation, the chat history is
incomplete. Subsequent agent runs would have missing context, leading to incoherent responses.

**Independent Test**: Store a user message and an assistant response. Restart the server process.
Fetch the conversation history and verify both the user message and the assistant response are
present in the correct order.

**Acceptance Scenarios**:

1. **Given** a completed agent turn, **When** the assistant's response is stored, **Then** a
   message record exists with role "assistant", correct content, and the correct conversation
   identifier.
2. **Given** both sides of a turn stored, **When** the conversation history is fetched,
   **Then** messages alternate correctly between "user" and "assistant" roles in chronological order.
3. **Given** a server restart, **When** the conversation history is fetched for an existing
   conversation, **Then** all previously stored messages are returned — zero data loss.

---

### User Story 4 - View All Conversations for a User (Priority: P2)

As an authenticated user, I want to retrieve a list of all my past conversations so that
I can select one to resume or review my chat history.

**Why this priority**: Useful for the chat UI to display prior sessions, but not required for
the core stateless chat loop. P1 stories must be complete first.

**Independent Test**: Create 3 conversations for user A and 2 for user B. List conversations
for user A and verify exactly 3 are returned, none belonging to user B.

**Acceptance Scenarios**:

1. **Given** a user with 3 conversations, **When** all conversations are listed, **Then**
   exactly 3 conversations are returned, each with its identifier and timestamps.
2. **Given** two users with separate conversations, **When** user A's conversations are listed,
   **Then** only user A's conversations appear — no cross-user leakage.
3. **Given** a user with no conversations, **When** conversations are listed, **Then**
   an empty list is returned — not an error.

---

### Edge Cases

- What happens when a `conversation_id` is provided but does not exist in the database?
  The system returns a "not found" result — not an exception that crashes the caller.
- What happens when a `conversation_id` belongs to a different user?
  The system treats it as "not found" — no information leakage about other users' data.
- What happens if the database connection fails during message storage?
  The operation fails with a clear error; no partial writes are committed (transactional integrity).
- What happens when messages are stored with identical timestamps?
  The system preserves insertion order; the `created_at` timestamp plus primary key determine order.
- What happens when a message with blank content is stored?
  The system rejects it — non-empty content is required for all messages.
- What happens when an invalid role value ("moderator", "system") is used?
  The system rejects it — only "user" and "assistant" are valid role values.

## Requirements *(mandatory)*

### Functional Requirements

**Conversation Management**

- **FR-001**: System MUST create a new `Conversation` record linked to a specific user's
  identity and return the conversation's unique identifier upon creation.
- **FR-002**: System MUST retrieve a `Conversation` record by identifier only when it belongs
  to the requesting user — otherwise return a "not found" result.
- **FR-003**: System MUST list all `Conversation` records for a given user, ordered by
  most recently updated first.
- **FR-004**: A `Conversation` record MUST store: a unique identifier, the owning user's
  identifier, a creation timestamp, and a last-updated timestamp.
- **FR-005**: The `Conversation` last-updated timestamp MUST be refreshed whenever a new
  message is added to that conversation.

**Message Management**

- **FR-006**: System MUST store a `Message` record linked to a specific conversation, with
  a role, text content, and a creation timestamp.
- **FR-007**: System MUST retrieve all `Message` records for a given conversation in strict
  chronological order (oldest first, newest last).
- **FR-008**: A `Message` record MUST store: a unique identifier, the parent conversation
  identifier, the user identifier, the role, the text content, and a creation timestamp.
- **FR-009**: The `role` field MUST be constrained to exactly two values: "user" or "assistant".
  Any other value MUST be rejected at the data layer.
- **FR-010**: The `content` field MUST be required and non-empty. Blank or whitespace-only
  content MUST be rejected.

**Data Integrity & Isolation**

- **FR-011**: System MUST enforce a foreign key constraint: every `Message` references a
  valid `Conversation` — orphaned messages are not permitted.
- **FR-012**: System MUST enforce a foreign key constraint: every `Conversation` references
  a valid user identity.
- **FR-013**: All conversation and message records MUST persist durably — no data loss on
  server restart or process termination.
- **FR-014**: User isolation MUST be enforced at the data layer — queries for one user's
  conversations MUST never return another user's records.
- **FR-015**: System MUST support database indexes on `user_id` (for Conversation queries)
  and `conversation_id` (for Message queries) to ensure performant lookups.

### Key Entities

- **Conversation**: Represents a single chat session between a user and the AI assistant.
  Attributes: unique identifier, user identifier (owner), creation timestamp, last-updated
  timestamp. Relationship: one user → many conversations; one conversation → many messages.

- **Message**: Represents a single turn in a conversation — from either the user or the AI
  assistant. Attributes: unique identifier, parent conversation identifier, user identifier,
  role ("user" | "assistant"), text content, creation timestamp.
  Relationship: one conversation → many messages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new conversation is created and its identifier returned in a single operation —
  0 additional round-trips required from the caller.
- **SC-002**: Full message history for any conversation is retrievable in correct chronological
  order with 100% accuracy — 0 reordering errors or missing messages.
- **SC-003**: After a server process restart, 100% of previously stored conversations and
  messages are recoverable — 0 data loss.
- **SC-004**: User A's data is completely isolated from User B's across all 5 repository
  operations — 0% cross-user data exposure.
- **SC-005**: All 5 repository operations (create conversation, get conversation, list
  conversations, add message, list messages for conversation) succeed on first call under
  normal conditions — 100% operation success rate.
- **SC-006**: Invalid role values and empty message content are rejected at the data layer —
  100% constraint enforcement rate, 0 invalid records stored.
- **SC-007**: Both the `Conversation` and `Message` tables are verified as created and
  functional via database smoke tests before any downstream spec begins implementation.

## Assumptions

- The user's identity (`user_id`) is a string value derived from the JWT system established
  in Spec-1 — no changes to the auth system are required.
- Conversation identifiers are auto-incrementing integers (simpler for client-side reference
  than UUIDs for this use case).
- Message identifiers are auto-incrementing integers.
- No soft-delete — conversations and messages are hard-deleted if ever removed (deletion not
  in scope for this spec).
- Messages are append-only — no editing or deletion of individual messages.
- No conversation-level metadata (title, summary, tags) is required at this stage.
- The `updated_at` field on `Conversation` is updated server-side when a new message is added.
- All repository operations execute synchronously within the request lifecycle.
- Conversation history is returned without pagination — all messages for a conversation
  are returned in a single response (pagination is out of scope).

## Dependencies

- **Spec-1 (001-identity-security)**: Provides the `user_id` string from JWT that `Conversation`
  and `Message` records reference.
- **Spec-2 (002-persistence-domain)**: Provides the Neon PostgreSQL connection layer
  (`DATABASE_URL`, SQLModel session management) that the new models and repository use.

## Scope Boundaries

**In scope:**
- `Conversation` data model definition with all required fields and constraints
- `Message` data model definition with all required fields, constraints, and role validation
- Database table creation (migration) for both `Conversation` and `Message`
- Database indexes on `user_id` (Conversation) and `conversation_id` (Message)
- Repository / service layer with 5 operations:
  `create_conversation`, `get_conversation`, `list_conversations`,
  `add_message`, `get_messages_for_conversation`
- Automatic `updated_at` refresh on `Conversation` when a message is added
- Smoke tests verifying table creation and all 5 repository operations including
  isolation, ordering, and constraint enforcement

**Out of scope:**
- AI agent logic (Spec-6)
- MCP server (Spec-5)
- Chat API endpoint (Spec-6)
- Chat frontend UI (Spec-7)
- Conversation deletion or archiving
- Message editing or deletion
- Conversation title or summary fields
- Message pagination
- Real-time updates or event broadcasting
