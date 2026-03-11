# Data Model: Identity & Security Layer

**Branch**: `001-identity-security` | **Date**: 2026-02-17

## Entities

### User (managed by Better Auth — DO NOT create manually)

Created via `npx @better-auth/cli migrate`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | text | PRIMARY KEY | Better Auth uses text, not UUID |
| name | text | NOT NULL | |
| email | text | NOT NULL, UNIQUE | |
| emailVerified | boolean | NOT NULL, DEFAULT false | |
| image | text | NULLABLE | |
| createdAt | timestamptz | NOT NULL | |
| updatedAt | timestamptz | NOT NULL | |

### Session (managed by Better Auth)

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PRIMARY KEY |
| expiresAt | timestamptz | NOT NULL |
| token | text | NOT NULL, UNIQUE |
| createdAt | timestamptz | NOT NULL |
| updatedAt | timestamptz | NOT NULL |
| ipAddress | text | NULLABLE |
| userAgent | text | NULLABLE |
| userId | text | NOT NULL, FK → user.id |

### Account (managed by Better Auth)

| Column | Type | Constraints |
|--------|------|-------------|
| id | text | PRIMARY KEY |
| accountId | text | NOT NULL |
| providerId | text | NOT NULL |
| userId | text | NOT NULL, FK → user.id |
| password | text | NULLABLE (bcrypt hashed) |

### Todo (managed by SQLModel)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PRIMARY KEY, DEFAULT uuid4() | Constitution IX: UUID PKs |
| title | text | NOT NULL | Required field |
| description | text | NULLABLE | Optional |
| status | text | NOT NULL, DEFAULT 'pending' | Values: 'pending', 'completed' |
| user_id | text | NOT NULL, FK → user.id, INDEX | Links to Better Auth user |
| created_at | timestamptz | NOT NULL, DEFAULT now() | Constitution IX |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | Constitution IX |

**Index**: `idx_todo_user_id` on `user_id` (Constitution IX requirement).

## Relationships

```
user (1) ──── (N) todo
  │
  ├──── (N) session
  └──── (N) account
```

- One user has many todos (ownership)
- One user has many sessions (Better Auth managed)
- One user has many accounts (Better Auth managed — email/password is one account)

## Validation Rules

From spec functional requirements:

| Field | Rule | Source |
|-------|------|--------|
| user.email | Must be unique | FR-002 |
| user.email | Must be valid email format | FR-001 |
| account.password | Must be bcrypt hashed | FR-003 |
| todo.title | Must not be empty | Spec: "title (required)" |
| todo.status | Must be 'pending' or 'completed' | Phase 1 model |
| todo.user_id | Must reference existing user | FK constraint |

## State Transitions

```
Todo.status: pending → completed (via PATCH /todos/{id}/complete)
```

No reverse transition (complete → pending) unless explicitly requested. The spec says "toggle or one-way" — defaulting to one-way for simplicity.

## Type Compatibility Note

Better Auth uses `text` for `user.id`, not UUID. The `todo.user_id` column MUST be `text` to match the foreign key reference. Only `todo.id` uses UUID.
