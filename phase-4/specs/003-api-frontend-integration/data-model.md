# Data Model: API & Frontend Integration Layer (Spec-3)

**Branch**: `003-api-frontend-integration` | **Date**: 2026-02-19 | **Phase**: Phase 1

## Overview

All models are already implemented in `src/backend/app/models/`. This document records the canonical shapes for the integration contract — what the backend accepts, what it returns, and how the frontend must structure requests.

---

## Persistent Entity: `Todo`

**Table**: `todo` (SQLModel table, PostgreSQL via Neon)
**File**: `src/backend/app/models/todo.py`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `UUID` | PK, auto-generated (uuid4) | Returned as lowercase hyphenated string |
| `title` | `str` | required, max_length=500 | Cannot be empty |
| `description` | `str \| None` | optional, max_length=5000 | Nullable |
| `status` | `str` | default=`"pending"` | Values: `"pending"` or `"completed"` |
| `user_id` | `str` | required, indexed, FK → user | Extracted from JWT; not user-supplied |
| `created_at` | `datetime` | auto, UTC | ISO-8601 in API responses |
| `updated_at` | `datetime` | auto, UTC, updated on write | ISO-8601 in API responses |

**Indexes**: `user_id` (for list queries), implicit PK on `id`.

---

## Request Schemas (Pydantic)

**File**: `src/backend/app/models/schemas.py`

### `TodoCreate` — used by `POST /api/todos`

```python
class TodoCreate(BaseModel):
    title: str           # required, validated max 500 chars in model
    description: str | None = None   # optional, max 5000 chars
```

**Frontend sends**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"   // optional
}
```

### `TodoUpdate` — used by `PATCH /api/todos/{todo_id}`

```python
class TodoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
```

All fields optional. At least one should be non-null for a meaningful update (validated at service layer).

**Frontend sends** (examples):
```json
{ "title": "Updated title" }                          // title only
{ "description": "New description" }                  // description only
{ "title": "New title", "description": "New desc" }   // both
```

---

## Response Schema

### `TodoResponse` — returned by all todo endpoints

```python
class TodoResponse(BaseModel):
    id: str
    title: str
    description: str | None
    status: str          # "pending" | "completed"
    user_id: str
    created_at: datetime
    updated_at: datetime
```

**Backend returns**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending",
  "user_id": "user_abc123",
  "created_at": "2026-02-19T10:30:00Z",
  "updated_at": "2026-02-19T10:30:00Z"
}
```

**List endpoint** returns an array: `TodoResponse[]`

---

## Auth Entity: `User`

**Managed by**: Better Auth
**Table**: `user` (created and managed by Better Auth migrations)

| Field | Type | Notes |
|-------|------|-------|
| `id` | `str` | Used as `user_id` foreign key in `Todo` |
| `email` | `str` | Unique, used for login |
| `password` (hashed) | `str` | bcrypt; never exposed in responses |

The `user_id` in a JWT claim corresponds to the `id` field in the Better Auth `user` table.

---

## JWT Payload

Issued by Better Auth on sign-in. The FastAPI `get_current_user` dependency extracts `user_id` from the token.

```json
{
  "sub": "<user_id>",
  "email": "user@example.com",
  "iat": 1708336200,
  "exp": 1708422600
}
```

The `sub` claim is used as `user_id` throughout the backend service layer.

---

## Frontend API Client Types

**File**: `src/frontend/src/lib/api.ts`

The frontend uses these TypeScript interfaces (derived from `TodoResponse`):

```typescript
interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "completed";
  user_id: string;
  created_at: string;   // ISO-8601 string
  updated_at: string;
}

interface CreateTodoPayload {
  title: string;
  description?: string;
}

interface UpdateTodoPayload {
  title?: string;
  description?: string;
}
```

---

## Data Flow Summary

```
User action (browser)
  → Frontend component (app/dashboard/page.tsx)
    → api.ts ApiClient method (get/post/patch/delete)
      → HTTP request with Authorization: Bearer <JWT>
        → FastAPI route (routes/todos.py)
          → get_current_user dependency validates JWT → extracts user_id
            → todo_service.py method (with user_id for isolation)
              → SQLModel session query to Neon PostgreSQL
                → TodoResponse returned up the chain
```
