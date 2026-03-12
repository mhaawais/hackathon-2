# Plan-011: Dapr Integration

## Architecture Decisions

### AD1: Dapr HTTP API (not SDK)
All Dapr calls use the HTTP sidecar API (`localhost:3500`) via `httpx.AsyncClient`.
The Python Dapr SDK adds complexity and a heavyweight dependency. HTTP API is
simpler, language-agnostic, and sufficient for all 5 building blocks.

### AD2: Pub/Sub Component Points to Local Redpanda
The `pubsub.yaml` component uses `brokers: redpanda:9092` (K8s service name for
the Redpanda pod). On cloud (Spec-012), this value is overridden in `values-cloud.yaml`
to point to the Redpanda Cloud bootstrap server + SASL credentials.

### AD3: State Store Uses PostgreSQL / Neon
Dapr state store backed by same Neon PostgreSQL database (separate table `dapr_state`
created automatically by the Dapr PostgreSQL component). This avoids running Redis
which would consume more Minikube memory.

### AD4: Dapr Jobs API for Reminders (alpha)
`/v1.0-alpha1/jobs/{name}` schedules one-shot callbacks. The callback endpoint is
`POST /api/jobs/trigger` on the backend. Dapr calls this endpoint at the scheduled time.
Note: `dueTime` must be in RFC3339 format.

### AD5: Secrets via Kubernetes Secret Store
`secretstores.kubernetes` component allows reading K8s Secrets via Dapr API.
The K8s Secret `todo-chatbot-secrets` must already exist (created by Helm).
Dapr reads secrets from the same namespace as the pod.

### AD6: Sidecar Injection via Namespace Annotation
The `default` namespace must have the label `dapr-enabled: true` OR each Deployment
gets individual annotations. Individual annotations preferred — more explicit, don't
accidentally sidecar third-party pods.

### AD7: Redpanda Deployed as Single K8s Pod (ephemeral)
For local Minikube, Redpanda runs as a single pod using the dev-container mode.
Data is ephemeral (no PersistentVolumeClaim). Acceptable for hackathon local dev.
Cloud deployment uses Redpanda Cloud managed service (Spec-012).

## Implementation Order

```
1. Install Dapr CLI on host machine
2. Run `dapr init -k` to install Dapr on Minikube
3. Create Redpanda Deployment + Service in Helm templates
4. Create dapr-components/ directory with 4 YAML component files
5. Add Dapr sidecar annotations to all 4 Deployments
6. Apply components: `kubectl apply -f dapr-components/`
7. Add state management code to conversation_service.py
8. Add Jobs API code to a new reminder_service.py
9. Add Secrets API code (optional: load GEMINI_API_KEY via Dapr)
10. Verify all 8 acceptance criteria
```

## Dapr Component YAML Locations

All components are Helm-templated in:
`helm/todo-chatbot/templates/dapr-components/`
- `pubsub.yaml`
- `statestore.yaml`
- `scheduler.yaml`
- `secrets.yaml`

These are standard K8s CRDs (`kind: Component`, `apiVersion: dapr.io/v1alpha1`)
applied to the same namespace as the app pods.

## Helm Redpanda Template

```yaml
# templates/redpanda-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redpanda
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redpanda
  template:
    metadata:
      labels:
        app: redpanda
    spec:
      containers:
      - name: redpanda
        image: redpandadata/redpanda:latest
        command: ["rpk", "redpanda", "start", "--mode", "dev-container",
                  "--overprovisioned", "--smp=1", "--memory=256M",
                  "--reserve-memory=0M", "--node-id=0", "--check=false"]
        ports:
        - containerPort: 9092   # Kafka
        - containerPort: 9644   # Admin
---
apiVersion: v1
kind: Service
metadata:
  name: redpanda
spec:
  selector:
    app: redpanda
  ports:
  - name: kafka
    port: 9092
  - name: admin
    port: 9644
```

## Conversation State Caching Strategy

State is stored per conversation ID. On every AI response:
1. Cache last N messages (configurable, default 20) to Dapr state
2. On new conversation load, try Dapr state first → fallback to DB
3. State key: `conv-{conversation_id}`
4. TTL: none set (persists until manual delete or DB sync)
