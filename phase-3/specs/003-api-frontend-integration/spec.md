# Feature Specification: API & Frontend Integration Layer

**Feature Branch**: `003-api-frontend-integration`
**Created**: 2026-02-19
**Status**: Draft
**Input**: User description: "Phase 2 – Spec 3: API & Frontend Integration Layer — REST API + Next.js frontend integration using Spec-1 (auth) and Spec-2 (persistence) as foundation."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated Task CRUD via API (Priority: P1)

As an authenticated user, I want to create, view, edit, delete, and mark tasks complete through the application so that I can fully manage my todo list.

**Why this priority**: This is the core user-facing feature. Without a working API that the frontend calls, the application has no usable functionality. All other stories depend on this.

**Independent Test**: Use an API client (e.g., curl or Postman) with a valid JWT; perform all 6 operations (list, create, get, update, delete, complete) and verify correct status codes and response bodies.

**Acceptance Scenarios**:

1. **Given** a valid JWT, **When** the user sends GET /api/tasks, **Then** the system returns 200 with a list of only that user's tasks.
2. **Given** a valid JWT and a title, **When** the user sends POST /api/tasks with `{"title": "Buy milk"}`, **Then** the system returns 201 with the created task including its assigned identifier.
3. **Given** a valid JWT and an existing task identifier, **When** the user sends GET /api/tasks/{task_id}, **Then** the system returns 200 with the task's full details.
4. **Given** a valid JWT and an existing task identifier, **When** the user sends PUT /api/tasks/{task_id} with updated fields, **Then** the system returns 200 with the updated task.
5. **Given** a valid JWT and an existing task identifier, **When** the user sends DELETE /api/tasks/{task_id}, **Then** the system returns 204 and the task no longer appears in the list.
6. **Given** a valid JWT and an existing incomplete task, **When** the user sends PATCH /api/tasks/{task_id}/complete, **Then** the task's completion status toggles and the system returns 200.

---

### User Story 2 - Protected Routes with Correct Error Responses (Priority: P1)

As a system integrator, I want all task endpoints to enforce JWT authentication and return consistent, predictable error responses so that clients can handle failures gracefully.

**Why this priority**: Security and predictable contracts are non-negotiable. Unauthenticated or improperly formed requests must be rejected with the correct HTTP status codes.

**Independent Test**: Send requests without a token, with an expired token, with a malformed token, and with a non-UUID task identifier. Verify each returns the correct status code (401, 422).

**Acceptance Scenarios**:

1. **Given** no Authorization header, **When** any task endpoint is called, **Then** the system returns 401 Unauthorized.
2. **Given** an expired or tampered JWT, **When** any task endpoint is called, **Then** the system returns 401 Unauthorized.
3. **Given** a valid JWT but a non-UUID task identifier, **When** a task endpoint is called, **Then** the system returns 422 Unprocessable Entity.
4. **Given** a valid JWT and a valid UUID that does not belong to the authenticated user, **When** any task endpoint is called, **Then** the system returns 404 Not Found (no information leakage about resource existence).
5. **Given** a valid JWT and a request body with an empty or whitespace-only title, **When** POST or PUT is called, **Then** the system returns 422 Unprocessable Entity.

---

### User Story 3 - Frontend Task Management UI (Priority: P1)

As an authenticated user, I want a responsive web interface where I can manage my tasks (add, view, edit, delete, mark complete) without needing to use API tools directly.

**Why this priority**: The web UI is the primary user-facing surface. Without it, the application is not usable by end users. It depends on US1 (working API) being complete.

**Independent Test**: Open the app in a browser, sign in, and perform all 5 todo operations (add, list, edit, delete, complete) through the UI on mobile, tablet, and desktop viewport sizes.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the dashboard, **When** the page loads, **Then** the user sees a list of their tasks (or an empty-state message if none exist).
2. **Given** the task list page, **When** the user submits a new task form with a title, **Then** the task appears in the list without a full page reload.
3. **Given** an existing task in the list, **When** the user clicks the edit control and submits changes, **Then** the task updates immediately in the UI.
4. **Given** an existing task in the list, **When** the user clicks the delete control and confirms, **Then** the task is removed from the list.
5. **Given** an incomplete task in the list, **When** the user clicks the complete control, **Then** the task's visual state changes to reflect completion.
6. **Given** the UI on a mobile device (< 640px), **When** the user performs any operation, **Then** all controls are accessible and the layout is single-column.

---

### User Story 4 - Signup, Login, and Logout Flows (Priority: P2)

As a new or returning user, I want to register, log in, and log out through the web interface so that my session is managed securely without requiring manual token handling.

**Why this priority**: Auth flows are prerequisites for all task operations but are partially implemented by Spec-1. This story covers the frontend-side auth UI and session state wiring.

**Independent Test**: Open the app unauthenticated, register a new account, log in, access the dashboard, then log out and verify the dashboard is inaccessible.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they visit the dashboard, **Then** they are redirected to the sign-in page.
2. **Given** the sign-up form, **When** the user submits valid email and password, **Then** an account is created and the user is redirected to the dashboard.
3. **Given** the sign-in form, **When** the user submits valid credentials, **Then** a session is established and the user is redirected to the dashboard.
4. **Given** the sign-in form, **When** the user submits invalid credentials, **Then** an error message is displayed without redirecting.
5. **Given** an authenticated user, **When** they click logout, **Then** the session is cleared and the user is redirected to the sign-in page.
6. **Given** an authenticated session has expired, **When** the user attempts any task operation, **Then** they are automatically redirected to sign-in.

---

### User Story 5 - Single API Client with Token Attachment (Priority: P2)

As a frontend developer, I want a single centralized API client that automatically attaches the JWT to all requests and handles 401 responses, so that individual components do not need to manage token logic.

**Why this priority**: A centralized client prevents token-handling bugs scattered across components and makes the auth flow consistent. It's foundational to a maintainable frontend.

**Independent Test**: Inspect all task-related fetch calls in the browser network tab and verify every request has `Authorization: Bearer <token>`. Expire a session and verify the client redirects to sign-in.

**Acceptance Scenarios**:

1. **Given** an authenticated session, **When** any task API call is made from the frontend, **Then** the request includes `Authorization: Bearer <token>` as a header.
2. **Given** a request that returns 401, **When** the API client processes the response, **Then** the user is automatically redirected to the sign-in page.
3. **Given** a request that returns an error, **When** the API client processes the response, **Then** a consistent error format is returned to the calling component.
4. **Given** all task-related components, **When** any of them makes an API call, **Then** the call goes through the shared API client (no direct fetch with hardcoded headers elsewhere).

---

### Edge Cases

- What happens when the user submits a task with only whitespace in the title? The system rejects it with 422 (title is treated as empty).
- What happens when two browser tabs are open and a task is deleted in one? The other tab may show stale data until the next list refresh.
- What happens when the network is unavailable? The UI displays a user-friendly error message and does not crash.
- What happens when the user_id in the JWT is not found in the database? The list endpoint returns an empty array (not an error), since the user has no tasks.
- What happens when a task_id is a valid UUID format but does not exist for this user? The system returns 404 (identical response to cross-user access — no existence leakage).
- What happens when the frontend receives a 500 from the backend? The UI shows a generic error message and logs the failure.

## Requirements *(mandatory)*

### Functional Requirements

**API Layer**

- **FR-001**: System MUST expose the following HTTP endpoints: `GET /api/tasks`, `POST /api/tasks`, `GET /api/tasks/{task_id}`, `PUT /api/tasks/{task_id}`, `DELETE /api/tasks/{task_id}`, `PATCH /api/tasks/{task_id}/complete`.
- **FR-002**: System MUST require a valid JWT on all task endpoints, returning 401 if the token is absent, expired, or invalid.
- **FR-003**: System MUST derive the authenticated user's identity exclusively from the verified JWT — never from request body or query parameters.
- **FR-004**: System MUST delegate all data operations to the repository layer from Spec-2 — no direct ORM or SQL queries in route handlers.
- **FR-005**: `POST /api/tasks` MUST return HTTP 201 on successful creation with the full task object in the response body.
- **FR-006**: `DELETE /api/tasks/{task_id}` MUST return HTTP 204 with no response body on successful deletion.
- **FR-007**: `GET /api/tasks` and all single-task endpoints MUST return HTTP 200 with the task data on success.
- **FR-008**: System MUST return 404 for any task operation where the task does not exist for the authenticated user (including cross-user access).
- **FR-009**: `PATCH /api/tasks/{task_id}/complete` MUST toggle the task's completion status (pending → completed → pending).
- **FR-010**: System MUST validate that `task_id` path parameters are valid UUIDs, returning 422 for invalid formats.
- **FR-011**: System MUST reject `title` fields that are empty or contain only whitespace, returning 422.

**Schema Layer**

- **FR-012**: `TaskCreate` schema MUST include `title` (required, non-empty string) and `description` (optional string).
- **FR-013**: `TaskUpdate` schema MUST include all fields optional: `title` (non-empty string if present), `description` (optional string).
- **FR-014**: `TaskRead` response schema MUST include: `id`, `title`, `description`, `status`, `created_at`, `updated_at`, and optionally `user_id`.

**Frontend Layer**

- **FR-015**: Frontend MUST protect the dashboard route — unauthenticated users are redirected to sign-in.
- **FR-016**: Frontend MUST display the authenticated user's task list on the dashboard, with an empty-state message when no tasks exist.
- **FR-017**: Frontend MUST provide UI controls to: add a task, edit a task, delete a task, and toggle task completion.
- **FR-018**: Frontend MUST use a single shared API client module that attaches the JWT to all requests.
- **FR-019**: Frontend API client MUST handle 401 responses by redirecting the user to sign-in.
- **FR-020**: Frontend MUST work correctly on mobile (< 640px), tablet (640px–1024px), and desktop (> 1024px) viewports.
- **FR-021**: Frontend MUST provide sign-up and sign-in pages using Better Auth's client-side methods.
- **FR-022**: Frontend MUST provide a logout mechanism that clears the session and redirects to sign-in.

### Key Entities

- **Task** (read from Spec-2): Represents a unit of work. Attributes exposed to the API: unique identifier (UUID), title, description, status (pending/completed), created timestamp, last-modified timestamp.
- **TaskCreate**: Input shape for creating a task. Fields: `title` (required), `description` (optional).
- **TaskUpdate**: Input shape for editing a task. Fields: `title` (optional), `description` (optional).
- **TaskRead**: Output shape for a task response. Fields: `id`, `title`, `description`, `status`, `created_at`, `updated_at`.
- **API Client** (frontend): A centralized module that handles authentication headers, error normalization, and redirect behavior for all backend calls.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users can complete all 5 core todo operations (add, list, edit, delete, complete) through the UI — 100% operation success rate under normal conditions.
- **SC-002**: All 6 API endpoints reject unauthenticated requests with 401 — 0 endpoints accessible without a valid token.
- **SC-003**: User A cannot access or modify User B's tasks through any API endpoint — 0% cross-user data exposure.
- **SC-004**: API responses use consistent status codes: 201 for create, 200 for reads/updates, 204 for delete, 401 for auth failures, 404 for not-found, 422 for validation failures.
- **SC-005**: The frontend UI is usable on mobile (< 640px) without horizontal scrolling or overlapping controls.
- **SC-006**: All task API calls from the frontend include the JWT in the Authorization header — 0 task requests sent without a token.
- **SC-007**: A 401 response from the backend automatically redirects the user to sign-in — 0 instances where a user sees a broken state after session expiry.
- **SC-008**: The task list loads in under 2 seconds for a user with up to 50 tasks under normal network conditions.
- **SC-009**: 0 instances of ORM/SQL logic in route handler functions — all data access goes through the Spec-2 repository layer.

## Assumptions

- Spec-1 (identity-security) is complete: Better Auth is configured, JWT verification dependency is available for FastAPI routes, and the `user_id` claim is reliably present in verified tokens.
- Spec-2 (persistence-domain) is complete: SQLModel repository methods (create, list, get, update, delete, complete) exist and are tested.
- Task completion is a toggle (pending ↔ completed), not a one-way operation (already defined in Spec-2).
- Cross-user access returns 404 (not 403) to avoid resource existence leakage (already defined in Spec-2).
- The frontend uses client-side fetch (not server components or route handlers) for task API calls, as tokens are managed client-side via Better Auth.
- Better Auth session includes a JWT token that can be retrieved client-side for use in Authorization headers.
- No pagination is required for the task list (all user tasks are returned in a single response).
- No optimistic UI updates are required; the UI re-fetches after mutations.
- The frontend is deployed on Vercel; the backend is deployed as a standalone process (e.g., `uvicorn`).
- `NEXT_PUBLIC_BACKEND_URL` environment variable controls the backend base URL from the frontend.

## Dependencies

- **Spec-1 (001-identity-security)**: Provides the JWT verification FastAPI dependency (`get_current_user`) used on all task routes.
- **Spec-2 (002-persistence-domain)**: Provides the repository layer methods used exclusively by route handlers.
- **Better Auth**: Client-side session and token management for the Next.js frontend.
- **Environment Variables**: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_BACKEND_URL` must be set for the system to function.

## Scope Boundaries

**In scope:**
- 6 FastAPI task endpoints with JWT auth guard and correct status codes
- Pydantic request/response schemas (TaskCreate, TaskUpdate, TaskRead)
- Input validation (empty title, invalid UUID)
- Single API client module in the frontend
- Task list, add, edit, delete, complete UI on the dashboard
- Sign-up, sign-in, logout pages using Better Auth
- Protected dashboard route (redirect to sign-in if unauthenticated)
- Responsive layout for mobile, tablet, desktop
- Environment variable documentation

**Out of scope:**
- Pagination, sorting, or filtering of task lists
- Task priorities, due dates, tags, or sharing
- Additional auth providers (OAuth, SSO)
- Real-time updates (WebSockets, SSE, polling)
- Server-side rendering of task data (client-side fetch only)
- Deployment pipeline or CI/CD setup
- Optimistic UI updates
- Advanced error recovery (retry logic, offline mode)
