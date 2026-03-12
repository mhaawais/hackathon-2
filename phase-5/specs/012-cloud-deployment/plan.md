# Plan-012: Cloud Deployment

## Architecture Decisions

### AD1: Oracle OKE Over Other Cloud Providers
OKE always-free tier (4 OCPUs, 24GB RAM) requires no payment method expiry.
GKE/AKS free tiers are more restrictive. OKE is sufficient for all services
+ Dapr control plane + monitoring. Alternative: Azure AKS (student credits).

### AD2: GHCR Over Docker Hub
GitHub Container Registry is free for public repos, integrated with GitHub Actions
via `GITHUB_TOKEN` (no extra secret needed for push). Docker Hub has rate limits
that can fail CI builds during heavy use.

### AD3: Helm Values Override Strategy
Use a single Helm chart with two values files:
- `values.yaml` — shared defaults (local-safe)
- `values-cloud.yaml` — cloud overrides (gitignored, has real secrets)
CI/CD passes `--values values-cloud.yaml` stored as a GitHub Secret (base64 encoded).

### AD4: No Redpanda in Cloud K8s
Cloud deployment uses Redpanda Cloud managed service. `redpanda.enabled: false`
in cloud values disables the Redpanda Deployment/Service templates. The Dapr
pubsub component switches to the SASL-authenticated cloud configuration.

### AD5: Conditional Dapr Component Templates
Two pubsub component files:
- `dapr-components/pubsub.yaml` (rendered when `redpanda.enabled: true`)
- `dapr-components/pubsub-cloud.yaml` (rendered when `redpanda.enabled: false`)
Use Helm `{{- if .Values.redpanda.enabled }}` conditional.

### AD6: OKE LoadBalancer Ingress (Not Nginx for Cloud)
OKE provides a native LoadBalancer service type (OCI Load Balancer).
Instead of Nginx Ingress Controller, use a K8s `Service` of type `LoadBalancer`
for the frontend. Backend accessible via frontend proxy or separate LB.
Simpler than managing Nginx cert-manager for a hackathon demo.

### AD7: CI/CD Secrets via GitHub Secrets (not Vault)
All sensitive values (OCI credentials, DB URL, API keys) stored in GitHub Secrets.
In the workflow, create the K8s Secret on each deploy:
```bash
kubectl create secret generic todo-chatbot-secrets \
  --from-literal=DATABASE_URL=${{ secrets.DATABASE_URL }} \
  --from-literal=GEMINI_API_KEY=${{ secrets.GEMINI_API_KEY }} \
  --dry-run=client -o yaml | kubectl apply -f -
```
This is idempotent (create or update).

## Implementation Order

```
1. Create OCI account → create OKE cluster (1 node, free shape)
2. Configure kubectl for OKE (download kubeconfig from OCI Console)
3. Install Dapr on OKE cluster: `dapr init -k`
4. Create Redpanda Cloud account → create cluster → create 3 topics
5. Create values-cloud.yaml (local, gitignored) with cloud secrets
6. Add Helm conditionals: redpanda.enabled, cloud pubsub component
7. Create .github/workflows/deploy.yml
8. Add all required GitHub Secrets
9. Push to main → verify CI/CD pipeline runs
10. Access app at OKE LoadBalancer IP
```

## OKE Cluster Setup Commands

```bash
# After installing OCI CLI and downloading kubeconfig:
export KUBECONFIG=~/.kube/config-oke

# Verify connection
kubectl get nodes

# Install Dapr on OKE
dapr init -k

# Create K8s Secrets
kubectl create secret generic todo-chatbot-secrets \
  --from-literal=DATABASE_URL="..." \
  --from-literal=BETTER_AUTH_SECRET="..." \
  --from-literal=GEMINI_API_KEY="..." \
  --from-literal=KAFKA_SASL_USERNAME="..." \
  --from-literal=KAFKA_SASL_PASSWORD="..."

# Deploy with Helm
helm upgrade todo-chatbot ./helm/todo-chatbot \
  --install \
  --set redpanda.enabled=false \
  --values values-cloud.yaml
```

## imagePullSecret for GHCR

If the GHCR repo is private, OKE needs pull credentials:
```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<github-user> \
  --docker-password=<github-pat>
```
Add to all deployment templates:
```yaml
imagePullSecrets:
- name: ghcr-secret
```
If repo is public, skip imagePullSecrets entirely.
