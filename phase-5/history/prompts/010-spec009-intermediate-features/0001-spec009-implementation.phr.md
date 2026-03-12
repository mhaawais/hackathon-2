# PHR-010: Spec-009 Implementation — Intermediate Features

**Date**: 2026-03-12
**Session**: Phase 5 Part A — Intermediate Features (Spec-009)
**Constitution**: v3.0.0
**Tests at end**: 57/57 passing, 0 TypeScript errors

---

## What Was Done

### 1. Completed All Remaining Spec Files
- **Spec-010** `plan.md` + `tasks.md` — Advanced Features + Kafka (10 tasks)
- **Spec-011** `plan.md` + `tasks.md` — Dapr Integration (9 tasks)
- **Spec-012** `spec.md` + `plan.md` + `tasks.md` — Cloud Deployment (Oracle OKE + CI/CD, 11 tasks)

### 2. Backend — Spec-009 T001–T006 (all complete)

**`src/backend/app/models/todo.py`**: Added `priority` (VARCHAR default 'medium'), `tags` (JSON Array via SQLAlchemy Column(JSON)), `due_date` (Optional TIMESTAMPTZ).

**`src/backend/app/models/schemas.py`**:
- `TodoCreate`: `priority: Literal["high","medium","low"]`, `tags: List[str]`, `due_date: Optional[datetime]`
- `TodoUpdate`: all new optional fields + `completed: Optional[bool]`
- `TodoResponse`: all new fields including `priority`, `tags`, `due_date`

**`src/backend/app/services/todo_service.py`**:
- `list_todos()` extended with `search` (ILIKE on title+description), `priority` filter, `tag` filter (JSON contains), `sort_by`, `sort_dir`, `due_before`
- Sort done in Python (avoids complex SQLAlchemy CASE expression for priority)
- "open" maps to "pending" for backward compat
- `update_todo()` handles new fields including `completed` boolean

**`src/backend/app/routes/todos.py`**: All new Query params wired to service layer.

### 3. MCP Tools — Spec-009 T006–T008 (all complete)

**`src/mcp/tools/task_tools.py`**:
- `do_add_task()`: priority, tags, due_date params; due_date parsed from ISO8601
- `do_list_tasks()`: search, priority, tag, sort_by, sort_dir
- `do_update_task()`: all new fields; parsed due_date
- All `do_*` functions return full task dict including priority, tags, due_date

**`src/mcp/server.py`**: Tool definitions updated with full inputSchema for new fields. Descriptions improved so AI infers priority from "urgent" etc.

### 4. Frontend — Spec-009 T009–T011 (all complete)

**`todo-card.tsx`**:
- `Todo` interface extended with `priority`, `tags`, `due_date`
- Priority badge with color coding: red=high, yellow=medium, green=low
- Tag chips below title (indigo pill style with `#` prefix)
- Due date row with clock icon; red/bold if due within 24h or overdue

**`todo-form.tsx`**:
- Priority select dropdown (High/Medium/Low)
- Due date `datetime-local` input
- Tags: text input + Enter to add + × to remove chip-style tags
- `onAdd` callback signature updated to pass all new fields

**`todo-edit-modal.tsx`**:
- Same fields as form: priority dropdown, due date picker, tag input/chips
- Pre-fills from existing task values
- `onSave` signature updated to pass full edit object

**`todo-filter-bar.tsx`** (NEW component):
- Status chips (All / Pending / Completed)
- Priority select dropdown
- Sort-by select (Newest / Due Date / Priority / A-Z) + asc/desc toggle button
- Debounced search input (300ms delay)

**`app/dashboard/page.tsx`**:
- `FilterState` interface replacing separate state variables
- Filters sent as query params to backend API (server-side filtering)
- `handleAdd` / `handleSaveEdit` updated to pass new field objects
- FilterBar component replaces old inline filter/sort UI

### 5. DB Migration Script

**`scripts/migrate-009.sql`**: Safe idempotent ALTER TABLE statements for Neon DB. Adds `description`, `priority`, `tags`, `due_date` with CHECK constraint and performance indexes.

### 6. New Tests — Spec-009 T012

**`tests/test_todo_routes.py`**: 6 new tests:
- `test_create_todo_with_priority_and_tags` — AC2
- `test_filter_by_priority` — AC3
- `test_search_by_keyword` — AC4
- `test_sort_by_priority` — AC5
- `test_update_todo_with_priority_and_tags`
- `test_default_priority_is_medium`

---

## Key Decisions

### Tags as JSON Column (SQLAlchemy Column(JSON))
SQLModel doesn't natively support JSON columns. Used `sa_column=Column(JSON, nullable=False, server_default="[]")` from sqlalchemy. Requires `from sqlalchemy import Column, JSON`.

### Sort in Python (not SQL)
Priority sort would need a CASE expression in SQLAlchemy ORM. Python sort on `_PRIORITY_ORDER` dict is simpler and correct at hackathon scale. Due-date sort handles None values (nulls last).

### Tag Filter Approach
PostgreSQL JSON `@>` operator is ideal but complex in SQLModel. Used ILIKE-style containment check: `col(Todo.tags).cast(str).contains('"tag"')`. Works for dev; production would use `@>` operator.

### Frontend Filter State
All filtering now server-side (API call on every filter change). Dashboard page refactored: `filters: FilterState` single state object, `fetchTodos(f?)` accepts override to avoid stale closure issues.

---

## Test Results

```
57 passed, 1 warning in 185.47s (0:03:05)
```
(1 warning = InsecureKeyLengthWarning in JWT test — pre-existing, not introduced here)

Frontend build: 0 TypeScript errors, 0 compilation errors.

---

## Pending (Next Session)

1. **Run DB migration on Neon** — `psql $DATABASE_URL -f scripts/migrate-009.sql`
2. **Spec-010 implementation**: kafka_service.py, notification_service, recurring_task_service
3. **Spec-011 implementation**: Dapr init, component YAML files, sidecar annotations
4. **Spec-012 implementation**: OKE cluster, GitHub Actions CI/CD
