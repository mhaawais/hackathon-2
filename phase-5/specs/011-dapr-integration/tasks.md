# Tasks-011: Dapr Integration

## T001 — Install Dapr CLI and Initialize on Minikube
```bash
# Windows — run in PowerShell
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# Then init on running Minikube cluster
dapr init -k

# Verify
dapr status -k
kubectl get pods -n dapr-system
```
**Verify**: All dapr-system pods show Running. `dapr status -k` shows `True` for all services.

## T002 — Create Redpanda Deployment in Helm
**Files**:
- `helm/todo-chatbot/templates/redpanda-deployment.yaml`
- `helm/todo-chatbot/templates/redpanda-service.yaml`
Add Redpanda single-node pod (dev-container mode) + ClusterIP Service on ports 9092, 9644.
Add to `values.yaml`: `redpanda.enabled: true` (so cloud deployment can set `enabled: false`).
**Verify**: `kubectl get pods -l app=redpanda` shows 1/1 Running.

## T003 — Create Dapr Component Files
**Directory**: `helm/todo-chatbot/templates/dapr-components/`
Create 4 component files:
- `pubsub.yaml` — `pubsub.kafka`, brokers=`redpanda:9092`
- `statestore.yaml` — `state.postgresql`, connectionString from K8s secret
- `scheduler.yaml` — `bindings.cron`, `@every 1m`
- `secrets.yaml` — `secretstores.kubernetes`
**Verify**: `kubectl get components.dapr.io` lists all 4 components after `helm upgrade`.

## T004 — Add Dapr Sidecar Annotations to All Deployments
**Files**: All 4 deployment templates in `helm/todo-chatbot/templates/`:
- `backend-deployment.yaml` → app-id=`todo-backend`, app-port=`7860`
- `frontend-deployment.yaml` → app-id=`todo-frontend`, app-port=`3000`
- `notification-deployment.yaml` → app-id=`todo-notification-service`, app-port=`8001`
- `recurring-deployment.yaml` → app-id=`todo-recurring-task-service`, app-port=`8002`

Add to each pod template `annotations`:
```yaml
dapr.io/enabled: "true"
dapr.io/app-id: "<id>"
dapr.io/app-port: "<port>"
dapr.io/log-level: "info"
```
**Verify**: `kubectl get pods` shows all pods with 2/2 containers after upgrade.

## T005 — Implement State Management (conversation_service.py)
**File**: `src/backend/app/services/conversation_service.py`
Add two functions:
- `cache_conversation(conv_id, messages)` — POST to Dapr statestore
- `get_cached_conversation(conv_id)` — GET from Dapr statestore, return `[]` on miss/error
Both functions: wrap in try/except, log error, never raise.
**Verify**: Unit test with mock Dapr port: save state, retrieve state.

## T006 — Implement Jobs API (reminder_service.py)
**File**: `src/backend/app/services/reminder_service.py` (NEW)
Implement `schedule_reminder(task_id, remind_at, user_id)`:
- POST to `http://localhost:{DAPR_PORT}/v1.0-alpha1/jobs/reminder-task-{task_id}`
- `dueTime` in RFC3339 format: `remind_at.strftime("%Y-%m-%dT%H:%M:%SZ")`
- `data`: `{"task_id": task_id, "user_id": user_id, "type": "reminder"}`

Add callback endpoint to backend routes:
```python
@app.post("/api/jobs/trigger")
async def job_trigger(request: Request): ...
```
**Verify**: Schedule a job for 1 minute from now → after 1 min, callback fires and logs.

## T007 — Wire Secrets API (Optional — AC7)
**File**: `src/backend/app/core/config.py`
Add `get_secret_via_dapr(name)` function.
On startup: if `GEMINI_API_KEY` env var is empty, try Dapr secrets API.
Gracefully fall back to env var if Dapr not available.
**Verify**: Backend starts and reads GEMINI_API_KEY without it being in env vars (only in K8s secret).

## T008 — Apply and Verify All Components
```bash
# Upgrade Helm with new templates
helm upgrade todo-chatbot ./helm/todo-chatbot --values values-secrets.yaml

# Verify components
kubectl get components.dapr.io

# Verify sidecar injection
kubectl get pods

# Verify pub/sub flow
kubectl exec -it <backend-pod> -- curl localhost:3500/v1.0/metadata
```
**Verify**: All 8 AC from spec.md pass.

## T009 — Smoke Test All 5 Building Blocks
Run in order:
1. **Pub/Sub**: Add task with due date → `rpk topic consume reminders` shows event
2. **State**: POST state → GET state via curl to `localhost:3500/v1.0/state/statestore/conv-test`
3. **Service Invocation**: Recurring service → invoke backend → new task created in DB
4. **Jobs API**: Schedule job for +30s → wait → callback logged in backend
5. **Secrets**: Check backend log shows "Loaded GEMINI_API_KEY via Dapr secrets"
**Verify**: All 5 building blocks produce expected behavior.
