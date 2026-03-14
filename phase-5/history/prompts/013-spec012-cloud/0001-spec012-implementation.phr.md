# PHR-013: Spec-012 Implementation — Cloud Deployment (Oracle OKE + CI/CD)

**Date**: 2026-03-12
**Session**: Phase 5 Part C — Cloud Deployment (Spec-012)
**Constitution**: v3.0.0
**Tests at end**: 64/64 passing

---

## What Was Done

### T007: GitHub Actions CI/CD Pipeline

**`.github/workflows/deploy.yml`** — triggers on push to `main` when `phase-5/**` changes:

**Job 1 — Build & Push (parallel image builds):**
- Docker Buildx with GitHub Actions cache (`type=gha`)
- 4 images pushed to GHCR:
  - `ghcr.io/{owner}/todo-backend:{sha}`
  - `ghcr.io/{owner}/todo-frontend:{sha}` (with `NEXT_PUBLIC_API_URL` build arg)
  - `ghcr.io/{owner}/todo-notification:{sha}`
  - `ghcr.io/{owner}/todo-recurring:{sha}`
- Both `:latest` and `:{sha}` tags pushed (`:sha` for rollback ability)

**Job 2 — Deploy to OKE** (runs after Job 1):
- Installs OCI CLI via pip
- Writes OCI config from GitHub Secrets
- Generates kubeconfig via `oci ce cluster create-kubeconfig`
- Applies K8s Secrets idempotently (`--dry-run=client -o yaml | kubectl apply`)
- `helm upgrade --install` with `--timeout 5m --wait`
- Key overrides: `redpanda.enabled=false`, `image.pullPolicy=Always`, `kafkaBroker` from secret
- Verifies rollout: `kubectl rollout status deployment/...`
- Smoke tests `/api/health` endpoint

### T005–T006: Cloud Values and Secrets

**`phase-5/values-cloud.yaml.example`** — template showing all cloud overrides:
- `redpanda.enabled: false`
- `config.kafkaBroker` for Redpanda Cloud
- `ingress.host` for custom domain
- `secrets.*` placeholders (set via CI/CD, not this file)

**`phase-5/helm/todo-chatbot/templates/secret.yaml`** — updated:
- Added `KAFKA_SASL_USERNAME` and `KAFKA_SASL_PASSWORD` (conditional on non-empty value)

**`phase-5/helm/todo-chatbot/values.yaml`** — updated:
- `secrets.kafkaSaslUsername`, `secrets.kafkaSaslPassword` (empty defaults)
- `config.kafkaBroker` (empty default, overridden for cloud)
- `config.daprHttpPort: "3500"`

**`phase-5/.gitignore`** — added `values-cloud.yaml`

---

## GitHub Secrets Required

The following must be configured in: Repository → Settings → Secrets → Actions

| Secret | How to get |
|--------|------------|
| `OKE_CLUSTER_OCID` | OCI Console → Kubernetes Clusters → OCID |
| `OCI_CLI_USER` | OCI Console → Profile → OCID |
| `OCI_CLI_TENANCY` | OCI Console → Tenancy details → OCID |
| `OCI_CLI_REGION` | e.g. `ap-singapore-1` |
| `OCI_CLI_FINGERPRINT` | OCI Console → API keys → Fingerprint |
| `OCI_CLI_KEY_CONTENT` | Private key PEM content (full file) |
| `DATABASE_URL` | Neon dashboard → Connection string |
| `BETTER_AUTH_SECRET` | Same as local `.env` |
| `GEMINI_API_KEY` | Google AI Studio |
| `KAFKA_BROKER` | Redpanda Cloud → Bootstrap server URL |
| `KAFKA_SASL_USERNAME` | Redpanda Cloud → Users |
| `KAFKA_SASL_PASSWORD` | Redpanda Cloud → Users |
| `NEXT_PUBLIC_API_URL` | `https://<oke-lb-ip>/api` (after first deploy) |
| `APP_HOST` | `<oke-lb-ip>` or custom domain |

---

## Deployment Flow Summary

```
git push to main
      ↓
GitHub Actions triggers (path filter: phase-5/**)
      ↓
Job 1: Build 4 Docker images → push to GHCR
      ↓
Job 2: OCI CLI → kubeconfig for OKE
  → kubectl apply secret (idempotent)
  → helm upgrade --install (cloud values: no Redpanda, Always pull)
  → kubectl rollout status (wait for pods ready)
  → curl /api/health (smoke test)
```

---

## Manual Setup Steps (One-Time)

### 1. Oracle OKE Cluster
```
OCI Console → Kubernetes Clusters → Create Cluster
Mode: Quick Create
Shape: VM.Standard.A1.Flex, 4 OCPUs, 24GB RAM
Node Count: 1
```

### 2. Dapr on OKE
```bash
dapr init -k   # run after kubectl is configured for OKE
dapr status -k
```

### 3. Redpanda Cloud
```
redpanda.com/redpanda-cloud → Serverless → Create Cluster
Topics: task-events, reminders, task-updates
Users: create user, grant read/write ACLs on all 3 topics
Note: Bootstrap server URL (for KAFKA_BROKER secret)
```

### 4. First Deploy
```bash
# Manually apply secrets before first Helm install
kubectl create secret generic todo-chatbot-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=BETTER_AUTH_SECRET="..." \
  --from-literal=GEMINI_API_KEY="..." \
  --from-literal=KAFKA_SASL_USERNAME="..." \
  --from-literal=KAFKA_SASL_PASSWORD="..."

# Deploy (cloud mode, no Redpanda pod)
helm upgrade todo-chatbot phase-5/helm/todo-chatbot \
  --install \
  --set redpanda.enabled=false \
  --values values-cloud.yaml

# Get LoadBalancer IP
kubectl get svc -l app.kubernetes.io/instance=todo-chatbot
```
