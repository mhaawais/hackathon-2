# Claude Code Rules — Hackathon II, Phase 4: Local Kubernetes Deployment

> **Scope lock:** This file governs **Phase 4 ONLY**.
> Phases 1–3 are **complete and frozen**. Phase 5 (Kafka, Dapr, cloud) is **out of scope**.

---

## 1. Project Overview

| Dimension        | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| **Project**      | Todo AI Chatbot — Kubernetes Deployment                         |
| **Phase**        | 4 of Hackathon II (deploys Phase 3 chatbot to Minikube)         |
| **Frontend**     | Next.js (containerized, standalone build)                       |
| **Backend**      | FastAPI + MCP + Gemini (containerized)                          |
| **Orchestration**| Kubernetes (Minikube) + Helm Charts                             |
| **AI DevOps**    | kubectl-ai, kagent, Gordon (Docker AI Agent)                    |
| **Database**     | Neon PostgreSQL (external — unchanged from Phase 3)             |
| **Auth**         | Better Auth + JWT (unchanged from Phase 3)                      |

### 1.1 What Phase 4 Adds on Top of Phase 3

| Addition                    | Description                                                          |
| --------------------------- | -------------------------------------------------------------------- |
| Frontend Dockerfile         | Multi-stage Next.js standalone container                             |
| Helm chart `todo-chatbot`   | Backend + Frontend deployments, services, ingress, secrets, configmap|
| Minikube deployment         | Local Kubernetes cluster via Docker driver                           |
| Ingress routing             | `todo.local` → frontend, `todo.local/api` → backend                 |
| K8s Secrets                 | DATABASE_URL, BETTER_AUTH_SECRET, GEMINI_API_KEY                    |

### 1.2 Non-Goals (Hard Guardrails)

- No Kafka, Dapr, or event-driven architecture (Phase 5)
- No cloud deployment (DigitalOcean, Azure, GKE) — Phase 5
- No new app features (AI chatbot is complete from Phase 3)
- No CI/CD pipelines
- No modifications to Phase 3 app logic unless a bug blocks K8s deployment

---

## 2. Spec-Driven Development (SDD) Workflow — Mandatory

```
1. Spec    →  /specs/<feature>/spec.md
2. Plan    →  /specs/<feature>/plan.md
3. Tasks   →  /specs/<feature>/tasks.md
4. Implement → Code/YAML changes per task
5. Verify  →  kubectl get pods, helm status, curl tests
```

Phase 4 spec numbering starts at **008** (specs 001–007 are frozen from Phases 2–3).

---

## 3. Architecture

```
Minikube Cluster
├── Namespace: default
├── todo-chatbot-backend   (Deployment + ClusterIP Service, port 7860)
│   └── env from: ConfigMap + Secret
├── todo-chatbot-frontend  (Deployment + ClusterIP Service, port 3000)
│   └── env from: ConfigMap + Secret
└── Ingress (nginx)
    ├── todo.local/api/*  → backend:7860
    └── todo.local/*      → frontend:3000

External:
└── Neon PostgreSQL (DATABASE_URL via K8s Secret)
```

**JWKS Flow:** Backend fetches `http://todo-chatbot-frontend:3000/api/auth/jwks` (pod-to-pod, no ingress needed).

---

## 4. Environment Variables

### Backend Pod
| Variable            | Source      | Value in K8s                          |
| ------------------- | ----------- | ------------------------------------- |
| `DATABASE_URL`      | Secret      | Neon PostgreSQL connection string     |
| `BETTER_AUTH_SECRET`| Secret      | Shared JWT secret                     |
| `GEMINI_API_KEY`    | Secret      | Google Gemini API key                 |
| `GEMINI_MODEL`      | ConfigMap   | `gemini-1.5-flash`                    |
| `FRONTEND_URL`      | ConfigMap   | `http://todo-chatbot-frontend:3000`   |

### Frontend Pod
| Variable              | Source      | Value in K8s                          |
| --------------------- | ----------- | ------------------------------------- |
| `DATABASE_URL`        | Secret      | Neon PostgreSQL connection string     |
| `BETTER_AUTH_SECRET`  | Secret      | Shared JWT secret                     |
| `BETTER_AUTH_URL`     | ConfigMap   | `http://todo.local`                   |
| `NEXT_PUBLIC_API_URL` | Build arg   | `http://todo.local/api` (baked in)    |

---

## 5. Repository Structure (Phase 4 Additions)

```
phase-4/
├── CLAUDE.md                          # This file
├── Dockerfile                         # Backend container (unchanged from Phase 3)
├── src/
│   ├── frontend/
│   │   ├── Dockerfile                 # NEW — Frontend container (standalone)
│   │   └── next.config.ts             # Updated — output: standalone
│   ├── backend/                       # Unchanged (Phase 3 code)
│   └── mcp/                           # Unchanged (Phase 3 code)
├── helm/
│   └── todo-chatbot/                  # NEW — Helm chart
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── _helpers.tpl
│           ├── backend-deployment.yaml
│           ├── backend-service.yaml
│           ├── frontend-deployment.yaml
│           ├── frontend-service.yaml
│           ├── ingress.yaml
│           ├── configmap.yaml
│           └── secret.yaml
├── specs/
│   └── 008-k8s-deployment/            # NEW — Phase 4 spec
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
└── docker-compose.yml                 # Local test before K8s
```

---

## 6. Verification & Acceptance Criteria

- [ ] `docker build` succeeds for both backend and frontend images
- [ ] `docker-compose up` runs both services locally without errors
- [ ] `helm install todo-chatbot ./helm/todo-chatbot` succeeds (no template errors)
- [ ] All pods reach `Running` state: `kubectl get pods`
- [ ] `curl http://todo.local/api/health` returns `{"status": "ok"}`
- [ ] `curl http://todo.local/` returns HTML (frontend)
- [ ] Sign-in works end-to-end through the ingress
- [ ] Chat endpoint returns AI responses through the ingress
- [ ] Pods survive `kubectl rollout restart deployment`

---

## 7. Code Standards

- **Helm templates:** Use `{{ include "todo-chatbot.fullname" . }}` helpers for naming consistency.
- **Secrets:** Never hardcode secrets in `values.yaml`. Use `--set` flags or a secrets override file.
- **Images:** `imagePullPolicy: Never` for locally-built Minikube images.
- **Resources:** Set requests/limits (CPU: 100m/500m, Memory: 128Mi/512Mi) on all containers.
- **Health checks:** Liveness and readiness probes on `/api/health` (backend) and `/` (frontend).
