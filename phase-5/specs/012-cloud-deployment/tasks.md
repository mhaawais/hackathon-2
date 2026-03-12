# Tasks-012: Cloud Deployment

## T001 — Create OCI Account + OKE Cluster
**Manual steps**:
1. Go to oracle.com/cloud/free → sign up for Always Free tier
2. OCI Console → Developer Services → Kubernetes Clusters → Create Cluster
3. Mode: Quick Create, Shape: VM.Standard.A1.Flex, 4 OCPUs, 24GB RAM, Node Count: 1
4. Click Create → wait ~10 min for cluster to provision

**Verify**: Cluster shows Active status in OCI Console.

## T002 — Configure kubectl for OKE
**Manual steps**:
1. Install OCI CLI: `pip install oci-cli`
2. Run `oci setup config` → enter tenancy OCID, user OCID, region, generate API keys
3. OCI Console → Cluster detail page → Access Cluster → Copy kubeconfig command
4. Run the command to update `~/.kube/config`
```bash
export KUBECONFIG=~/.kube/config
kubectl get nodes
```
**Verify**: `kubectl get nodes` shows 1 node in Ready state.

## T003 — Install Dapr on OKE
```bash
dapr init -k
dapr status -k
kubectl get pods -n dapr-system
```
**Verify**: All Dapr system pods Running. `dapr status -k` shows all services True.

## T004 — Create Redpanda Cloud Account + Topics
**Manual steps**:
1. Go to redpanda.com/redpanda-cloud → Sign Up (free serverless)
2. Create cluster (Serverless, any region)
3. Create 3 topics: `task-events`, `reminders`, `task-updates` (default partitions/retention)
4. Create SASL user: Security → Users → Create User (note username/password)
5. Create ACLs: allow user read/write on all 3 topics
6. Note bootstrap server URL (format: `pkc-xxx.cloud.redpanda.com:9092`)

**Verify**: Redpanda Cloud console shows cluster Running, 3 topics created.

## T005 — Create Cloud Values File
**File**: `phase-5/values-cloud.yaml` (add to .gitignore)
```yaml
redpanda:
  enabled: false

backend:
  image:
    pullPolicy: Always

secrets:
  databaseUrl: "<neon-connection-string>"
  betterAuthSecret: "<secret>"
  geminiApiKey: "<key>"
  kafkaSaslUsername: "<redpanda-username>"
  kafkaSaslPassword: "<redpanda-password>"
  kafkaBroker: "<pkc-xxx.cloud.redpanda.com:9092>"

ingress:
  host: "<oke-lb-ip-or-domain>"
```
Add `values-cloud.yaml` to `.gitignore`.
Create `values-cloud.yaml.example` (with placeholder values) and commit it.
**Verify**: `helm template . --values values-cloud.yaml` renders without errors.

## T006 — Add Helm Conditionals for Redpanda
**Files**:
- `helm/todo-chatbot/templates/redpanda-deployment.yaml`: wrap with `{{- if .Values.redpanda.enabled }}`
- `helm/todo-chatbot/templates/dapr-components/pubsub.yaml`: wrap with `{{- if .Values.redpanda.enabled }}`
- `helm/todo-chatbot/templates/dapr-components/pubsub-cloud.yaml` (NEW): cloud SASL config, wrap with `{{- if not .Values.redpanda.enabled }}`
Add to `values.yaml`: `redpanda.enabled: true` (default — local uses Redpanda in K8s)
**Verify**: `helm template . --set redpanda.enabled=false` renders pubsub-cloud.yaml (not pubsub.yaml).

## T007 — Create GitHub Actions Workflow
**File**: `.github/workflows/deploy.yml`
Implement the workflow from spec.md Section 4.1:
- Trigger: push to `main`
- Job 1: Build all 4 Docker images and push to GHCR
- Job 2: Configure kubectl for OKE, run `helm upgrade`
- Create K8s secret from GitHub Secrets before helm upgrade
**Verify**: Workflow file passes `act --dry-run` or GitHub Actions syntax check.

## T008 — Add GitHub Secrets
In GitHub repository → Settings → Secrets and variables → Actions:
Add all secrets from spec.md Section 4.2:
- `OKE_CLUSTER_OCID`, `OCI_CLI_USER`, `OCI_CLI_TENANCY`, `OCI_CLI_FINGERPRINT`
- `OCI_CLI_KEY_CONTENT`, `OCI_CLI_REGION`
- `NEXT_PUBLIC_API_URL` (set to OKE IP after LoadBalancer is provisioned)
- `DATABASE_URL`, `GEMINI_API_KEY`, `BETTER_AUTH_SECRET`
- `KAFKA_SASL_USERNAME`, `KAFKA_SASL_PASSWORD`, `KAFKA_BROKER`
**Verify**: All secrets appear in GitHub Secrets list (values hidden).

## T009 — Initial Manual Deploy to OKE
Before enabling CI/CD, do one manual deploy to verify everything works:
```bash
# Apply Dapr components manually first
kubectl apply -f helm/todo-chatbot/templates/dapr-components/

# Deploy with Helm (cloud values, Always pull policy)
helm upgrade todo-chatbot ./helm/todo-chatbot \
  --install \
  --set redpanda.enabled=false \
  --set backend.image.pullPolicy=Always \
  --set frontend.image.pullPolicy=Always \
  --values values-cloud.yaml

kubectl get pods -w
```
**Verify**: All pods Running (2/2 with Dapr sidecars). `kubectl get svc` shows LoadBalancer with external IP.

## T010 — Trigger CI/CD and Verify End-to-End
```bash
# Make a trivial code change (e.g., update version comment)
git add . && git commit -m "chore: trigger CI/CD test"
git push origin main
```
Watch GitHub Actions → verify all steps green.
After workflow completes: `kubectl get pods` shows updated pods (new image digest).

**Verify**: AC1–AC8 from spec.md all pass.

## T011 — Add Health Endpoints to New Services
**Files**: `src/notification_service/main.py`, `src/recurring_task_service/main.py`
Add to each:
```python
@app.get("/health")
async def health():
    return {"status": "ok"}
```
Update readiness probe in their Helm deployment templates to use `/health`.
**Verify**: `kubectl describe pod <notification-pod>` shows readiness probe Successful.
