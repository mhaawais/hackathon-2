# Feature Specification: Persistence & Domain Layer

**Feature Branch**: `002-persistence-domain`
**Created**: 2026-02-18
**Status**: Draft
**Input**: User description: "Implement persistent multi-user task storage with strict user isolation and production-ready structure."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Task Data Persists Across Sessions (Priority: P1)

As an authenticated user, I want my tasks to be saved permanently so that when I close the browser or the server restarts, all my tasks are still available when I return.

**Why this priority**: Without persistence, the application has no lasting value. This is the foundational capability that makes the todo system usable.

**Independent Test**: Create a task, restart the server, log back in, and verify the task still appears in the task list.

**Acceptance Scenarios**:

1. **Given** an authenticated user has created 3 tasks, **When** the server is restarted and the user logs back in, **Then** all 3 tasks appear in their task list with correct titles, descriptions, and completion status.
2. **Given** a user marks a task as completed, **When** the server restarts, **Then** the task still shows as completed after the user logs back in.
3. **Given** a user updates a task's title, **When** the user refreshes the page, **Then** the updated title is displayed.

---

### User Story 2 - Strict User Isolation (Priority: P1)

As an authenticated user, I want to see only my own tasks and never have access to another user's tasks, ensuring my data is private and secure.

**Why this priority**: Multi-user isolation is a security requirement. Without it, users could see or modify other users' data, which is a critical privacy violation.

**Independent Test**: Create tasks as User A, log in as User B, and verify User B cannot see, modify, or delete User A's tasks.

**Acceptance Scenarios**:

1. **Given** User A has created 5 tasks and User B has created 3 tasks, **When** User A lists their tasks, **Then** only User A's 5 tasks are returned.
2. **Given** User A owns a task, **When** User B attempts to view that task by its identifier, **Then** the system responds as if the task does not exist (not found).
3. **Given** User A owns a task, **When** User B attempts to update, complete, or delete that task, **Then** the system rejects the request as not found.
4. **Given** a new user signs up and logs in, **When** they list their tasks, **Then** they see an empty list (not another user's tasks).

---

### User Story 3 - Reliable Task Lifecycle Operations (Priority: P2)

As an authenticated user, I want to create, read, update, delete, and complete tasks with confidence that each operation is accurately reflected in the persisted data.

**Why this priority**: Core CRUD operations are essential for a functional todo system, but depend on persistence (P1) being in place first.

**Independent Test**: Perform each operation (create, list, get, update, delete, complete) and verify the data layer correctly persists and returns the expected state.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they create a task with a title and description, **Then** the task is assigned a unique identifier, associated with the user, and retrievable by that identifier.
2. **Given** a task exists, **When** the user updates its title, **Then** the task's last-modified timestamp is automatically updated.
3. **Given** a task exists, **When** the user deletes it, **Then** it is permanently removed and no longer appears in their task list.
4. **Given** an incomplete task, **When** the user marks it as completed, **Then** the task's completion status changes to true and the change is persisted.

---

### User Story 4 - Data Integrity Under Edge Conditions (Priority: P3)

As a system operator, I want the data layer to enforce integrity constraints so that invalid or corrupt data cannot enter the system, even if the application layer has bugs.

**Why this priority**: Database-level constraints are a safety net. While application validation handles most cases, DB constraints prevent data corruption at the source.

**Independent Test**: Attempt to insert invalid data (missing required fields, duplicate IDs) directly and verify the database rejects it.

**Acceptance Scenarios**:

1. **Given** a task creation request with no title, **When** the system attempts to persist it, **Then** the operation fails with a clear error.
2. **Given** a task creation request with no user association, **When** the system attempts to persist it, **Then** the operation fails due to the required user ownership constraint.
3. **Given** two tasks, **When** each is created, **Then** each receives a globally unique identifier that never collides.

---

### Edge Cases

- What happens when a user tries to access a task that has been deleted? System returns "not found."
- What happens when the database connection is temporarily unavailable? The system returns an appropriate error rather than crashing or returning stale data.
- What happens when a user creates a task with a very long title (e.g., 10,000 characters)? The system either enforces a reasonable maximum or stores it without corruption.
- What happens when two users simultaneously create tasks? Both tasks are persisted without conflict due to unique identifiers.
- What happens when a task's updated-at timestamp is checked after creation but before any updates? It reflects the creation time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST permanently store all task data so that it survives application restarts.
- **FR-002**: System MUST associate every task with exactly one user via a required, non-empty user ownership field.
- **FR-003**: System MUST assign each task a globally unique identifier upon creation.
- **FR-004**: System MUST support creating a task with a required title and an optional description.
- **FR-005**: System MUST default new tasks to an incomplete status.
- **FR-006**: System MUST automatically record the creation timestamp when a task is created.
- **FR-007**: System MUST automatically update the last-modified timestamp whenever a task is changed.
- **FR-008**: System MUST filter all task queries by the authenticated user, ensuring no cross-user data exposure.
- **FR-009**: System MUST return a "not found" response when a user attempts to access another user's task (not "forbidden," to avoid leaking existence).
- **FR-010**: System MUST provide reusable data access methods for: create, list, get-by-id, update, delete, and mark-complete.
- **FR-011**: System MUST enforce data integrity constraints (required fields, unique identifiers) at the storage level, not just application level.
- **FR-012**: System MUST connect to the database using an environment-driven connection string with no hardcoded credentials.
- **FR-013**: System MUST scope database sessions to individual requests to prevent session leakage.
- **FR-014**: System MUST maintain an index on user ownership field for query performance.
- **FR-015**: System MUST ensure schema creation is reproducible and automated (no manual table creation).

### Key Entities

- **Task**: Represents a unit of work belonging to a user. Key attributes: unique identifier, owner (user reference), title, description, completion status, creation timestamp, last-modified timestamp.
- **User** (external dependency): Represents an authenticated individual. Identified by a unique identifier provided by the authentication system (Spec-1). The persistence layer does not manage users directly but references them via their identifier.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All task data created by a user is retrievable after an application restart with 100% fidelity (no data loss, no field corruption).
- **SC-002**: User A cannot access any of User B's tasks under any operation (create, list, get, update, delete, complete) — 0% cross-user data leakage.
- **SC-003**: Task listing for a user with 100 tasks returns results in under 1 second.
- **SC-004**: All data access operations are performed through a reusable, modular layer — 0 instances of direct data queries in request handlers.
- **SC-005**: The system enforces required field constraints at the storage level — attempts to store a task without a title or user ownership are rejected 100% of the time.
- **SC-006**: Every task modification correctly updates the last-modified timestamp — verified across all update and complete operations.
- **SC-007**: The database schema can be recreated from scratch on a clean environment using only automated tooling (no manual steps).

## Assumptions

- The authentication system (Spec-1, identity-security) is already implemented and provides a verified user identifier for each request.
- The user identifier from the authentication system is a string-based unique identifier (compatible with UUID storage).
- The database service (Neon Serverless Postgres) is externally provisioned and accessible via a connection string in environment configuration.
- Task title maximum length is 500 characters (reasonable default for a todo title).
- Task description maximum length is 5,000 characters (reasonable default for a todo description).
- Soft-delete is not required; delete operations permanently remove the task record.
- The "complete" operation is a toggle (can mark complete and incomplete) rather than one-way.

## Dependencies

- **Spec-1 (identity-security)**: Provides JWT-based authentication and the verified `user_id` used to scope all data operations.
- **Neon Serverless Postgres**: External database service, assumed to be provisioned and accessible.
- **Environment Configuration**: `DATABASE_URL` must be set in the environment for the system to connect.

## Scope Boundaries

**In scope:**
- Task data model and storage schema
- Database connection configuration
- Data access / repository layer with all CRUD + complete operations
- User isolation enforcement at the data query level
- Schema creation / migration automation
- Indexes for query performance

**Out of scope:**
- API route / endpoint implementation (separate spec)
- Request/response validation schemas (separate spec)
- Frontend integration
- Pagination, sorting, or advanced filtering
- Recurring tasks, priorities, due dates, tags, or sharing
- User table management (handled by auth system)
