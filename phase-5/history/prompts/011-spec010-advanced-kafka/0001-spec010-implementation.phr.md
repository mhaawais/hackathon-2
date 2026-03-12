# PHR-011: Spec-010 Implementation — Advanced Features + Kafka

**Date**: 2026-03-12
**Session**: Phase 5 Part A — Advanced Features + Kafka (Spec-010)
**Constitution**: v3.0.0
**Tests at end**: 64/64 passing, 7 new tests

---

## What Was Done

### 1. T001–T002: DB Schema + SQLModel Extended

**`src/backend/app/models/todo.py`**: Added three recurring-task columns:
- `is_recurring: bool = False` — whether task auto-repeats
- `recurrence_frequency: Optional[str]` — "daily" / "weekly" / "monthly"
- `reminder_sent: bool = False` — tracks whether reminder was fired (used by notification service)

**`scripts/migrate-009.sql`**: Extended with `ALTER TABLE ADD COLUMN IF NOT EXISTS` for all three new columns + CHECK constraint on recurrence_frequency.

### 2. T003: Schemas Extended

**`TodoCreate`**: `is_recurring: bool`, `recurrence_frequency: Optional[Literal[...]]`
**`TodoUpdate`**: Same fields as optional
**`TodoResponse`**: `is_recurring`, `recurrence_frequency`, `reminder_sent` included in all API responses

### 3. T004: kafka_service.py Created

**`src/backend/app/services/kafka_service.py`**:
- `publish_task_event(event_type, task_id, task_data, user_id)` — publishes to `task-events`
- `publish_reminder(task_id, title, due_at, user_id)` — publishes to `reminders`
- Both use `httpx.AsyncClient` → `POST localhost:3500/v1.0/publish/kafka-pubsub/{topic}`
- Both are best-effort: catch all exceptions, log warning, never raise
- 2s timeout on Dapr HTTP call

### 4. T005: Kafka Wired into MCP Tools

**`src/mcp/tools/task_tools.py`** — major refactor:
- New `_task_dict(todo)` helper: single canonical format including recurring fields
- `do_add_task()`: accepts `is_recurring`, `recurrence_frequency`
- `do_update_task()`: accepts `is_recurring`, `recurrence_frequency`
- All `handle_*()` async wrappers: call `_publish_task_event()` after successful operations
- `_publish_task_event()`: lazy-imports kafka_service, also publishes reminder if due_date present
- Kafka import failures silently logged (tests don't have Dapr running)

### 5. T006: Internal Route

**`src/backend/app/routes/internal.py`** (NEW):
- `POST /api/internal/todos` — creates task without JWT
- Trusts only `X-Internal-Service: recurring-task-service` header
- Returns 403 for all other callers (missing header, wrong value)
- Uses `X-User-Id` header for user context (passed by recurring service via Dapr invoke)
- Registered in `main.py` as `app.include_router(internal.router, prefix="/api")`

### 6. T007: MCP server.py Updated

Added `is_recurring` and `recurrence_frequency` to `add_task` and `update_task` inputSchema.
AI guidance: "weekly standup" → `is_recurring=True, recurrence_frequency="weekly"`.

### 7. T008: Notification Service Created

**`src/notification_service/`** — new standalone FastAPI microservice:
- Port 8001
- `GET /dapr/subscribe` → subscribes to `reminders` topic, delivers to `/reminder`
- `POST /reminder` → logs notification (extensible to email/push/webhook)
- Returns 200 always to prevent Dapr retry loops on malformed messages
- Dockerfile: python:3.12-slim, uvicorn

### 8. T009: Recurring Task Service Created

**`src/recurring_task_service/`** — new standalone FastAPI microservice:
- Port 8002
- `GET /dapr/subscribe` → subscribes to `task-events` topic, delivers to `/task-event`
- `POST /task-event`:
  1. Filters: only `event_type == "completed"` AND `is_recurring == True`
  2. Calculates next due date via `_calculate_next_due()` using `python-dateutil`
  3. Calls backend via Dapr service invocation: `POST localhost:3500/v1.0/invoke/todo-backend/method/api/internal/todos`
  4. Returns 200 always (prevents Dapr retry loops)
- Frequency logic: daily=+1d, weekly=+1w, monthly=+1 month (relativedelta)
- Dockerfile: python:3.12-slim, uvicorn

### 9. T010: Helm Templates Updated

New templates:
- `notification-deployment.yaml` + `notification-service.yaml`
- `recurring-deployment.yaml` + `recurring-service.yaml`

Both deployments include Dapr sidecar annotations (`dapr.io/enabled: "true"`, `dapr.io/app-id`, `dapr.io/app-port`).

`values.yaml` updated:
- `notificationService.image.*` section
- `recurringTaskService.image.*` section
- `redpanda.enabled: true` (defaults to local Redpanda pod)

---

## Key Decisions

### Kafka via Dapr Only (never kafka-python)
All Kafka interaction is `httpx.AsyncClient → localhost:3500 → Dapr sidecar → Kafka`. This keeps the app infrastructure-agnostic (can swap Redpanda → any Kafka-compatible broker just by changing Dapr component YAML).

### Best-Effort Publishing (Never Fails API Response)
`kafka_service._publish()` has 2s timeout and catches ALL exceptions. If Dapr is down (local dev without Minikube), events are simply logged and skipped. The primary API response always succeeds.

### Internal Route Authorization
`X-Internal-Service` header check is an allowlist pattern. Only `recurring-task-service` is trusted. This is acceptable for hackathon scope — production would use mTLS or a service mesh.

### Microservices Have No Shared Code
`notification_service` and `recurring_task_service` are fully standalone — they share no Python files with `src/backend/`. This is deliberate (microservice independence). In production, shared types would be a published Python package.

---

## Test Results

```
64 passed, 1 warning in 205.05s (0:03:25)
```

New tests (7): `test_recurring_tasks.py`
- `test_create_recurring_task`
- `test_create_non_recurring_defaults`
- `test_update_task_to_recurring`
- `test_create_task_with_due_date`
- `test_internal_route_forbidden_without_header`
- `test_internal_route_forbidden_wrong_service`
- `test_internal_route_creates_task`

---

## Pending (Next Session — Spec-011: Dapr Integration)

1. Run DB migration on Neon: `psql $DATABASE_URL -f scripts/migrate-009.sql`
2. Install Dapr CLI on host, `dapr init -k` on Minikube
3. Create Redpanda Deployment/Service in Helm templates
4. Create `helm/todo-chatbot/templates/dapr-components/` (4 component YAML files)
5. Add Dapr sidecar annotations to backend + frontend deployments
6. Implement state management in `conversation_service.py` (Dapr state store)
7. Implement `reminder_service.py` (Dapr Jobs API)
8. Test all 5 Dapr building blocks end-to-end
