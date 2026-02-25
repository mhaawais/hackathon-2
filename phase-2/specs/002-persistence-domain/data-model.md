# Data Model: Persistence & Domain Layer

**Branch**: `002-persistence-domain` | **Date**: 2026-02-18

## Entity: Todo

**Table name**: `todo`

| Field | Type | Constraints | Default | Notes |
|-------|------|------------|---------|-------|
| `id` | UUID | PK, NOT NULL, UNIQUE | `uuid4()` | Auto-generated on creation |
| `user_id` | String | NOT NULL, INDEXED | — | From verified JWT `sub` claim |
| `title` | String(500) | NOT NULL | — | Max 500 characters |
| `description` | String(5000) | NULLABLE | `None` | Max 5,000 characters |
| `status` | String | NOT NULL | `"pending"` | Values: "pending", "completed" |
| `created_at` | DateTime (UTC) | NOT NULL | `now(utc)` | Set once on creation |
| `updated_at` | DateTime (UTC) | NOT NULL | `now(utc)` | Updated on every modification |

### Indexes

| Name | Columns | Type | Rationale |
|------|---------|------|-----------|
| `ix_todo_user_id` | `user_id` | B-tree | All queries filter by user; avoids full table scans |

### Constraints

- **PK**: `id` (UUID, auto-generated)
- **NOT NULL**: `id`, `user_id`, `title`, `status`, `created_at`, `updated_at`
- **INDEX**: `user_id` (B-tree, for all user-scoped queries)

### State Transitions

```
Created → status: "pending"
         ↓ (toggle)
Completed → status: "completed"
         ↓ (toggle)
Pending → status: "pending"
```

## Entity: User (External — Not Managed)

The User entity is managed by Better Auth (Spec-1). The persistence layer only references users via `user_id` (string from JWT `sub` claim). No foreign key constraint to a `user` table is enforced since Better Auth manages its own user storage.

## Relationships

```
User (1) ──── (N) Todo
  │                 │
  └─ user_id ───────┘
     (string, indexed)
```

- One user has many todos
- Each todo belongs to exactly one user
- Relationship enforced at query level (WHERE user_id = ?)
- No ORM-level relationship defined (User not a SQLModel table)

## Repository Interface

All methods enforce user isolation via `user_id` parameter:

| Method | Signature | Returns | Error |
|--------|-----------|---------|-------|
| `create_todo` | `(session, user_id, data)` | `Todo` | — |
| `list_todos` | `(session, user_id, status_filter?)` | `list[Todo]` | — |
| `get_todo` | `(session, todo_id, user_id)` | `Todo` | 404 if not found or not owned |
| `update_todo` | `(session, todo_id, user_id, data)` | `Todo` | 404 if not found or not owned |
| `complete_todo` | `(session, todo_id, user_id)` | `Todo` | 404 if not found or not owned |
| `delete_todo` | `(session, todo_id, user_id)` | `None` | 404 if not found or not owned |
