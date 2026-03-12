<!--
Sync Impact Report
- Version change: 2.0.0 → 3.0.0
- Rationale for MAJOR bump: Phase 5 introduces fundamentally new scope —
  event-driven architecture (Kafka via Dapr), new microservices (Notification,
  Recurring Task), advanced app features (priorities, tags, recurring tasks,
  reminders), Dapr sidecar runtime, and cloud Kubernetes deployment (Oracle OKE).
  Phase 4's hard guardrails against Kafka/Dapr/cloud are inverted — they are now
  the primary objective.
- Modified principles:
  - IV. Separation of Concerns → extended to cover new microservices
  - VI. Stateless Backend → extended to cover Dapr state management
  - VII. Production-Ready Standards → extended with Dapr, CI/CD, cloud registry
  - IX. Database Standards → extended with new columns (priority, tags, due_date, recurring)
- Added principles:
  - XV. Event-Driven Architecture (Kafka via Dapr Pub/Sub)
  - XVI. Dapr Sidecar Runtime
  - XVII. Microservice Design
  - XVIII. Cloud Deployment Standards
  - XIX. CI/CD Pipeline
- Retained: All 14 principles from Phase 3 (I–XIV) intact as foundation
- New specs start at 009 (specs 001–008 frozen from Phases 2–4)
-->

# Hackathon II — Phase 5 Advanced Cloud Deployment Constitution

## Core Principles

### I. Zero Trust Backend
Backend MUST never trust frontend-provided `user_id`. All user identity MUST be derived
exclusively from a verified JWT. Every protected endpoint MUST require a valid JWT in the
`Authorization: Bearer <token>` header. This applies to all chat, task, and new feature endpoints.
New microservices (Notification, Recurring Task) MUST verify events originate from Dapr — not
accept arbitrary HTTP calls from the internet.

### II. Strict User Isolation
Every task, conversation, reminder, and recurring task MUST belong to exactly one user.
No user may access, modify, or delete another user's data. Ownership MUST be enforced at
the database query level. Kafka events MUST include `user_id` so consuming services
maintain isolation without re-querying the JWT.

### III. Spec-Driven Development
No manual coding outside approved specifications. All features MUST be defined in Markdown
specs before implementation. Each spec MUST include: Purpose, Constraints, Expected behavior,
Error cases, and Acceptance criteria. The workflow is:
Spec → Plan → Tasks → Implement → Verify.
PHR (Prompt History Record) MUST be written after each significant implementation session.

### IV. Separation of Concerns
- Frontend: UI, auth session, chat interface, advanced feature forms.
- Backend (main): Data persistence, authorization, agent orchestration, MCP tools, Kafka event publishing.
- MCP Server: Tool interface between AI agent and task data.
- Notification Service: Consumes `reminders` topic, delivers notifications. No business logic.
- Recurring Task Service: Consumes `task-events` (completed recurring tasks), creates next occurrence.
- Dapr: Infrastructure abstraction layer — Pub/Sub, State, Secrets, Service Invocation, Jobs.
- Database: Integrity, history, constraints.
No business logic leakage across layers. New microservices MUST NOT import from the main backend.

### V. Deterministic API Contracts
All endpoints MUST have defined request/response schemas. All error responses MUST be explicit.
Status codes MUST follow REST standards. Kafka event schemas MUST be documented before
producer/consumer implementation. Dapr component YAML MUST be reviewed before sidecar deployment.

### VI. Stateless Backend & Dapr State
Backend MUST NOT rely on in-memory session state beyond request scope. All task state in
Neon DB. Conversation state MAY be cached in Dapr statestore (PostgreSQL backend) as a
performance layer — but Neon DB remains the source of truth. The AI agent MUST be stateless
per-request. Dapr statestore is additive, not a replacement for the DB.

### VII. Production-Ready Standards
- All secrets via K8s Secrets or Dapr Secrets API — never hardcoded.
- `GEMINI_API_KEY`, `DATABASE_URL`, `BETTER_AUTH_SECRET`, `REDPANDA_*` credentials in Secrets only.
- Docker images pushed to GitHub Container Registry (GHCR).
- CI/CD pipeline in `.github/workflows/deploy.yml`.
- `.env.example` committed; `.env` and `values-secrets.yaml` gitignored.
- All Dapr component YAML files committed (they reference Secrets, not embed them).

### VIII. Security Standards
- JWT verification on every protected request (unchanged from Phase 3).
- Expired/missing/malformed tokens → 401.
- Unauthorized resource access → 403/404 per spec.
- Dapr sidecar: mTLS between services (enabled by default in Dapr).
- Redpanda/Kafka: SASL_SSL in cloud, plain internal in Minikube.
- New microservices: only accept Dapr-routed calls (`/dapr/subscribe`, `/api/jobs/trigger`).
- `GEMINI_API_KEY` never in frontend code or client-side bundles.

### IX. Database Standards
Use SQLModel ORM. Include `created_at` / `updated_at` on all records. Enforce NOT NULL
where appropriate. New columns for Phase 5:
- `todos.priority` — enum: high/medium/low, default medium
- `todos.tags` — JSON array of strings, default `[]`
- `todos.due_date` — nullable datetime with timezone
- `todos.is_recurring` — boolean, default false
- `todos.recurrence_frequency` — nullable enum: daily/weekly/monthly
- `todos.reminder_sent` — boolean, default false
Add DB indexes on `user_id`, `due_date`, `priority` for query performance.

### X. Frontend Standards
MUST use Next.js App Router. MUST use Better Auth. All protected API calls include
`Authorization: Bearer <token>`. UI MUST be responsive. Chat UI extended to understand
new task fields (priority, tags, due dates). New UI components for: priority badge,
tag chips, due date picker, recurring toggle, filter/sort controls.

### XI. AI Agent Architecture
The AI agent (Gemini) MUST be extended to handle new fields:
- Understand priority in natural language ("add urgent task", "show high priority items")
- Understand due dates ("remind me tomorrow", "due next Friday")
- Understand recurring ("every week", "daily standup")
MCP tools MUST be extended to accept and return new fields. The agent MUST publish
events via Dapr pub/sub after task mutations — this is the trigger for Kafka event flow.

### XII. MCP Tool Design
5 core tools retained. Extended to accept new parameters:
- `add_task`: + `priority`, `tags`, `due_date`, `is_recurring`, `recurrence_frequency`
- `list_tasks`: + `filter_priority`, `filter_tag`, `search_query`, `sort_by`
- `update_task`: + all new fields
- `complete_task`: unchanged (but now triggers Kafka event)
- `delete_task`: unchanged (but now publishes deletion event)
After any mutation, backend MUST publish to `task-events` Kafka topic via Dapr.

### XIII. Conversation Persistence
Unchanged from Phase 3. All conversation state in Neon PostgreSQL. Dapr statestore
provides optional caching layer — NOT a replacement.

### XIV. AI Provider Abstraction
Google Gemini (`gemini-2.5-flash` or `gemini-1.5-flash`). Configurable via `GEMINI_MODEL`
env var. API key via Dapr Secrets API in Phase 5 (not raw env var).

### XV. Event-Driven Architecture
ALL task mutations MUST publish events to Kafka (via Dapr Pub/Sub):
- Every add/update/delete/complete → `task-events` topic
- Due date set → `reminders` topic (reminder payload with `remind_at`)
- Task state change → `task-updates` topic (for future real-time sync)
Events MUST be published AFTER successful DB write — never before.
Event schema MUST include: `event_type`, `task_id`, `task_data`, `user_id`, `timestamp`.
Publishing failures MUST be logged but MUST NOT cause the API to return an error
(event publishing is best-effort in Phase 5).

### XVI. Dapr Sidecar Runtime
ALL pods in the Kubernetes cluster MUST have Dapr sidecar injected:
- Annotation `dapr.io/enabled: "true"` on every Deployment pod spec
- Annotation `dapr.io/app-id` unique per service
- Annotation `dapr.io/app-port` matching the container port
Application code MUST use Dapr HTTP API (`localhost:3500`) for:
- Pub/Sub publishing and subscription
- State read/write (conversation cache)
- Jobs API (reminder scheduling)
- Secrets loading
- Service invocation
Direct Kafka client libraries (kafka-python, aiokafka) MUST NOT be used in app code.
Direct psycopg2 for state cache MUST NOT be used — use Dapr state API.

### XVII. Microservice Design
New microservices (Notification Service, Recurring Task Service) MUST:
- Be minimal FastAPI apps — single responsibility only
- Subscribe to Dapr pub/sub topics via `POST /dapr/subscribe` endpoint
- Be independently deployable (own Dockerfile, own requirements.txt)
- Have NO imports from the main backend codebase
- Handle Dapr job callbacks via `POST /api/jobs/trigger`
- Be stateless themselves — read/write only via Dapr APIs

### XVIII. Cloud Deployment Standards
- Cloud provider: Oracle OKE (recommended — always free) / Azure AKS / GKE
- All K8s manifests via the existing Helm chart (extended for Phase 5)
- `imagePullPolicy: Always` on cloud (images from GHCR)
- `imagePullPolicy: Never` on Minikube (local images)
- Redpanda Cloud (free serverless) for managed Kafka on cloud
- Ingress with public LoadBalancer IP on cloud (not `todo.local`)
- TLS (HTTPS) via cert-manager + Let's Encrypt if custom domain used

### XIX. CI/CD Pipeline
GitHub Actions workflow MUST:
1. Trigger on push to `main` branch
2. Build Docker images for backend, frontend, notification service, recurring task service
3. Push to GHCR (`ghcr.io/<username>/todo-<service>:latest`)
4. Run `helm upgrade --install` against cloud cluster using kubeconfig secret
All secrets (KUBECONFIG, GHCR token, etc.) stored as GitHub Secrets — never in YAML files.

---

## Technology Stack

### Inherited (Phases 2–4 — All Retained)
| Component | Technology | Required |
|-----------|-----------|---------|
| Frontend | Next.js 16+ (App Router) | Yes |
| Backend | FastAPI (Python 3.11+) | Yes |
| ORM | SQLModel | Yes |
| Database | Neon Serverless PostgreSQL | Yes |
| Auth | Better Auth + JWT | Yes |
| CSS | Tailwind CSS | Yes |
| AI | Google Gemini (google-genai SDK) | Yes |
| MCP | Official Python MCP SDK | Yes |
| Containers | Docker + Helm | Yes |
| Local K8s | Minikube | Yes |

### Phase 5 Stack (New — All Required)
| Component | Technology | Required |
|-----------|-----------|---------|
| Event Streaming | Kafka via Redpanda (local: Docker, cloud: Redpanda Cloud) | Yes |
| Distributed Runtime | Dapr (sidecar, all 5 building blocks) | Yes |
| Cloud K8s | Oracle OKE / Azure AKS / GKE | Yes |
| CI/CD | GitHub Actions | Yes |
| Image Registry | GHCR (GitHub Container Registry) | Yes |
| New Microservices | Notification Service + Recurring Task Service (FastAPI) | Yes |

---

## Agent Roster

| Agent ID | Domain |
|----------|--------|
| `auth-security` | JWT, Better Auth (Phase 2 — retained) |
| `neon-db-specialist` | Schema, new columns, migrations |
| `fastapi-backend` | API routes, new features, Dapr pub/sub publishing |
| `nextjs-frontend` | New UI: priority, tags, due dates, filters |
| `mcp-server-specialist` | Extended MCP tools with new fields |
| `ai-agent-specialist` | Gemini agent, extended understanding of new fields |
| `dapr-specialist` | Dapr components, sidecar config, building blocks |
| `kafka-specialist` | Redpanda setup, topic creation, event schemas |
| `cloud-devops` | OKE/AKS/GKE, Helm cloud values, CI/CD pipeline |

---

## Success Criteria

### Phase 2–4 (All Retained)
1–16. All Phase 2–4 criteria still apply (see Phase 3 constitution for details).

### Phase 5 (New)
17. Priority, tags, search, filter, sort work end-to-end in UI and via chatbot.
18. Recurring tasks auto-create next occurrence after completion (via Kafka consumer).
19. Reminders publish to Kafka when due date set; Notification Service consumes.
20. Dapr sidecar injected and running on all pods (2/2 containers per pod).
21. All 5 Dapr building blocks operational (Pub/Sub, State, Jobs, Secrets, Invoke).
22. App deployed and accessible on cloud Kubernetes cluster.
23. GitHub Actions CI/CD pipeline runs successfully on push to main.
24. Redpanda Cloud connected and messages flowing through all 3 topics.
25. `https://<cloud-ip>` serves the app (or custom domain).

---

## Spec Numbering

| Spec | Feature | Status |
|------|---------|--------|
| 001–003 | Phase 2 (identity, persistence, frontend) | Frozen |
| 004–007 | Phase 3 (conversation, MCP, agent, chatkit) | Frozen |
| 008 | Phase 4 (K8s deployment) | Frozen |
| **009** | **Intermediate Features** | Active |
| **010** | **Advanced Features + Kafka** | Active |
| **011** | **Dapr Integration** | Active |
| **012** | **Cloud Deployment + CI/CD** | Active |

---

## Governance
- This constitution supersedes the Phase 4 constitution for all Phase 5 work.
- All previous principles (I–XIV) retained; new principles (XV–XIX) added.
- Amendments require documentation, version bump, propagation to templates.
- PHR required after every implementation session.
- Complexity MUST be justified; default to simplest viable solution.

**Version**: 3.0.0 | **Ratified**: 2026-03-12 | **Last Amended**: 2026-03-12
