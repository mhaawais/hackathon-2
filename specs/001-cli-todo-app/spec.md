# Feature Specification: Phase I — In-Memory Python Console Todo App

**Feature Branch**: `001-cli-todo-app`
**Created**: 2026-02-08
**Status**: Draft
**Input**: User description: "Phase I — In-Memory Python Console Todo App with five core operations: add, list, update, complete, delete"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a New Task (Priority: P1)

As a user, I want to add a new task with a title and optional description so that I can track things I need to do.

**Why this priority**: Adding tasks is the foundational operation — without it, no other operation is meaningful. This is the minimum viable slice.

**Independent Test**: Can be fully tested by running the add command and verifying the task appears in the list with correct ID, title, description, and "pending" status.

**Acceptance Scenarios**:

1. **Given** the app is running with no tasks, **When** I add a task with title "Buy groceries", **Then** a task is created with ID 1, title "Buy groceries", no description, and status "pending", and a confirmation message is displayed.
2. **Given** the app has one task (ID 1), **When** I add a task with title "Read book" and description "Chapter 5", **Then** a task is created with ID 2, title "Read book", description "Chapter 5", and status "pending".
3. **Given** the app is running, **When** I try to add a task with an empty title, **Then** an error message is displayed stating that a title is required, and no task is created.
4. **Given** the app is running, **When** I try to add a task with a whitespace-only title, **Then** an error message is displayed stating that a title is required, and no task is created.

---

### User Story 2 - List All Tasks (Priority: P1)

As a user, I want to list all tasks so that I can see everything I need to do at a glance.

**Why this priority**: Listing is essential to verify any operation and provides immediate feedback to the user. Tied with Add as the core read operation.

**Independent Test**: Can be tested by adding several tasks and running the list command to verify all tasks appear with correct fields.

**Acceptance Scenarios**:

1. **Given** no tasks exist, **When** I list tasks, **Then** a message is displayed indicating there are no tasks.
2. **Given** three tasks exist with mixed statuses (pending and completed), **When** I list all tasks, **Then** all three tasks are displayed with their ID, title, description, and status.
3. **Given** three tasks exist (two pending, one completed), **When** I list tasks filtered by status "pending", **Then** only the two pending tasks are displayed.
4. **Given** three tasks exist (two pending, one completed), **When** I list tasks filtered by status "completed", **Then** only the one completed task is displayed.

---

### User Story 3 - Complete a Task (Priority: P2)

As a user, I want to mark a task as completed so that I can track my progress.

**Why this priority**: Completing tasks is the primary workflow outcome — users add tasks to eventually complete them.

**Independent Test**: Can be tested by adding a task, completing it by ID, and verifying its status changes to "completed".

**Acceptance Scenarios**:

1. **Given** a pending task with ID 1 exists, **When** I complete task 1, **Then** the task status changes to "completed" and a confirmation message is displayed.
2. **Given** no task with ID 99 exists, **When** I try to complete task 99, **Then** an error message is displayed stating the task was not found.
3. **Given** a task with ID 1 is already completed, **When** I try to complete task 1 again, **Then** an error message is displayed stating the task is already completed.

---

### User Story 4 - Update a Task (Priority: P2)

As a user, I want to update the title or description of an existing task so that I can correct mistakes or add details.

**Why this priority**: Updates allow refinement of tasks after creation, supporting the natural workflow of clarifying work items.

**Independent Test**: Can be tested by adding a task, updating its title and/or description, and verifying the changes persist in the list.

**Acceptance Scenarios**:

1. **Given** a task with ID 1 exists with title "Buy groceries", **When** I update task 1 with new title "Buy organic groceries", **Then** the title is updated and a confirmation message is displayed.
2. **Given** a task with ID 1 exists with no description, **When** I update task 1 with description "From the farmers market", **Then** the description is added and a confirmation message is displayed.
3. **Given** a task with ID 1 exists, **When** I update task 1 with both a new title and new description, **Then** both fields are updated.
4. **Given** no task with ID 99 exists, **When** I try to update task 99, **Then** an error message is displayed stating the task was not found.
5. **Given** a task with ID 1 exists, **When** I try to update task 1 without providing any new values, **Then** an error message is displayed stating that at least a title or description must be provided.

---

### User Story 5 - Delete a Task (Priority: P3)

As a user, I want to delete a task so that I can remove items I no longer need.

**Why this priority**: Deletion is a housekeeping operation. The core workflow (add, list, complete) functions without it, but it completes the CRUD story.

**Independent Test**: Can be tested by adding a task, deleting it by ID, and verifying it no longer appears in the list.

**Acceptance Scenarios**:

1. **Given** a task with ID 1 exists, **When** I delete task 1, **Then** the task is removed and a confirmation message is displayed.
2. **Given** no task with ID 99 exists, **When** I try to delete task 99, **Then** an error message is displayed stating the task was not found.
3. **Given** a task with ID 1 is deleted, **When** I list all tasks, **Then** task 1 does not appear.
4. **Given** a task with ID 1 is deleted, **When** I add a new task, **Then** the new task gets ID 2 (IDs are never reused within a session).

---

### Edge Cases

- What happens when the user enters a non-numeric ID? An error message is displayed stating that the ID must be a positive integer.
- What happens when the user enters a negative ID or zero? An error message is displayed stating that the ID must be a positive integer.
- What happens when the user provides an unknown command? A help message is displayed listing all available commands.
- What happens when the user enters an extremely long title (>200 characters)? The title is accepted (no artificial length limit for Phase I).
- What happens when the user enters a title with special characters? The title is accepted as-is.
- How does the system handle Ctrl+C or EOF? The application exits gracefully with a goodbye message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support adding a task with a required title and optional description.
- **FR-002**: System MUST assign auto-incrementing integer IDs to tasks starting from 1, never reusing IDs within a session.
- **FR-003**: System MUST set newly created tasks to "pending" status by default.
- **FR-004**: System MUST support listing all tasks, displaying ID, title, description, and status for each.
- **FR-005**: System MUST support filtering the task list by status ("pending" or "completed").
- **FR-006**: System MUST support updating a task's title and/or description by ID.
- **FR-007**: System MUST support marking a task as "completed" by ID.
- **FR-008**: System MUST support deleting a task by ID.
- **FR-009**: System MUST validate that task IDs are positive integers and display a clear error for invalid IDs.
- **FR-010**: System MUST validate that task titles are non-empty and non-whitespace-only.
- **FR-011**: System MUST display a helpful error message when a referenced task ID does not exist.
- **FR-012**: System MUST display a helpful error message when attempting to complete an already-completed task.
- **FR-013**: System MUST display a help message listing available commands when an unknown command is entered.
- **FR-014**: System MUST store all data in-memory only (no file or database persistence).
- **FR-015**: System MUST exit gracefully on Ctrl+C or EOF with a goodbye message.

### Key Entities

- **Task**: Represents a single todo item. Key attributes: unique integer ID (auto-incremented), title (non-empty string), description (optional string, can be empty/null), status ("pending" or "completed"), created timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add, list, update, complete, and delete tasks without encountering crashes or unhandled exceptions.
- **SC-002**: Users can set up and run the application in under 2 minutes following the README instructions.
- **SC-003**: 100% of invalid inputs (empty titles, non-existent IDs, non-numeric IDs) produce clear, helpful error messages rather than crashes or stack traces.
- **SC-004**: Task IDs are deterministic and sequential — the Nth task created in a session always receives ID N, regardless of deletions.
- **SC-005**: Users can complete the full demo flow (add 3 tasks, list, complete 1, list filtered, update 1, delete 1, list) in under 90 seconds.

## Assumptions

- Single-user, single-session application (no concurrency).
- No data persistence between sessions (in-memory only by design).
- Python 3.10+ is available on the target machine.
- No third-party dependencies required (standard library only).
- The CLI operates as an interactive REPL (read-eval-print loop) rather than single-shot commands.
