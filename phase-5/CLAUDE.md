# Claude Code Rules — Hackathon II, Phase 5: Advanced Cloud Deployment

> **Scope lock:** This file governs **Phase 5 ONLY**.
> Phases 1–4 are **complete and frozen**. Phase 5 lifts all Phase 4 guardrails and
> introduces Kafka, Dapr, advanced features, and cloud-grade Kubernetes.

---

## 1. Project Overview

| Dimension          | Value                                                                  |
| ------------------ | ---------------------------------------------------------------------- |
| **Project**        | Todo AI Chatbot — Advanced Cloud Deployment                            |
| **Phase**          | 5 of Hackathon II (extends Phase 4 with Kafka, Dapr, cloud K8s)        |
| **Frontend**       | Next.js (extended with advanced features UI)                           |
| **Backend**        | FastAPI + MCP + Gemini (extended with Kafka producers, Dapr sidecar)   |
| **New Services**   | Notification Service, Recurring Task Service (Python microservices)    |
| **Messaging**      | Kafka via Redpanda Cloud (cloud) / Redpanda Docker (local)             |
| **Runtime**        | Dapr (sidecar on every pod — Pub/Sub, State, Jobs, Secrets, Invoke)    |
| **Orchestration**  | Kubernetes — Minikube (local) + Oracle OKE (cloud, recommended)        |
| **CI/CD**          | GitHub Actions (build → push → deploy)                                 |
| **Database**       | Neon PostgreSQL (external — extended schema for new features)          |
| **Auth**           | Better Auth + JWT (unchanged from Phase 3)                             |

### 1.1 What Phase 5 Adds on Top of Phase 4

| Addition | Description |
|----------|-------------|
| **Intermediate Features** | Priorities, Tags/Categories, Search, Filter, Sort |
| **Advanced Features** | Recurring Tasks, Due Dates, Time Reminders |
| **Kafka (3 topics)** | `task-events`, `reminders`, `task-updates` via Redpanda |
| **New Microservices** | Notification Service, Recurring Task Service |
| **Dapr Sidecar** | Pub/Sub, State, Jobs API, Secrets, Service Invocation |
| **Cloud K8s** | Oracle OKE (recommended) / Azure AKS / GKE |
| **CI/CD Pipeline** | GitHub Actions: build → push to registry → helm upgrade |
| **Monitoring** | Basic logging + health monitoring |

### 1.2 Development Phases (in order)

```
Part A: App Features  →  Spec-009 (Intermediate) + Spec-010 (Advanced + Kafka backend)
Part B: Dapr          →  Spec-011 (Dapr sidecar, all 5 building blocks, local Minikube)
Part C: Cloud         →  Spec-012 (Oracle OKE, CI/CD, monitoring, Redpanda Cloud)
```

### 1.3 Non-Goals

- No payment processing, no user roles beyond single-user tasks
- No mobile native app
- No real-time WebSocket in Phase 5 (Kafka + Notification Service handles async notifications)
- No changes to Phase 1–4 directories (frozen)

---

## 2. Spec-Driven Development (SDD) Workflow — Mandatory

```
1. Spec    →  /specs/<feature>/spec.md
2. Plan    →  /specs/<feature>/plan.md
3. Tasks   →  /specs/<feature>/tasks.md
4. Implement → Code changes per task
5. Verify  →  tests, kubectl get pods, curl, helm status
```

Phase 5 spec numbering starts at **009** (specs 001–008 are frozen from Phases 2–4).

PHR (Prompt History Record) MUST be created after every significant implementation session.
PHR files go in: `history/prompts/009-phase5-<feature>/`

---

## 3. Architecture

### Local (Minikube + Dapr)

```
Minikube Cluster
├── todo-chatbot-backend         (FastAPI + MCP + Dapr sidecar)
├── todo-chatbot-frontend        (Next.js + Dapr sidecar)
├── todo-notification-service    (Python + Dapr sidecar)
├── todo-recurring-task-service  (Python + Dapr sidecar)
├── Dapr control plane           (dapr-operator, dapr-sidecar-injector)
├── Redpanda (Kafka-compatible)  (single pod, ephemeral)
└── Nginx Ingress                (todo.local)

Dapr Components:
├── pubsub.kafka     → Redpanda broker (task-events, reminders, task-updates)
├── state.postgresql → Neon DB (conversation state)
├── dapr-jobs        → Scheduled reminder triggers
└── secretstores.k8s → K8s Secrets (API keys, DB URL)
```

### Cloud (Oracle OKE + Redpanda Cloud)

```
Oracle OKE Cluster
├── Same Helm chart as local (values override for cloud)
├── imagePullPolicy: Always (images from GHCR)
├── Redpanda Cloud (managed Kafka, free serverless tier)
├── Neon PostgreSQL (external, unchanged)
└── Public LoadBalancer Ingress (todo.yourdomain / OKE IP)

CI/CD (GitHub Actions):
  push to main → build images → push to GHCR → helm upgrade on OKE
```

---

## 4. Kafka Topics & Event Schemas

| Topic | Producer | Consumer | Purpose |
|-------|----------|----------|---------|
| `task-events` | Backend (MCP tools) | Recurring Task Service, Audit | All CRUD ops |
| `reminders` | Backend (when due date set) | Notification Service | Reminder triggers |
| `task-updates` | Backend | WebSocket/frontend (future) | Real-time sync |

**Event Schema (task-events):**
```json
{
  "event_type": "created|updated|completed|deleted",
  "task_id": 1,
  "task_data": { ... },
  "user_id": "uuid",
  "timestamp": "ISO8601"
}
```

---

## 5. Dapr Building Blocks (All 5 Required)

| Building Block | Implementation |
|---------------|---------------|
| **Pub/Sub** | Backend publishes to Kafka via `POST /v1.0/publish/kafka-pubsub/{topic}` |
| **State** | Conversation state: `POST /v1.0/state/statestore` |
| **Service Invocation** | Frontend → Backend via `GET /v1.0/invoke/backend/method/api/chat` |
| **Jobs API** | Schedule exact-time reminders: `POST /v1.0-alpha1/jobs/reminder-{task_id}` |
| **Secrets** | Load secrets: `GET /v1.0/secrets/kubernetes-secrets/{key}` |

---

## 6. New App Features (Part A)

### Intermediate (all required)
- **Priorities** — high / medium / low on each task
- **Tags/Categories** — labels (work, home, personal, etc.)
- **Search** — full-text search on task title/description
- **Filter** — by status (open/done), priority, due date range
- **Sort** — by due date, priority, created_at, alphabetical

### Advanced (all required)
- **Recurring Tasks** — frequency: daily/weekly/monthly. On completion → publish to `task-events` → Recurring Task Service auto-creates next occurrence
- **Due Dates** — datetime field on task with timezone support
- **Reminders** — at due time: publish to `reminders` topic → Notification Service handles delivery

---

## 7. Environment Variables

### Backend Pod (Phase 5 additions)
| Variable | Source | Value |
|----------|--------|-------|
| `KAFKA_BROKER` | ConfigMap | `localhost:3500` (via Dapr pub/sub) |
| `DAPR_HTTP_PORT` | ConfigMap | `3500` |
| `NOTIFICATION_SERVICE_ID` | ConfigMap | `todo-notification-service` |
| `RECURRING_SERVICE_ID` | ConfigMap | `todo-recurring-task-service` |

### New Services
| Variable | Source | Value |
|----------|--------|-------|
| `DAPR_HTTP_PORT` | ConfigMap | `3500` |
| `DATABASE_URL` | Secret | Neon PostgreSQL |
| `GEMINI_API_KEY` | Dapr Secrets | Via Dapr secrets API |

---

## 8. Repository Structure (Phase 5 Additions)

```
phase-5/
├── CLAUDE.md                              # This file (updated for Phase 5)
├── Dockerfile                             # Backend (updated — Kafka producer support)
├── src/
│   ├── backend/                           # Extended — new features + Dapr pub/sub
│   │   └── app/
│   │       ├── models/todo.py             # Extended — priority, tags, due_date, recurring
│   │       ├── routes/todos.py            # Extended — search, filter, sort
│   │       ├── services/kafka_service.py  # NEW — publish events via Dapr
│   │       └── services/reminder_service.py # NEW — schedule reminders via Dapr Jobs
│   ├── frontend/                          # Extended — new features UI
│   ├── mcp/                               # Extended — updated tools for new fields
│   ├── notification_service/              # NEW microservice
│   │   ├── main.py
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── recurring_task_service/            # NEW microservice
│       ├── main.py
│       ├── Dockerfile
│       └── requirements.txt
├── helm/
│   └── todo-chatbot/                      # Extended — Dapr annotations, new services
│       ├── values.yaml                    # Updated
│       └── templates/
│           ├── dapr-components/           # NEW — Dapr YAML components
│           ├── notification-deployment.yaml # NEW
│           ├── recurring-deployment.yaml    # NEW
│           └── redpanda-deployment.yaml     # NEW (local only)
├── .github/
│   └── workflows/
│       └── deploy.yml                     # NEW — CI/CD pipeline
├── specs/
│   ├── 009-intermediate-features/        # NEW
│   ├── 010-advanced-features-kafka/       # NEW
│   ├── 011-dapr-integration/              # NEW
│   └── 012-cloud-deployment/              # NEW
└── history/
    └── prompts/
        └── 009-phase5-*/                  # PHR files
```

---

## 9. Verification & Acceptance Criteria

### Part A (Features)
- [ ] Priority field on tasks (high/medium/low) — CRUD + filter
- [ ] Tags on tasks — add/remove/filter by tag
- [ ] Search returns correct results for keyword queries
- [ ] Sort by due_date, priority, created_at works correctly
- [ ] Recurring task auto-creates next occurrence after completion
- [ ] Reminder event published when due date is set
- [ ] AI chatbot understands new fields ("add high priority task", "show urgent tasks")

### Part B (Dapr Local)
- [ ] `dapr init -k` succeeds on Minikube
- [ ] All pods show Dapr sidecar injected (2/2 containers)
- [ ] Pub/Sub: task event published to Kafka and consumed by notification service
- [ ] State: conversation state saved/loaded via Dapr state API
- [ ] Jobs: reminder scheduled and callback fires at correct time
- [ ] Secrets: app loads GEMINI_API_KEY via Dapr secrets API

### Part C (Cloud)
- [ ] OKE cluster created and kubectl configured
- [ ] All pods Running on cloud cluster
- [ ] `https://<oke-ip>` serves the app
- [ ] GitHub Actions CI/CD pipeline runs on push to main
- [ ] Redpanda Cloud topics created and connected

---

## 10. Code Standards

- **Dapr calls:** Always use `httpx.AsyncClient` for async Dapr HTTP calls — never `requests`.
- **Kafka events:** Published via Dapr pub/sub only — never direct Kafka client in app code.
- **New microservices:** FastAPI-based, minimal — only consume Dapr events, no shared code with main backend.
- **DB migrations:** Use Alembic or SQLModel `create_all` (acceptable for hackathon) when adding new columns.
- **Secrets in CI/CD:** Use GitHub Secrets — never hardcode in workflow YAML.
- **Image registry:** GitHub Container Registry (GHCR) — free for public repos.
- **Dapr sidecar annotation:** Add `dapr.io/enabled: "true"` and `dapr.io/app-id` to all pod templates.
