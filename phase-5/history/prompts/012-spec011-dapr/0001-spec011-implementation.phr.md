# PHR-012: Spec-011 Implementation — Dapr Integration

**Date**: 2026-03-12
**Session**: Phase 5 Part B — Dapr Sidecar + 5 Building Blocks (Spec-011)
**Constitution**: v3.0.0
**Tests at end**: 64/64 passing (no new automated tests — Dapr requires running cluster)

---

## What Was Done

### T002: Redpanda Deployment in Helm

**`helm/todo-chatbot/templates/redpanda-deployment.yaml`**:
- Conditional: `{{- if .Values.redpanda.enabled }}` (disabled for cloud)
- Single pod, dev-container mode (`rpk redpanda start --mode dev-container`)
- `--smp=1 --memory=256M` — minimal resource footprint for Minikube
- ClusterIP Service: ports 9092 (Kafka), 9644 (admin)
- Readiness probe: `rpk cluster health`

### T003: Dapr Component Files

**`helm/todo-chatbot/templates/dapr-components/`** (4 files):

| File | Component | Type |
|------|-----------|------|
| `pubsub.yaml` | kafka-pubsub (local) | `pubsub.kafka`, broker=`redpanda:9092`, no auth |
| `pubsub-cloud.yaml` | kafka-pubsub (cloud) | `pubsub.kafka`, Redpanda Cloud, SASL/TLS |
| `statestore.yaml` | statestore | `state.postgresql`, Neon DB, table=`dapr_state` |
| `secrets.yaml` | kubernetes-secrets | `secretstores.kubernetes` |

Both pubsub files use `{{- if .Values.redpanda.enabled }}` / `{{- if not .Values.redpanda.enabled }}` conditional. Only one renders per deploy.

### T004: Dapr Sidecar Annotations on All Deployments

Added `annotations:` block to pod templates in:
- `backend-deployment.yaml` — app-id=`todo-backend`, app-port=`7860`
- `frontend-deployment.yaml` — app-id=`todo-frontend`, app-port=`3000`
- `notification-deployment.yaml` — app-id=`todo-notification-service`, app-port=`8001` ✓
- `recurring-deployment.yaml` — app-id=`todo-recurring-task-service`, app-port=`8002` ✓

Backend also gets `DAPR_HTTP_PORT: "3500"` env var so kafka_service.py and reminder_service.py read the correct port.

### T005: State Management — conversation_service.py

**`src/backend/app/services/conversation_service.py`** extended with:
- `cache_conversation(conversation_id, messages)` — POST to `localhost:3500/v1.0/state/statestore`
- `get_cached_conversation(conversation_id)` — GET from state store, returns `[]` on miss/error
- Key pattern: `conv-{conversation_id}`
- Cache size: last 20 messages (`MAX_CACHED_MESSAGES`)
- Both functions: 2s timeout, catch ALL exceptions, log debug, never raise

### T006: Dapr Jobs API — reminder_service.py (NEW)

**`src/backend/app/services/reminder_service.py`**:
- `schedule_reminder(task_id, remind_at, user_id)` — POST to `/v1.0-alpha1/jobs/reminder-{task_id}`
- `cancel_reminder(task_id)` — DELETE the scheduled job
- Payload: `dueTime` (RFC3339) + `data: {task_id, user_id, type}`
- Best-effort: 2s timeout, catch exceptions, log, never raise

**`src/backend/app/routes/chat.py`** extended with:
- `POST /api/jobs/trigger` — Dapr calls this at job due time
- Logs `[JOBS TRIGGER] Reminder fired: task_id=... user_id=...`
- Extension point for WebSocket push / email (logs only for hackathon scope)

---

## Manual Steps Required (User Must Run)

```bash
# 1. Install Dapr CLI (Windows PowerShell, run once)
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# 2. Initialize Dapr on running Minikube cluster
dapr init -k

# 3. Verify Dapr system pods
kubectl get pods -n dapr-system
dapr status -k

# 4. After helm upgrade — verify sidecar injection
kubectl get pods   # should show 2/2 for each pod (app + dapr sidecar)

# 5. Verify Dapr components applied
kubectl get components.dapr.io
```

---

## Architecture After Spec-011

```
Minikube Cluster
├── todo-backend (2/2)         ← FastAPI + Dapr sidecar
├── todo-frontend (2/2)        ← Next.js + Dapr sidecar
├── todo-notification (2/2)    ← Notification + Dapr sidecar
├── todo-recurring (2/2)       ← Recurring task + Dapr sidecar
├── redpanda (1/1)             ← Kafka-compatible broker
└── Dapr control plane         ← dapr-system namespace

Dapr Components:
├── kafka-pubsub  → Redpanda:9092
├── statestore    → Neon PostgreSQL (dapr_state table)
└── kubernetes-secrets → K8s Secrets API
```
