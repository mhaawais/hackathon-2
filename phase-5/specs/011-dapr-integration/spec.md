# Spec-011: Dapr Integration

**Phase**: 5 — Part B
**Status**: Active
**Constitution**: v3.0.0 (Principle XVI)
**Depends on**: Spec-010 (kafka_service.py exists, Redpanda running)

---

## 1. Purpose

Install Dapr on the Kubernetes cluster (local Minikube). Inject Dapr sidecar into all pods.
Configure all 5 Dapr building blocks. Replace direct Kafka publishing with Dapr Pub/Sub.

---

## 2. Dapr Installation

```bash
# Install Dapr CLI (Windows)
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# Initialize Dapr on Kubernetes
dapr init -k

# Verify
dapr status -k
kubectl get pods -n dapr-system
```

---

## 3. Dapr Component Files

All components in `helm/todo-chatbot/templates/dapr-components/`

### 3.1 Pub/Sub (Kafka via Redpanda)
```yaml
# pubsub.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "redpanda:9092"          # local Minikube
  - name: consumerGroup
    value: "todo-app"
  - name: authRequired
    value: "false"
```

### 3.2 State Store (PostgreSQL / Neon)
```yaml
# statestore.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.postgresql
  version: v1
  metadata:
  - name: connectionString
    secretKeyRef:
      name: todo-chatbot-secrets
      key: DATABASE_URL
```

### 3.3 Dapr Jobs (Reminders)
```yaml
# scheduler.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: dapr-scheduler
spec:
  type: bindings.cron
  version: v1
  metadata:
  - name: schedule
    value: "@every 1m"   # poll fallback; Jobs API preferred
```

### 3.4 Secrets (K8s Secrets via Dapr)
```yaml
# secrets.yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kubernetes-secrets
spec:
  type: secretstores.kubernetes
  version: v1
```

---

## 4. Sidecar Injection (Helm Deployment Annotations)

Add to ALL Deployment pod specs:

```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "todo-backend"        # unique per service
  dapr.io/app-port: "7860"              # must match container port
  dapr.io/log-level: "info"
```

Service IDs:
| Service | dapr.io/app-id |
|---------|---------------|
| Backend | `todo-backend` |
| Frontend | `todo-frontend` |
| Notification | `todo-notification-service` |
| Recurring Task | `todo-recurring-task-service` |

---

## 5. Building Block Usage

### 5.1 Pub/Sub — already implemented in kafka_service.py (Spec-010)
Backend publishes via `POST http://localhost:3500/v1.0/publish/kafka-pubsub/{topic}`
Microservices subscribe via `GET /dapr/subscribe` endpoint.

### 5.2 State Management
Cache latest conversation state in Dapr statestore:

```python
# In conversation_service.py — optional caching layer
DAPR_PORT = os.getenv("DAPR_HTTP_PORT", "3500")

async def cache_conversation(conv_id: str, messages: list):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:{DAPR_PORT}/v1.0/state/statestore",
            json=[{"key": f"conv-{conv_id}", "value": {"messages": messages}}]
        )

async def get_cached_conversation(conv_id: str) -> list:
    async with httpx.AsyncClient() as client:
        r = await client.get(f"http://localhost:{DAPR_PORT}/v1.0/state/statestore/conv-{conv_id}")
        if r.status_code == 200:
            return r.json().get("messages", [])
    return []
```

### 5.3 Service Invocation
Recurring Task Service calls backend to create next task:
```python
# Uses Dapr service invocation — no hardcoded URL
await client.post(
    "http://localhost:3500/v1.0/invoke/todo-backend/method/api/internal/todos",
    json={...}
)
```

### 5.4 Jobs API (Exact Reminder Scheduling)
```python
async def schedule_reminder(task_id: int, remind_at: datetime, user_id: str):
    async with httpx.AsyncClient() as client:
        await client.post(
            f"http://localhost:{DAPR_PORT}/v1.0-alpha1/jobs/reminder-task-{task_id}",
            json={
                "dueTime": remind_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "data": {"task_id": task_id, "user_id": user_id, "type": "reminder"}
            }
        )

# Callback endpoint on backend
@app.post("/api/jobs/trigger")
async def job_trigger(request: Request):
    job_data = await request.json()
    if job_data.get("data", {}).get("type") == "reminder":
        await publish_reminder(...)
    return {"status": "SUCCESS"}
```

### 5.5 Secrets
```python
async def get_secret(name: str) -> str:
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"http://localhost:{DAPR_PORT}/v1.0/secrets/kubernetes-secrets/{name}"
        )
        return r.json()[name]

# Usage: gemini_key = await get_secret("GEMINI_API_KEY")
```

---

## 6. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC1 | Dapr system pods running | `kubectl get pods -n dapr-system` all Running |
| AC2 | All app pods have 2/2 containers (app + sidecar) | `kubectl get pods` shows 2/2 |
| AC3 | Dapr components applied | `kubectl get components.dapr.io` lists all 4 |
| AC4 | Pub/Sub: publish → consume works | Event published → notification service receives |
| AC5 | State: save and retrieve conversation cache | `curl localhost:3500/v1.0/state/statestore/conv-1` returns data |
| AC6 | Jobs: reminder scheduled and fires | Add task with due time → callback fires at correct time |
| AC7 | Secrets: GEMINI_API_KEY loaded via Dapr | Backend starts without GEMINI_API_KEY env var (uses Dapr) |
| AC8 | Service invocation: recurring → backend | New recurring task created via Dapr invoke |
