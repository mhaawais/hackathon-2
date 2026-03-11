# Tasks-008: Local Kubernetes Deployment

## T001 — Update next.config.ts for standalone output
**File:** `src/frontend/next.config.ts`
**Change:** Add `output: "standalone"` to NextConfig
**Verify:** `npm run build` in frontend dir produces `.next/standalone/` directory

## T002 — Create Frontend Dockerfile
**File:** `src/frontend/Dockerfile`
**Change:** Multi-stage build (deps → builder → runner). Uses standalone output. Accepts `NEXT_PUBLIC_API_URL` build arg.
**Verify:** `docker build --build-arg NEXT_PUBLIC_API_URL=http://todo.local/api -t todo-frontend:latest ./src/frontend/` exits 0

## T003 — Create docker-compose.yml
**File:** `docker-compose.yml` (root of phase-4)
**Change:** Two services: backend (port 7860→7860) and frontend (port 3000→3000) with env vars from `.env`
**Verify:** `docker-compose up` → both services healthy, `curl localhost:7860/api/health` returns 200

## T004 — Create Helm Chart.yaml
**File:** `helm/todo-chatbot/Chart.yaml`
**Change:** Chart metadata: name=todo-chatbot, version=0.1.0, appVersion=1.0.0
**Verify:** `helm lint ./helm/todo-chatbot` passes

## T005 — Create Helm values.yaml
**File:** `helm/todo-chatbot/values.yaml`
**Change:** Default values for both services: image repos/tags, replicas, ports, ingress host, resource limits
**Verify:** `helm template ./helm/todo-chatbot` renders without errors

## T006 — Create Helm _helpers.tpl
**File:** `helm/todo-chatbot/templates/_helpers.tpl`
**Change:** Define `todo-chatbot.name`, `todo-chatbot.fullname`, `todo-chatbot.labels` helpers
**Verify:** Used in all other templates without errors

## T007 — Create ConfigMap template
**File:** `helm/todo-chatbot/templates/configmap.yaml`
**Change:** K8s ConfigMap with: GEMINI_MODEL, FRONTEND_URL, BETTER_AUTH_URL
**Verify:** `kubectl get configmap` after install shows correct values

## T008 — Create Secret template
**File:** `helm/todo-chatbot/templates/secret.yaml`
**Change:** K8s Secret with base64-encoded: DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY
**Verify:** `kubectl get secret todo-chatbot-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d` shows correct URL

## T009 — Create Backend Deployment + Service templates
**Files:** `helm/todo-chatbot/templates/backend-deployment.yaml`, `backend-service.yaml`
**Change:** Deployment with env from ConfigMap+Secret, readiness probe on /api/health, resource limits. ClusterIP Service on port 7860.
**Verify:** `kubectl get pods` → todo-chatbot-backend-* Running. `kubectl exec` → env vars set correctly.

## T010 — Create Frontend Deployment + Service templates
**Files:** `helm/todo-chatbot/templates/frontend-deployment.yaml`, `frontend-service.yaml`
**Change:** Deployment with env from ConfigMap+Secret, readiness probe on /, resource limits. ClusterIP Service on port 3000.
**Verify:** `kubectl get pods` → todo-chatbot-frontend-* Running.

## T011 — Create Ingress template
**File:** `helm/todo-chatbot/templates/ingress.yaml`
**Change:** nginx Ingress routing `todo.local/api` → backend:7860, `todo.local/` → frontend:3000
**Verify:** `kubectl get ingress` shows ADDRESS. `curl http://todo.local/api/health` returns 200.

## T012 — Build and deploy to Minikube
**Steps:** Enable ingress addon, build images, load to Minikube, helm install with secrets
**Verify:** All AC1–AC7 from spec.md pass

## T013 — Add hosts file entry
**Step:** Add `<minikube-ip> todo.local` to `C:\Windows\System32\drivers\etc\hosts`
**Verify:** `curl http://todo.local/api/health` works from browser and terminal
