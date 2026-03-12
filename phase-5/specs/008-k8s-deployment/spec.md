# Spec-008: Local Kubernetes Deployment

**Phase:** 4
**Feature:** Deploy Todo AI Chatbot to Minikube using Helm Charts
**Status:** Active

---

## 1. Overview

Deploy the Phase 3 Todo AI Chatbot (Next.js frontend + FastAPI backend + MCP server) to a local
Kubernetes cluster using Minikube. The application must be accessible via `http://todo.local` through
an nginx Ingress controller and remain fully functional (auth, chat, todos) after deployment.

---

## 2. Requirements

### 2.1 Containerization
- [ ] Backend Docker image built from existing root `Dockerfile` (FastAPI + MCP, port 7860)
- [ ] Frontend Docker image built from new `src/frontend/Dockerfile` (Next.js standalone, port 3000)
- [ ] Both images loadable into Minikube without a registry
- [ ] `docker-compose.yml` for local smoke test before K8s deployment

### 2.2 Helm Chart
- [ ] Single Helm chart `todo-chatbot` at `helm/todo-chatbot/`
- [ ] Chart includes: Backend Deployment + Service, Frontend Deployment + Service, Ingress, ConfigMap, Secret
- [ ] `values.yaml` documents all configurable parameters
- [ ] `helm lint` passes with no errors or warnings
- [ ] `helm template` renders valid Kubernetes manifests

### 2.3 Kubernetes Deployment
- [ ] Both pods reach `Running` state within 2 minutes of `helm install`
- [ ] Backend readiness probe: `GET /api/health` returns HTTP 200
- [ ] Frontend readiness probe: `GET /` returns HTTP 200
- [ ] K8s Secrets store: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GEMINI_API_KEY`
- [ ] ConfigMap stores: `FRONTEND_URL`, `BETTER_AUTH_URL`, `GEMINI_MODEL`
- [ ] Resource limits set on all containers (CPU: 500m, Memory: 512Mi)

### 2.4 Ingress & Routing
- [ ] Minikube nginx ingress addon enabled
- [ ] `todo.local` resolves to Minikube IP (via /etc/hosts on Windows: C:\Windows\System32\drivers\etc\hosts)
- [ ] `GET http://todo.local/api/health` → backend → `{"status": "ok"}`
- [ ] `GET http://todo.local/` → frontend HTML
- [ ] `POST http://todo.local/api/chat` → AI response (with valid JWT)

### 2.5 End-to-End Verification
- [ ] User can sign up and sign in through `http://todo.local`
- [ ] User can create, list, complete, delete todos through the chat interface
- [ ] JWT JWKS verification works (backend fetches from frontend via internal K8s DNS)
- [ ] Pod restart (`kubectl rollout restart`) preserves all data (in Neon DB)

---

## 3. Technology Stack

| Component       | Technology                     | Version      |
| --------------- | ------------------------------ | ------------ |
| Containerization| Docker Desktop                 | 29.2.1       |
| Orchestration   | Kubernetes (Minikube)          | v1.35.1      |
| Package Manager | Helm                           | 3.x          |
| Ingress         | nginx (minikube addon)         | latest       |
| AI DevOps       | kubectl-ai, kagent, Gordon     | latest       |
| Backend image   | python:3.11-slim base          | —            |
| Frontend image  | node:20-alpine base            | —            |

---

## 4. Acceptance Criteria

| ID  | Criterion                                               | Verification                              |
| --- | ------------------------------------------------------- | ----------------------------------------- |
| AC1 | Both Docker images build successfully                   | `docker build` exits 0                    |
| AC2 | `docker-compose up` runs both services                  | `curl localhost:7860/api/health` → 200    |
| AC3 | `helm lint` passes                                      | No errors in output                       |
| AC4 | Both pods Running after `helm install`                  | `kubectl get pods` → 2/2 Running          |
| AC5 | Ingress routes correctly                                | `curl http://todo.local/api/health` → 200 |
| AC6 | Frontend loads in browser                               | `http://todo.local` → Todo app UI         |
| AC7 | End-to-end auth + chat works                            | Sign in → send chat message → AI responds |

---

## 5. Out of Scope

- Cloud deployment (DigitalOcean, Azure, GKE) — Phase 5
- Kafka, Dapr, event-driven architecture — Phase 5
- CI/CD pipelines
- Horizontal Pod Autoscaling
- Persistent volumes (DB is external Neon)
- New application features
