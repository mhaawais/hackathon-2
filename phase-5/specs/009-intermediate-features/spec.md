# Spec-009: Intermediate Todo Features

**Phase**: 5 — Part A
**Status**: Active
**Constitution**: v3.0.0 (Principles IV, IX, XI, XII)

---

## 1. Purpose

Extend the existing Todo app (Phase 3 chatbot) with 5 intermediate-level features:
Priorities, Tags/Categories, Search, Filter, and Sort. These must work via both the
REST API (dashboard UI) and the AI chatbot (MCP tools / natural language).

---

## 2. New Features

### 2.1 Priorities
- Each task has a `priority` field: `high`, `medium` (default), `low`
- Priority shown as colored badge in UI (red=high, yellow=medium, green=low)
- Chatbot understands: "add urgent task", "show high priority", "mark as low priority"

### 2.2 Tags / Categories
- Each task has a `tags` field: JSON array of strings (e.g. `["work", "meeting"]`)
- User can add/remove tags on any task
- UI shows tag chips on each task card
- Chatbot understands: "tag this as work", "show my home tasks", "add personal label"

### 2.3 Search
- `GET /api/todos?search=<query>` — full-text search on `title` + `description`
- Case-insensitive, partial match (ILIKE in PostgreSQL)
- Chatbot understands: "find tasks about meeting", "search for grocery"

### 2.4 Filter
- Filter by: `status` (open/completed), `priority` (high/medium/low), `tag` (string), `due_before` (date)
- Multiple filters combinable: `?priority=high&status=open`
- Chatbot understands: "show completed tasks", "list urgent open items"

### 2.5 Sort
- Sort by: `due_date` (asc/desc), `priority` (high first), `created_at` (asc/desc), `title` (a-z)
- Default sort: `created_at DESC`
- Query param: `?sort_by=priority&sort_dir=desc`
- Chatbot understands: "sort by due date", "show newest first"

---

## 3. Database Changes

### 3.1 New Columns on `todo` table

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| `priority` | `VARCHAR(10)` CHECK IN ('high','medium','low') | `'medium'` | No |
| `tags` | `JSON` | `'[]'` | No |
| `due_date` | `TIMESTAMPTZ` | NULL | Yes |
| `description` | `TEXT` | NULL | Yes |

> `due_date` also used by Spec-010 (Advanced Features) — added here for completeness.
> `description` was previously absent — added to support search on content.

### 3.2 New Indexes

```sql
CREATE INDEX idx_todos_priority ON todo (priority, user_id);
CREATE INDEX idx_todos_due_date ON todo (due_date) WHERE due_date IS NOT NULL;
```

---

## 4. API Contract Changes

### 4.1 Extended Todo Schema

```python
class TodoCreate(SQLModel):
    title: str
    description: Optional[str] = None
    priority: Literal["high", "medium", "low"] = "medium"
    tags: List[str] = []
    due_date: Optional[datetime] = None

class TodoRead(SQLModel):
    id: int
    title: str
    description: Optional[str]
    priority: str
    tags: List[str]
    due_date: Optional[datetime]
    completed: bool
    created_at: datetime
    updated_at: datetime
```

### 4.2 Extended List Endpoint

```
GET /api/todos?search=&priority=&status=&tag=&sort_by=&sort_dir=&due_before=
```

All query params optional. Combined with AND logic.

### 4.3 Extended Update Endpoint

```
PATCH /api/todos/{id}
Body: { title?, description?, priority?, tags?, due_date?, completed? }
```

---

## 5. MCP Tool Changes

### `add_task` (extended)
```python
async def add_task(
    title: str,
    user_id: str,
    description: Optional[str] = None,
    priority: str = "medium",
    tags: List[str] = [],
    due_date: Optional[str] = None,  # ISO8601 string
) -> dict
```

### `list_tasks` (extended)
```python
async def list_tasks(
    user_id: str,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,   # "open" | "completed"
    tag: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
) -> dict
```

### `update_task` (extended)
```python
async def update_task(
    task_id: int,
    user_id: str,
    title: Optional[str] = None,
    description: Optional[str] = None,
    priority: Optional[str] = None,
    tags: Optional[List[str]] = None,
    due_date: Optional[str] = None,
    completed: Optional[bool] = None,
) -> dict
```

---

## 6. Frontend UI Changes

### 6.1 Task Card
- Show priority badge (colored chip: red/yellow/green)
- Show tag chips below title
- Show due date if set (formatted as "Due Mon, Mar 15")

### 6.2 Task Form (Add/Edit)
- Priority dropdown (High / Medium / Low)
- Tags input (type tag + Enter to add, × to remove)
- Due date picker (HTML datetime-local input)

### 6.3 Filter/Sort Bar (above task list)
- Priority filter dropdown
- Status filter (All / Open / Done)
- Sort dropdown (Newest / Oldest / Priority / Due Date)
- Search input with debounce (300ms)

---

## 7. Constraints

- `tags` stored as JSON — no separate tags table (keeps schema simple for hackathon)
- Search uses PostgreSQL ILIKE — no full-text search index needed at this scale
- Filter/sort done in SQL (not application layer)
- All new fields optional with defaults — existing tasks unaffected
- `due_date` is a shared column used by both Spec-009 (filter/sort) and Spec-010 (reminders)

---

## 8. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC1 | New columns exist in DB | `\d todo` in psql shows priority, tags, due_date, description |
| AC2 | `POST /api/todos` accepts priority + tags + due_date | curl with new fields → 201 |
| AC3 | `GET /api/todos?priority=high` filters correctly | Only high priority tasks returned |
| AC4 | `GET /api/todos?search=meeting` returns matching tasks | Case-insensitive partial match |
| AC5 | `GET /api/todos?sort_by=priority` sorts high→medium→low | Response in correct order |
| AC6 | MCP `add_task` accepts and stores new fields | Chatbot: "add urgent task buy milk" → priority=high |
| AC7 | MCP `list_tasks` filters and searches | Chatbot: "show high priority tasks" → filtered list |
| AC8 | Priority badge shows in UI with correct color | Visual check |
| AC9 | Tags render as chips in task card | Visual check |
| AC10 | Filter bar filters task list in real-time | UI interaction test |

---

## 9. Out of Scope (Spec-009)

- Recurring tasks → Spec-010
- Reminders → Spec-010
- Kafka event publishing → Spec-010
- Dapr → Spec-011
