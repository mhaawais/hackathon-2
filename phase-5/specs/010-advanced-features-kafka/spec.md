# Spec-010: Advanced Features + Kafka Event Architecture

**Phase**: 5 — Part A (features) + Kafka backbone
**Status**: Active
**Constitution**: v3.0.0 (Principles XV, XVII)
**Depends on**: Spec-009 (due_date column, todo schema)

---

## 1. Purpose

Add two advanced features (Recurring Tasks + Reminders) and introduce the Kafka
event backbone via Redpanda. All task mutations publish events. Two new microservices
(Notification Service, Recurring Task Service) consume those events.

---

## 2. Advanced Features

### 2.1 Recurring Tasks
- New fields: `is_recurring` (bool), `recurrence_frequency` (daily/weekly/monthly)
- On `complete_task`: if `is_recurring=True`, publish to `task-events` topic
- `RecurringTaskService` consumes event → creates next occurrence with:
  - Same title, priority, tags, description
  - `due_date` advanced by frequency (e.g. +7 days for weekly)
  - `completed=False`
- Chatbot understands: "add weekly standup", "every Monday review tasks"

### 2.2 Due Dates + Reminders
- `due_date` already added in Spec-009
- When due_date is set on create/update: publish to `reminders` topic
- `NotificationService` consumes → logs/stores notification (browser push = future)
- Dapr Jobs API (Spec-011) will later schedule exact-time callbacks
- For now: event published, service consumes and logs

---

## 3. Kafka Setup (Redpanda)

### 3.1 Local (Minikube) — Redpanda as Docker container in K8s

```yaml
# redpanda single-node in K8s (ephemeral, for dev)
image: redpandadata/redpanda:latest
command: redpanda start --mode dev-container
ports: 9092 (kafka), 9644 (admin)
```

### 3.2 Cloud — Redpanda Cloud (free serverless)
Sign up at redpanda.com/cloud → create Serverless cluster → create 3 topics.

### 3.3 Topics

| Topic | Retention | Partitions |
|-------|-----------|-----------|
| `task-events` | 7 days | 1 |
| `reminders` | 7 days | 1 |
| `task-updates` | 1 day | 1 |

---

## 4. Event Schemas

### task-events
```json
{
  "event_type": "created|updated|completed|deleted",
  "task_id": 1,
  "task_data": {
    "title": "...",
    "priority": "high",
    "tags": ["work"],
    "due_date": "2026-03-15T10:00:00Z",
    "is_recurring": true,
    "recurrence_frequency": "weekly",
    "completed": true
  },
  "user_id": "uuid-string",
  "timestamp": "2026-03-12T09:00:00Z"
}
```

### reminders
```json
{
  "task_id": 1,
  "title": "Task title",
  "due_at": "2026-03-15T10:00:00Z",
  "user_id": "uuid-string",
  "timestamp": "2026-03-12T09:00:00Z"
}
```

---

## 5. Publishing (Backend)

### 5.1 New kafka_service.py
```python
# src/backend/app/services/kafka_service.py
import httpx, os
from datetime import datetime, timezone

DAPR_PORT = os.getenv("DAPR_HTTP_PORT", "3500")

async def publish_task_event(event_type: str, task_id: int, task_data: dict, user_id: str):
    event = {
        "event_type": event_type,
        "task_id": task_id,
        "task_data": task_data,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:{DAPR_PORT}/v1.0/publish/kafka-pubsub/task-events",
            json=event, timeout=5.0
        )

async def publish_reminder(task_id: int, title: str, due_at: str, user_id: str):
    event = {"task_id": task_id, "title": title, "due_at": due_at, "user_id": user_id,
             "timestamp": datetime.now(timezone.utc).isoformat()}
    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:{DAPR_PORT}/v1.0/publish/kafka-pubsub/reminders",
            json=event, timeout=5.0
        )
```

Publishing is **best-effort** — failures are logged but do NOT cause the API to return an error.

### 5.2 Trigger Points in MCP tools
- `add_task` → publish `created` event (+ reminder if due_date set)
- `update_task` → publish `updated` event (+ reminder if due_date changed)
- `complete_task` → publish `completed` event (triggers recurring check)
- `delete_task` → publish `deleted` event

---

## 6. New Microservices

### 6.1 Notification Service
**Location**: `src/notification_service/`
**Responsibility**: Consume `reminders` topic → log/store notification

```python
# main.py — minimal FastAPI
from fastapi import FastAPI, Request
app = FastAPI()

@app.get("/dapr/subscribe")
async def subscribe():
    return [{"pubsubname": "kafka-pubsub", "topic": "reminders", "route": "/reminder"}]

@app.post("/reminder")
async def handle_reminder(request: Request):
    data = await request.json()
    event = data.get("data", {})
    print(f"REMINDER: Task {event['task_id']} '{event['title']}' due at {event['due_at']}")
    # TODO Phase 5+: send email/push notification
    return {"status": "SUCCESS"}
```

### 6.2 Recurring Task Service
**Location**: `src/recurring_task_service/`
**Responsibility**: Consume `task-events` where event_type=completed + is_recurring=True → create next task

```python
@app.post("/task-event")
async def handle_task_event(request: Request):
    data = await request.json()
    event = data.get("data", {})
    if event.get("event_type") != "completed":
        return {"status": "SUCCESS"}
    task = event.get("task_data", {})
    if not task.get("is_recurring"):
        return {"status": "SUCCESS"}
    # Calculate next due_date
    next_due = calculate_next_due(task["due_date"], task["recurrence_frequency"])
    # Create next task via backend service invocation (Dapr invoke)
    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:3500/v1.0/invoke/todo-backend/method/api/todos",
            json={
                "title": task["title"],
                "priority": task["priority"],
                "tags": task["tags"],
                "due_date": next_due,
                "is_recurring": True,
                "recurrence_frequency": task["recurrence_frequency"],
            },
            headers={"X-Internal-Service": "recurring-task-service"},  # bypass JWT
        )
    return {"status": "SUCCESS"}
```

> **Note**: Internal service calls bypass JWT (use a service-to-service header that the backend trusts for internal calls only).

---

## 7. DB Changes (additions to Spec-009)

```sql
ALTER TABLE todo ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE todo ADD COLUMN IF NOT EXISTS recurrence_frequency VARCHAR(10)
  CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly'));
ALTER TABLE todo ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;
```

---

## 8. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC1 | Recurring fields in DB | `\d todo` shows is_recurring, recurrence_frequency |
| AC2 | Completing recurring task publishes to task-events | Redpanda console shows event |
| AC3 | Recurring Task Service creates next occurrence | New task in DB after completion |
| AC4 | Setting due_date publishes reminder event | Redpanda console shows reminder |
| AC5 | Notification Service logs reminder | Service logs show "REMINDER: Task..." |
| AC6 | Chatbot handles recurring: "add weekly standup" | Task created with is_recurring=True, frequency=weekly |
| AC7 | All 3 Kafka topics exist | `rpk topic list` shows all 3 |
| AC8 | Events flow end-to-end | Add task with due date → event in Redpanda → notification service logs |
