# Spec-012: Cloud Deployment (Oracle OKE + CI/CD)

**Phase**: 5 — Part C
**Status**: Active
**Constitution**: v3.0.0 (Principles XVIII, XIX)
**Depends on**: Spec-011 (Dapr running, Helm chart complete, all 4 services)

---

## 1. Purpose

Deploy the full application stack to Oracle Kubernetes Engine (OKE) — a cloud K8s
cluster on Oracle Cloud Infrastructure (OCI). OKE free tier provides 4 OCPUs + 24GB RAM,
enough for all services + Dapr + Redpanda Cloud. Add GitHub Actions CI/CD so every
push to `main` automatically builds, pushes images to GHCR, and deploys to OKE.

---

## 2. Cloud Infrastructure

### 2.1 Oracle OKE (Recommended)
- **Why OKE**: Always-free tier (4 OCPUs, 24GB RAM), no credit card expiry, native K8s
- **Cluster**: 1 node pool, shape=VM.Standard.A1.Flex, 4 OCPUs, 24GB RAM
- **Region**: Any (pick closest — ap-singapore-1 or ap-mumbai-1 for South Asia)
- **Network**: Public cluster with public worker nodes (simplest setup)

### 2.2 Redpanda Cloud (Managed Kafka)
- **Why**: No Redpanda pod in cloud K8s (saves resources + gives persistent topics)
- **Tier**: Free Serverless (Redpanda Cloud) — 10GB storage, SASL/SCRAM auth
- **Topics**: `task-events`, `reminders`, `task-updates` (create in Redpanda console)
- **Auth**: Username/password (SASL/SCRAM) stored in K8s Secrets

### 2.3 Neon PostgreSQL (Unchanged)
- Same Neon connection string used in cloud as local
- No changes needed — Neon is already cloud-hosted

### 2.4 GitHub Container Registry (GHCR)
- Images pushed to `ghcr.io/<your-github-username>/<image>:latest`
- No cost for public repositories
- OKE pulls images from GHCR using a K8s imagePullSecret

---

## 3. Docker Images

| Service | Image | Port |
|---------|-------|------|
| Backend | `ghcr.io/{user}/todo-backend:latest` | 7860 |
| Frontend | `ghcr.io/{user}/todo-frontend:latest` | 3000 |
| Notification Service | `ghcr.io/{user}/todo-notification:latest` | 8001 |
| Recurring Task Service | `ghcr.io/{user}/todo-recurring:latest` | 8002 |

All images use `imagePullPolicy: Always` on cloud (opposite of local `Never`).

---

## 4. GitHub Actions CI/CD Pipeline

### 4.1 Workflow File
**Location**: `.github/workflows/deploy.yml`

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: phase-5/src/backend
          push: true
          tags: ${{ env.IMAGE_PREFIX }}/todo-backend:latest

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: phase-5/src/frontend
          push: true
          tags: ${{ env.IMAGE_PREFIX }}/todo-frontend:latest
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.NEXT_PUBLIC_API_URL }}

      - name: Build and push notification service
        uses: docker/build-push-action@v5
        with:
          context: phase-5/src/notification_service
          push: true
          tags: ${{ env.IMAGE_PREFIX }}/todo-notification:latest

      - name: Build and push recurring task service
        uses: docker/build-push-action@v5
        with:
          context: phase-5/src/recurring_task_service
          push: true
          tags: ${{ env.IMAGE_PREFIX }}/todo-recurring:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up kubectl for OKE
        uses: oracle-actions/configure-kubectl-oke@v1.3.2
        with:
          cluster: ${{ secrets.OKE_CLUSTER_OCID }}
        env:
          OCI_CLI_USER: ${{ secrets.OCI_CLI_USER }}
          OCI_CLI_TENANCY: ${{ secrets.OCI_CLI_TENANCY }}
          OCI_CLI_FINGERPRINT: ${{ secrets.OCI_CLI_FINGERPRINT }}
          OCI_CLI_KEY_CONTENT: ${{ secrets.OCI_CLI_KEY_CONTENT }}
          OCI_CLI_REGION: ${{ secrets.OCI_CLI_REGION }}

      - name: Helm upgrade
        run: |
          helm upgrade todo-chatbot phase-5/helm/todo-chatbot \
            --install \
            --namespace default \
            --set backend.image.repository=${{ env.IMAGE_PREFIX }}/todo-backend \
            --set frontend.image.repository=${{ env.IMAGE_PREFIX }}/todo-frontend \
            --set notificationService.image.repository=${{ env.IMAGE_PREFIX }}/todo-notification \
            --set recurringTaskService.image.repository=${{ env.IMAGE_PREFIX }}/todo-recurring \
            --set backend.image.pullPolicy=Always \
            --set frontend.image.pullPolicy=Always \
            --set redpanda.enabled=false \
            --values phase-5/values-cloud.yaml
```

### 4.2 GitHub Secrets Required
| Secret | Description |
|--------|-------------|
| `OKE_CLUSTER_OCID` | OCI OCID of the OKE cluster |
| `OCI_CLI_USER` | OCI user OCID |
| `OCI_CLI_TENANCY` | OCI tenancy OCID |
| `OCI_CLI_FINGERPRINT` | API key fingerprint |
| `OCI_CLI_KEY_CONTENT` | Private key (PEM format) |
| `OCI_CLI_REGION` | e.g. `ap-singapore-1` |
| `NEXT_PUBLIC_API_URL` | Public URL: `https://<oke-lb-ip>/api` |

---

## 5. Cloud Values File

**File**: `phase-5/values-cloud.yaml` (gitignored — contains real secrets)
**Template**: `phase-5/values-cloud.yaml.example` (committed — safe)

```yaml
# values-cloud.yaml — NOT committed to git
redpanda:
  enabled: false   # Use Redpanda Cloud instead

backend:
  image:
    pullPolicy: Always
  env:
    KAFKA_BROKER_SASL: "pkc-xxx.eastus.azure.redpanda.cloud:9092"
    KAFKA_SASL_USERNAME: "my-username"
    KAFKA_SASL_PASSWORD: "my-password"

secrets:
  databaseUrl: "postgresql://..."
  betterAuthSecret: "..."
  geminiApiKey: "..."

ingress:
  host: "todo.yourdomain.com"    # or OKE LoadBalancer IP
```

The `pubsub.yaml` Dapr component must be updated for cloud Redpanda (SASL credentials).

---

## 6. Cloud Pub/Sub Component (Redpanda Cloud)

```yaml
# dapr-components/pubsub-cloud.yaml (conditionally rendered by Helm)
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: kafka-pubsub
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "pkc-xxx.cloud.redpanda.com:9092"
  - name: authRequired
    value: "true"
  - name: saslUsername
    secretKeyRef:
      name: todo-chatbot-secrets
      key: KAFKA_SASL_USERNAME
  - name: saslPassword
    secretKeyRef:
      name: todo-chatbot-secrets
      key: KAFKA_SASL_PASSWORD
  - name: saslMechanism
    value: "SCRAM-SHA-256"
  - name: TLSEnabled
    value: "true"
```

---

## 7. Monitoring (Basic)

### 7.1 Health Endpoints (already exist)
- Backend: `GET /api/health` → `{"status": "ok"}`
- Services: Add `GET /health` to notification and recurring services

### 7.2 OKE Logging
OKE forwards pod logs to OCI Logging Service automatically.
No additional setup needed — view in OCI Console → Logging → Log Groups.

### 7.3 Dapr Dashboard (optional)
```bash
dapr dashboard -k   # Opens dashboard at localhost:8080
```
Shows component status, pub/sub metrics, invocation traces.

---

## 8. Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| AC1 | OKE cluster running with all pods | `kubectl get pods` all Running on cloud cluster |
| AC2 | GHCR images built and pushed on push to main | GitHub Actions → all jobs green |
| AC3 | App accessible at public URL | `curl https://<oke-lb-ip>/api/health` returns 200 |
| AC4 | Dapr running on OKE | `dapr status -k` shows all services |
| AC5 | Redpanda Cloud topics connected | Publish task → topic consumed by notification service |
| AC6 | CI/CD deploys on push | Push commit → GitHub Action → pods updated on OKE |
| AC7 | Secrets stored in K8s Secrets (not in workflow YAML) | `kubectl get secret todo-chatbot-secrets` exists |
| AC8 | Frontend accessible at public URL | App loads in browser at OKE IP |
