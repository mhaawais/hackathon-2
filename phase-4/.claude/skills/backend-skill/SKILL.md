---
name: backend-skill
description: Build backend services by generating API routes, handling requests and responses, and connecting application logic to the database. Use for REST or API-first backends.
---

# Backend Skill – Routes, Requests, Responses, DB Integration

## Scope
This skill is responsible for implementing the backend application layer:
- API route design (REST-first)
- Request validation and response shaping
- Business logic orchestration
- Database integration via repositories/ORM
- Error handling and status codes
- Security, auth guards, and middleware hooks

## Instructions

### 1. API Design
- Define clear, resource-oriented routes.
- Use consistent naming and HTTP verbs:
  - GET (read)
  - POST (create)
  - PUT/PATCH (update)
  - DELETE (remove)
- Avoid overloading endpoints; prefer clarity over cleverness.
- Version APIs when appropriate (`/api/v1/...`).

### 2. Request Handling
- Validate all inputs (query, params, body).
- Reject invalid or missing data early with meaningful errors.
- Parse and normalize incoming data before business logic.
- Never trust client input.

### 3. Response Handling
- Return structured, predictable JSON responses.
- Use proper HTTP status codes:
  - 200/201 for success
  - 400 for bad input
  - 401/403 for auth errors
  - 404 for missing resources
  - 500 for unexpected failures
- Do not leak internal errors or stack traces.

### 4. Business Logic Layer
- Keep controllers thin; move logic into services/use-cases.
- Orchestrate workflows (e.g., create → validate → persist → respond).
- Ensure business rules are centralized and testable.
- Avoid direct DB access from route handlers when possible.

### 5. Database Integration
- Connect routes to the database via repositories or ORM models.
- Use transactions for multi-step operations.
- Handle “not found” and conflict cases explicitly.
- Ensure DB errors are translated into safe API responses.

### 6. Auth & Middleware Hooks
- Integrate authentication guards (JWT, session, etc.).
- Protect private routes.
- Attach authenticated user context to requests.
- Apply middleware for logging, rate limiting, and CORS where required.

### 7. Error Handling
- Implement centralized error handling.
- Normalize error responses.
- Log errors with context (request id, user id if safe).
- Fail securely and predictably.

### 8. Documentation & Verification
- Document each endpoint (purpose, inputs, outputs).
- Provide example requests and responses.
- Add basic API smoke tests or curl examples.
- Verify routes end-to-end with the database connected.

## Best Practices
- Keep routes predictable and boring.
- Separate concerns: routing ≠ business logic ≠ data access.
- Use dependency injection where possible.
- Avoid “fat controllers.”
- Prefer explicitness over magic.

## Outputs
When this skill is used, it should produce:
- API route definitions
- Controllers/handlers
- Service/use-case layer
- DB integration code
- Middleware (auth, validation, error handling)
- Updated API documentation or README

## Example API Structure
```http
GET    /api/tasks
POST   /api/tasks
GET    /api/tasks/{id}
PUT    /api/tasks/{id}
DELETE /api/tasks/{id}
