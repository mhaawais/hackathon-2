# API Contract: Todo Endpoints

**Branch**: `001-identity-security` | **Date**: 2026-02-17
**Owner**: FastAPI backend
**Base URL**: `{BACKEND_URL}/api`

All endpoints require `Authorization: Bearer <jwt>` header unless noted.

---

## GET /api/health

**Purpose**: Health check (unprotected)
**Auth**: None

**Response 200**:
```json
{
  "status": "ok"
}
```

---

## POST /api/todos

**Purpose**: Create a new todo for the authenticated user
**Auth**: Required (Bearer JWT)
**FR Coverage**: FR-006, FR-007, FR-008, FR-012

**Request**:
```json
{
  "title": "string (required, non-empty)",
  "description": "string | null (optional)"
}
```

**Response 201** (created):
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "pending",
  "user_id": "string",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

**Response 401** (no/invalid/expired token — FR-008):
```json
{
  "detail": "Authentication required"
}
```

**Response 422** (validation error):
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

## GET /api/todos

**Purpose**: List all todos for the authenticated user
**Auth**: Required (Bearer JWT)
**FR Coverage**: FR-006, FR-007, FR-009 (user isolation)

**Query Parameters**:
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| status | string | No | `pending`, `completed` |

**Response 200**:
```json
[
  {
    "id": "uuid",
    "title": "string",
    "description": "string | null",
    "status": "pending",
    "user_id": "string",
    "created_at": "ISO-8601",
    "updated_at": "ISO-8601"
  }
]
```

**Response 200** (empty — user has no todos):
```json
[]
```

**Response 401** (no/invalid/expired token):
```json
{
  "detail": "Authentication required"
}
```

---

## PATCH /api/todos/{id}

**Purpose**: Update title and/or description of a todo
**Auth**: Required (Bearer JWT)
**FR Coverage**: FR-007, FR-009 (ownership check)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Todo identifier |

**Request**:
```json
{
  "title": "string | null (optional)",
  "description": "string | null (optional)"
}
```

**Response 200** (updated):
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "string",
  "user_id": "string",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

**Response 401** (no/invalid/expired token):
```json
{
  "detail": "Authentication required"
}
```

**Response 403** (todo belongs to another user — FR-009):
```json
{
  "detail": "Access denied"
}
```

**Response 404** (todo not found):
```json
{
  "detail": "Todo not found"
}
```

---

## PATCH /api/todos/{id}/complete

**Purpose**: Mark a todo as completed
**Auth**: Required (Bearer JWT)
**FR Coverage**: FR-007, FR-009 (ownership check)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Todo identifier |

**Response 200** (completed):
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "status": "completed",
  "user_id": "string",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

**Response 401** (no/invalid/expired token):
```json
{
  "detail": "Authentication required"
}
```

**Response 403** (todo belongs to another user):
```json
{
  "detail": "Access denied"
}
```

**Response 404** (todo not found):
```json
{
  "detail": "Todo not found"
}
```

---

## DELETE /api/todos/{id}

**Purpose**: Delete a todo
**Auth**: Required (Bearer JWT)
**FR Coverage**: FR-007, FR-009 (ownership check)

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Todo identifier |

**Response 204** (deleted — no body)

**Response 401** (no/invalid/expired token):
```json
{
  "detail": "Authentication required"
}
```

**Response 403** (todo belongs to another user):
```json
{
  "detail": "Access denied"
}
```

**Response 404** (todo not found):
```json
{
  "detail": "Todo not found"
}
```

---

## Error Response Schema

All error responses follow this format:

```json
{
  "detail": "string"
}
```

### Status Code Taxonomy

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful read/update |
| 201 | Created | Successful creation |
| 204 | No Content | Successful deletion |
| 401 | Unauthorized | Missing, expired, malformed, or invalid JWT (FR-008) |
| 403 | Forbidden | Authenticated but accessing another user's resource (FR-009) |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable Entity | Request body validation failure |
