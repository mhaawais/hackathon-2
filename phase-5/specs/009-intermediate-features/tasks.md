# Tasks-009: Intermediate Features

## T001 — Extend Todo SQLModel
**File**: `src/backend/app/models/todo.py`
Add: `description`, `priority`, `tags`, `due_date` columns with defaults.
**Verify**: `python -c "from app.models.todo import Todo; print(Todo.__fields__)"` shows new fields.

## T002 — Run DB Migration on Neon
**Action**: Execute the 4 ALTER TABLE statements from plan.md against Neon DB.
**Method**: Run via `psql $DATABASE_URL` or a one-time migration script.
**Verify**: `SELECT column_name FROM information_schema.columns WHERE table_name='todo'` shows new columns.

## T003 — Update Pydantic Schemas
**File**: `src/backend/app/models/schemas.py`
Update `TodoCreate`, `TodoUpdate`, `TodoRead` with new fields and validation.
**Verify**: `TodoCreate(title="test", priority="high", tags=["work"])` works without error.

## T004 — Update todo_service.py
**File**: `src/backend/app/services/todo_service.py`
- `list_todos()`: add `search`, `priority`, `status`, `tag`, `sort_by`, `sort_dir`, `due_before` params
- Build dynamic SQLModel query with `.where()` chains
**Verify**: Unit test: filtered list returns correct subset.

## T005 — Update todos.py route
**File**: `src/backend/app/routes/todos.py`
- `GET /api/todos`: add Query params for all filter/sort/search options
- `POST /api/todos`: accept new fields
- `PATCH /api/todos/{id}`: accept new fields
**Verify**: `curl "GET /api/todos?priority=high&sort_by=due_date"` returns correct data.

## T006 — Extend MCP add_task tool
**File**: `src/mcp/tools/task_tools.py`
Add `priority`, `tags`, `due_date`, `description` params to `add_task`.
**Verify**: Chatbot "add urgent task meeting" creates task with priority=high.

## T007 — Extend MCP list_tasks tool
Add `search`, `priority`, `status`, `tag`, `sort_by`, `sort_dir` params to `list_tasks`.
**Verify**: Chatbot "show high priority tasks" returns only high priority.

## T008 — Extend MCP update_task tool
Add all new fields to `update_task`.
**Verify**: Chatbot "mark my meeting task as high priority" updates correctly.

## T009 — Update TodoForm component
**File**: `src/frontend/src/components/todos/todo-form.tsx`
Add: Priority dropdown, Tags input (chip-style), Due date datetime-local input.
**Verify**: Form submits with new fields, task created with correct values.

## T010 — Update TodoCard component
**File**: `src/frontend/src/components/todos/todo-card.tsx`
Add: Priority badge (colored), tag chips row, due date line.
**Verify**: Card shows priority badge in correct color, tags displayed as chips.

## T011 — Add FilterBar component
**File**: `src/frontend/src/components/todos/todo-filter-bar.tsx` (NEW)
Priority filter, status filter, sort dropdown, search input with 300ms debounce.
Wire to dashboard page to filter/refetch task list.
**Verify**: Changing filter updates task list without page reload.

## T012 — Update tests
**Files**: `src/backend/tests/test_todo_routes.py`, `test_user_isolation.py`
Add tests for: filter by priority, search by keyword, sort by due_date.
**Verify**: All 32+ existing tests pass + new tests pass.
