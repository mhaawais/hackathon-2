# Plan-009: Intermediate Features

## Architecture Decisions

### AD1: JSON for Tags (not a separate table)
Store tags as a JSON array in the `todo` table. Simple, no joins, sufficient for
hackathon scale. PostgreSQL JSON operators support filtering by tag with:
`WHERE tags::jsonb ? 'work'`

### AD2: ILIKE for Search (not full-text index)
Use `ILIKE '%query%'` on title + description. Covers partial match, case-insensitive.
No pg_trgm index needed at hackathon scale. If needed, can add later.

### AD3: SQLModel column additions via `create_all`
Use `SQLModel.metadata.create_all(engine)` — it runs `CREATE TABLE IF NOT EXISTS` and
doesn't alter existing columns. New columns must be added via raw SQL migration OR by
dropping/recreating the table (acceptable in dev). Use `ALTER TABLE` statements for
production Neon DB.

### AD4: Filter + Sort in service layer via SQLModel query building
Build the query dynamically in `todo_service.py` using SQLModel's `.where()` and
`.order_by()` — not raw SQL strings. Safe against injection, readable.

## Implementation Order

```
1. DB: Add columns to Todo model (priority, tags, due_date, description)
2. DB: Run migration on Neon (ALTER TABLE statements)
3. Backend: Update TodoCreate/TodoUpdate/TodoRead schemas
4. Backend: Update todo_service.py — filtering, sorting, searching
5. Backend: Update todos.py route — query params
6. MCP: Update add_task, list_tasks, update_task tool signatures
7. Frontend: Update TodoForm — priority dropdown, tags input, due date picker
8. Frontend: Update TodoCard — priority badge, tag chips, due date display
9. Frontend: Add FilterBar component
10. Tests: Update existing tests + add new filter/search/sort tests
```

## Migration SQL (run on Neon)

```sql
ALTER TABLE todo ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE todo ADD COLUMN IF NOT EXISTS priority VARCHAR(10) NOT NULL DEFAULT 'medium'
  CHECK (priority IN ('high', 'medium', 'low'));
ALTER TABLE todo ADD COLUMN IF NOT EXISTS tags JSON NOT NULL DEFAULT '[]';
ALTER TABLE todo ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_todos_priority ON todo (priority, user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todo (due_date) WHERE due_date IS NOT NULL;
```
