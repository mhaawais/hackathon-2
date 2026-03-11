# Plan-008: Local Kubernetes Deployment

## Architecture Decisions

### AD1: Standalone Next.js Build for Docker
Next.js `output: "standalone"` produces a minimal self-contained server bundle — no need to
copy `node_modules` into the final image. Reduces image size significantly (~200MB vs ~1GB).

### AD2: Minikube Local Registry via `minikube image load`
No external registry needed. Build images locally, load them into Minikube's Docker daemon
with `minikube image load`. Set `imagePullPolicy: Never` in Helm values so K8s uses cached images.

### AD3: JWKS via Internal K8s DNS
Backend fetches JWKS from `http://todo-chatbot-frontend:3000/api/auth/jwks` (pod-to-pod).
This avoids circular dependency on the Ingress and works without DNS resolution of `todo.local`
inside the cluster.

### AD4: NEXT_PUBLIC_API_URL Baked at Build Time
Next.js public env vars (`NEXT_PUBLIC_*`) are inlined at build time. The build arg
`NEXT_PUBLIC_API_URL=http://todo.local/api` is passed to `docker build`. This means the image
is tied to the `todo.local` hostname — acceptable for local Minikube deployment.

### AD5: Single Helm Chart (Umbrella Pattern)
Both services in one chart for simplicity. A production setup would use separate charts, but
for a hackathon the unified chart is easier to install, upgrade, and demonstrate.

## Deployment Flow

```
1. minikube start --driver=docker --memory=2048 --cpus=2
2. minikube addons enable ingress
3. Build backend image:
   docker build -t todo-backend:latest .
   minikube image load todo-backend:latest
4. Build frontend image:
   docker build --build-arg NEXT_PUBLIC_API_URL=http://todo.local/api \
     -t todo-frontend:latest ./src/frontend/
   minikube image load todo-frontend:latest
5. Create secrets file (values-secrets.yaml — gitignored)
6. helm install todo-chatbot ./helm/todo-chatbot -f values-secrets.yaml
7. Add Minikube IP to hosts file
8. Verify: curl http://todo.local/api/health
```

## File Plan

| File | Purpose |
|------|---------|
| `src/frontend/Dockerfile` | Multi-stage Next.js standalone build |
| `src/frontend/next.config.ts` | Add `output: "standalone"` |
| `docker-compose.yml` | Local smoke test (no K8s) |
| `helm/todo-chatbot/Chart.yaml` | Chart metadata |
| `helm/todo-chatbot/values.yaml` | Default configuration |
| `helm/todo-chatbot/templates/_helpers.tpl` | Name helpers |
| `helm/todo-chatbot/templates/backend-deployment.yaml` | Backend K8s Deployment |
| `helm/todo-chatbot/templates/backend-service.yaml` | Backend ClusterIP Service |
| `helm/todo-chatbot/templates/frontend-deployment.yaml` | Frontend K8s Deployment |
| `helm/todo-chatbot/templates/frontend-service.yaml` | Frontend ClusterIP Service |
| `helm/todo-chatbot/templates/ingress.yaml` | Nginx Ingress |
| `helm/todo-chatbot/templates/configmap.yaml` | Non-secret env vars |
| `helm/todo-chatbot/templates/secret.yaml` | Sensitive env vars |
| `values-secrets.yaml.example` | Secrets override template (committed) |
