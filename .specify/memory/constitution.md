<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0 (initial ratification)
- Added principles: Spec as Truth, Deterministic Reproducibility, Security by Default, Stateless Services, Cloud-Native Evolution, Observability & Maintainability
- Added sections: Engineering Standards, Hackathon Phase Quality Gates
- Templates requiring updates: ✅ N/A (fresh project, templates are generic)
- Follow-up TODOs: none
-->

# Hackathon II — The Evolution of Todo Constitution

## Core Principles

### I. Spec as Truth
Every feature starts with a written spec (inputs/outputs, acceptance criteria, edge cases). Implementation MUST trace back to spec sections and task IDs. No application code is written manually — all changes are driven by specs, plans, and tasks. If generated code is incorrect, refine the spec, acceptance criteria, or tasks.

### II. Deterministic Reproducibility
Setup and execution MUST be reproducible on a fresh machine. Every phase MUST have clear run steps, environment variables, and smoke tests. Build artifacts are deterministic; given the same inputs, outputs MUST be identical.

### III. Security by Default (Phase II+)
Authentication and authorization MUST be enforced at the API boundary. Every task is user-owned; no cross-user access is permitted. Secrets are never committed to the repository; use environment variables and secret managers (Dapr/K8s secrets in later phases). JWTs are validated on the backend with a shared secret.

### IV. Stateless Services (Phase III+)
No server-side session state. Conversation and messages MUST be stored in the database. All agent actions MUST be tool-driven through MCP and persist results to DB. Context is rebuilt from DB on each request.

### V. Cloud-Native Evolution (Phase IV–V)
Container-first mindset. One command to build and run locally. Kubernetes deployable via Helm with sensible defaults. Phase V MUST be event-driven using Kafka + Dapr abstractions. Services publish and subscribe through Dapr sidecars.

### VI. Observability & Maintainability
Structured logs at minimum (request ID / user ID where applicable). Clear error messages for users; detailed logs for developers. Clean modular architecture: separation of UI, API, DB, agent/tools, and infra.

## Engineering Standards

- Prefer simple, boring solutions that pass acceptance criteria.
- Type safety and validation:
  - Phase I: validate inputs; deterministic CLI behavior.
  - Phase II+: request/response schemas validated (FastAPI/Pydantic).
- Testing:
  - Minimum: smoke tests + key unit tests per phase.
  - Phase II+: API tests for auth + ownership boundaries.
  - Phase III+: tool tests ensuring MCP functions are correct and safe.
- Documentation:
  - README MUST be judge-friendly and fast.
  - Include "90-second demo script" in README for judging flow.
- No hardcoded secrets or tokens; use `.env` and docs.
- Smallest viable diff; do not refactor unrelated code.

## Hackathon Phase Quality Gates

Each phase MUST pass its quality gate before progressing:

1. **Phase I** — CLI works end-to-end; no crashes; consistent outputs.
2. **Phase II** — Auth works; user isolation proven; CRUD works; deployed.
3. **Phase III** — Agent uses tools correctly; chat persists; ambiguous intents handled.
4. **Phase IV** — Helm deploy works on Minikube from scratch.
5. **Phase V** — Event-driven flows verified; reminders + recurring proven; cloud deploy works.

## Governance

This constitution is the authoritative governance document for the Hackathon II project. All specs, plans, tasks, and implementations MUST comply with these principles.

- Amendments require: documentation of the change, rationale, and impact assessment.
- Version increments follow semantic versioning (MAJOR.MINOR.PATCH).
- All PRs and reviews MUST verify compliance with these principles.
- Complexity MUST be justified against the principle of smallest viable change.

**Version**: 1.0.0 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-08
