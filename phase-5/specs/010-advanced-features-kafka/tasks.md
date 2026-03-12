# Tasks-010: Advanced Features + Kafka

## T001 — DB Migration: Recurring Fields
**Action**: Run on Neon DB:
```sql
ALTER TABLE todo ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE todo ADD COLUMN IF NOT EXISTS recurrence_frequency VARCHAR(10)
  CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly'));
ALTER TABLE todo ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
```
**Verify**: `SELECT column_name FROM information_schema.columns WHERE table_name='todo'` shows new columns.

## T002 — Extend Todo SQLModel
**File**: `src/backend/app/models/todo.py`
Add: `is_recurring: bool = False`, `recurrence_frequency: Optional[str] = None`, `reminder_sent: bool = False`
**Verify**: `python -c "from app.models.todo import Todo; print(Todo.__fields__)"` shows new fields.

## T003 — Extend Pydantic Schemas
**File**: `src/backend/app/models/schemas.py`
- `TodoCreate`: add `is_recurring`, `recurrence_frequency` fields
- `TodoRead`: add all recurring fields
- `TodoUpdate`: add all new optional fields
**Verify**: `TodoCreate(title="test", is_recurring=True, recurrence_frequency="weekly")` works.

## T004 — Create kafka_service.py
**File**: `src/backend/app/services/kafka_service.py`
Implement `publish_task_event(event_type, task_id, task_data, user_id)` and
`publish_reminder(task_id, title, due_at, user_id)` using httpx to Dapr pub/sub.
Both functions: try/except — catch all exceptions, log error, continue.
**Verify**: `import kafka_service` works. Function calls do not raise when Dapr is not running.

## T005 — Wire Publishing into MCP Tools
**File**: `src/mcp/tools/task_tools.py`
- `add_task`: after DB insert → `await publish_task_event("created", ...)`; if due_date → `await publish_reminder(...)`
- `update_task`: after DB update → `await publish_task_event("updated", ...)`; if due_date changed → `await publish_reminder(...)`
- `complete_task`: after DB update → `await publish_task_event("completed", ...)` (recurring handled by consumer)
- `delete_task`: after DB delete → `await publish_task_event("deleted", ...)`
**Verify**: Tool calls succeed even when Dapr not running (best-effort).

## T006 — Add Internal Route
**File**: `src/backend/app/routes/todos.py` (or new `internal_routes.py`)
Add `POST /api/internal/todos` that:
1. Checks `X-Internal-Service` header for allowed services
2. Returns 403 if not trusted
3. Creates task without JWT verification
**Verify**: `curl -X POST .../api/internal/todos -H "X-Internal-Service: recurring-task-service" -d '{"title":"test"}'` returns 201.
`curl .../api/internal/todos` without header returns 403.

## T007 — Extend MCP add_task for Recurring
**File**: `src/mcp/tools/task_tools.py`
- Add `is_recurring: bool = False` and `recurrence_frequency: Optional[str] = None` params
- Update `TOOL_DESCRIPTIONS` / system prompt so AI understands: "weekly standup" → `is_recurring=True, recurrence_frequency="weekly"`
**Verify**: Chatbot prompt "add weekly standup" creates task with `is_recurring=True`.

## T008 — Create Notification Service
**Directory**: `src/notification_service/`
Create:
- `requirements.txt`: `fastapi>=0.115.0`, `uvicorn>=0.30.0`, `httpx>=0.27.0`
- `main.py`: FastAPI with `/dapr/subscribe` GET and `/reminder` POST
- `Dockerfile`: Python 3.12-slim, `uvicorn main:app --host 0.0.0.0 --port 8001`
**Verify**: `python -m uvicorn main:app --port 8001` starts without error.

## T009 — Create Recurring Task Service
**Directory**: `src/recurring_task_service/`
Create:
- `requirements.txt`: `fastapi>=0.115.0`, `uvicorn>=0.30.0`, `httpx>=0.27.0`, `python-dateutil>=2.9.0`
- `main.py`: FastAPI with `/dapr/subscribe` GET and `/task-event` POST
  - Filter: only `event_type == "completed"` AND `is_recurring == True`
  - Calculate next due_date using `calculate_next_due()`
  - POST to backend internal route via Dapr service invocation
- `Dockerfile`: Python 3.12-slim, port 8002
**Verify**: POST to `/task-event` with completed+recurring event → creates new task.

## T010 — Add Helm Deployments for New Services
**Directory**: `helm/todo-chatbot/templates/`
Create:
- `notification-deployment.yaml`: app-id=`todo-notification-service`, port=8001
- `notification-service.yaml`: ClusterIP, port 8001
- `recurring-deployment.yaml`: app-id=`todo-recurring-task-service`, port=8002
- `recurring-service.yaml`: ClusterIP, port 8002
Both must have Dapr sidecar annotations (from Spec-011 values).
Update `values.yaml`: add `notificationService` and `recurringTaskService` image sections.
**Verify**: `helm template . --values values-secrets.yaml` renders both deployments.

## T011 — Verify End-to-End Event Flow
**Steps**:
1. Start local Minikube + Dapr (Spec-011 prerequisite)
2. Create task with due date via chatbot
3. Check Redpanda: `kubectl exec -it redpanda-0 -- rpk topic consume reminders`
4. Check notification service logs: `kubectl logs -l app=notification-service`
5. Complete a recurring task
6. Check recurring service logs and verify new task in DB
**Verify**: AC1–AC8 from spec.md all pass.
