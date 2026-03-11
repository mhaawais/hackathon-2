# API Endpoint Contracts: Spec-3

**Branch**: `003-api-frontend-integration` | **Date**: 2026-02-19

All endpoints require `Authorization: Bearer <JWT>` unless marked as public.
Base URL (local): `http://localhost:8000`

---

## Auth Endpoints (managed by Better Auth)

These endpoints are handled entirely by Better Auth and are not in `routes/todos.py`.

### `POST /api/auth/sign-up/email` — Register new user

**Auth**: Public (no JWT required)

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response 200**:
```json
{
  "user": { "id": "...", "email": "user@example.com", "name": "John Doe" },
  "session": { "token": "<jwt>", "expiresAt": "..." }
}
```

**Errors**:
| Status | Condition |
|--------|-----------|
| 422 | Missing required fields |
| 409 | Email already registered |

---

### `POST /api/auth/sign-in/email` — Authenticate user

**Auth**: Public (no JWT required)

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response 200**:
```json
{
  "user": { "id": "...", "email": "user@example.com", "name": "John Doe" },
  "session": { "token": "<jwt>", "expiresAt": "..." }
}
```

**Errors**:
| Status | Condition |
|--------|-----------|
| 401 | Invalid credentials |
| 422 | Missing required fields |

---

## Todo Endpoints

All todo endpoints require `Authorization: Bearer <JWT>`.

### `POST /api/todos` — Create a new todo

**Auth**: JWT required

**Request body** (`TodoCreate`):
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```
- `title`: string, **required**, max 500 characters
- `description`: string, optional, max 5000 characters

**Response 201** (`TodoResponse`):
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

**Errors**:
| Status | Condition |
|--------|-----------|
| 401 | Missing, invalid, or expired JWT |
| 422 | Missing `title` or field validation failure |

---

### `GET /api/todos` — List todos for current user

**Auth**: JWT required

**Query parameters**:
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status_filter` | `"pending" \| "completed"` | none | Filter by status (omit for all) |

**Example**: `GET /api/todos?status_filter=pending`

**Response 200** (`TodoResponse[]`):
```json
[
  {
    "id": "...",
    "title": "Buy groceries",
    "description": null,
    "status": "pending",
    "user_id": "user_abc123",
    "created_at": "2026-02-19T10:30:00Z",
    "updated_at": "2026-02-19T10:30:00Z"
  }
]
```

Empty list `[]` when no todos match. Never returns 404.

**Errors**:
| Status | Condition |
|--------|-----------|
| 401 | Missing, invalid, or expired JWT |

---

### `GET /api/todos/{todo_id}` — Fetch single todo *(gap: not yet implemented)*

**Auth**: JWT required

**Path parameter**: `todo_id` — UUID string

**Response 200** (`TodoResponse`):
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

**Errors**:
| Status | Condition |
|--------|-----------|
| 401 | Missing, invalid, or expired JWT |
| 404 | Todo not found or belongs to a different user |

---

### `PATCH /api/todos/{todo_id}` — Update todo title/description

**Auth**: JWT required

**Path parameter**: `todo_id` — UUID string

**Request body** (`TodoUpdate`):
```json
{
  "title": "Updated title",
  "description": "Updated description"
}
```
All fields optional. Send only the fields to change.

**Response 200** (`TodoResponse`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Updated title",
  "description": "Updated description",
  "status": "pending",
  "user_id": "user_abc123",
  "created_at": "2026-02-19T10:30:00Z",
  "updated_at": "2026-02-19T10:35:00Z"
}
```

**Errors**:
| Status | Condition |
|--------|-----------|
| 401 | Missing, invalid, or expired JWT |
| 403 | Todo belongs to a different user |
| 404 | Todo not found |
| 422 | Field validation failure (e.g., title too long) |

---

### `PATCH /api/todos/{todo_id}/complete` — Toggle completion status

**Auth**: JWT required

**Path parameter**: `todo_id` — UUID string

**Request body**: None (empty body)

**Response 200** (`TodoResponse`):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "description": null,
  "status": "completed",
  "user_id": "user_abc123",
  "created_at": "2026-02-19T10:30:00Z",
  "updated_at": "2026-02-19T10:40:00Z"
}
```

Status toggles: `"pending"` → `"completed"` → `"pending"` on successive calls.

**Errors**:
| Status | Condition |
|--------|-----------|
| 401 | Missing, invalid, or expired JWT |
| 403 | Todo belongs to a different user |
| 404 | Todo not found |

---

### `DELETE /api/todos/{todo_id}` — Delete a todo

**Auth**: JWT required

**Path parameter**: `todo_id` — UUID string

**Response**: `204 No Content` (empty body)

**Errors**:
| Status | Condition |
|--------|-----------|
| 401 | Missing, invalid, or expired JWT |
| 403 | Todo belongs to a different user |
| 404 | Todo not found |

---

## Error Response Format

All error responses follow FastAPI's default error format:

```json
{
  "detail": "Human-readable error message"
}
```

Validation errors (422) return:
```json
{
  "detail": [
    {
      "loc": ["body", "title"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## Frontend API Client Mapping

**File**: `src/frontend/src/lib/api.ts`

| HTTP | Endpoint | `api.ts` method |
|------|----------|-----------------|
| POST | `/api/todos` | `api.post('/api/todos', payload)` |
| GET | `/api/todos` | `api.get('/api/todos')` |
| GET | `/api/todos/{id}` | `api.get('/api/todos/{id}')` *(after gap fix)* |
| PATCH | `/api/todos/{id}` | `api.patch('/api/todos/{id}', payload)` |
| PATCH | `/api/todos/{id}/complete` | `api.patch('/api/todos/{id}/complete')` |
| DELETE | `/api/todos/{id}` | `api.delete('/api/todos/{id}')` |
