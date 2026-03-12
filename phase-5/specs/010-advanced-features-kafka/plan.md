# Plan-010: Advanced Features + Kafka

## Architecture Decisions

### AD1: Dapr Pub/Sub for All Kafka Publishing
App code never uses kafka-python directly. All publishing goes via:
`POST http://localhost:3500/v1.0/publish/kafka-pubsub/{topic}`
This means the Dapr sidecar must be running for events to flow. In local dev
(without Dapr), kafka_service.py silently catches connection errors and logs them.
Best-effort publishing — never fails the API response.

### AD2: Two New Microservices as Separate FastAPI Apps
`notification_service` and `recurring_task_service` are standalone FastAPI apps
with their own Dockerfiles and requirements.txt. They share NO code with backend.
They subscribe via Dapr's push-delivery model (`/dapr/subscribe` endpoint).

### AD3: Recurring Task Creation via Dapr Service Invocation
RecurringTaskService calls backend at:
`http://localhost:3500/v1.0/invoke/todo-backend/method/api/todos`
Uses `X-Internal-Service: recurring-task-service` header which the backend
trusts for internal calls (skips JWT verification). Simple header check, not
a cryptographic token — acceptable for local/hackathon scope.

### AD4: DB Schema Additions are Additive
Three new columns: `is_recurring`, `recurrence_frequency`, `reminder_sent`.
Use `ALTER TABLE ADD COLUMN IF NOT EXISTS` — safe to run multiple times.
SQLModel model updated to include these columns with Optional/default typing.

### AD5: Microservice Port Assignment
| Service | Port |
|---------|------|
| Notification Service | 8001 |
| Recurring Task Service | 8002 |
Both run on different ports to avoid conflicts in local development.

## Implementation Order

```
1. DB: Add is_recurring, recurrence_frequency, reminder_sent columns to Neon
2. Backend: Extend Todo SQLModel + schemas with new fields
3. Backend: Create kafka_service.py (publish_task_event, publish_reminder)
4. Backend: Wire publishing into MCP tools (add_task, complete_task, update_task, delete_task)
5. Backend: Add internal route POST /api/internal/todos (bypass JWT for service invocation)
6. MCP: Extend add_task to understand recurring tasks ("weekly standup")
7. Notification Service: Create src/notification_service/ (Dockerfile, requirements, main.py)
8. Recurring Task Service: Create src/recurring_task_service/ (Dockerfile, requirements, main.py)
9. Helm: Add Deployments/Services for both new microservices
10. Test: Verify events flow (publish → consume)
```

## Recurrence Calculation Logic

```python
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

def calculate_next_due(due_date_str: str, frequency: str) -> str:
    due = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
    if frequency == "daily":
        next_due = due + timedelta(days=1)
    elif frequency == "weekly":
        next_due = due + timedelta(weeks=1)
    elif frequency == "monthly":
        next_due = due + relativedelta(months=1)
    return next_due.isoformat()
```

## Internal Route (bypass JWT)

```python
# In todos.py or a new internal_routes.py
@app.post("/api/internal/todos", include_in_schema=False)
async def create_todo_internal(
    request: Request,
    todo_data: TodoCreate,
    db: Session = Depends(get_session),
):
    service_header = request.headers.get("X-Internal-Service")
    if service_header not in ["recurring-task-service"]:
        raise HTTPException(403, "Forbidden")
    # No JWT check — internal call
    ...
```
