---
id: 1
title: Hackathon II Constitution Init
stage: constitution
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: none
branch: master
user: user
command: /sp.constitution
labels: ["constitution", "governance", "hackathon", "initialization"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

/sp.constitution

Project: Hackathon II — The Evolution of Todo (Spec-Driven Development + Cloud Native AI)

Mission:
Build and evolve a Todo system across five phases (CLI → Web → AI Chatbot → Local K8s → Cloud event-driven microservices) using Spec-Driven Development with Claude Code as the primary implementer. The spec is the source of truth. The code must be generated via Claude Code, not hand-written.

Non-negotiable rule:
- DO NOT write application code manually. All changes must be driven by specs, plans, and tasks. If generated code is incorrect, refine the spec, acceptance criteria, or tasks—not manual edits.

Core Principles (Global):
1) Spec as Truth
2) Deterministic Reproducibility
3) Security by Default (Phase II+)
4) Stateless Services (Phase III+)
5) Cloud-Native Evolution (Phase IV–V)
6) Observability & Maintainability

Engineering Standards:
- Prefer simple, boring solutions that pass acceptance criteria.
- Type safety and validation per phase.
- Testing: smoke tests + key unit tests minimum.
- Documentation: judge-friendly README with 90-second demo script.

Hackathon Phase Requirements:
- Phase I: In-Memory Python Console App
- Phase II: Full-Stack Web App (Next.js + FastAPI + SQLModel + Neon)
- Phase III: AI Todo Chatbot (ChatKit + Agents SDK + MCP)
- Phase IV: Local Kubernetes (Minikube + Helm)
- Phase V: Advanced Cloud (Kafka + Dapr + DigitalOcean DOKS)

## Response snapshot

Created the project constitution v1.0.0 at `.specify/memory/constitution.md` with six core principles (Spec as Truth, Deterministic Reproducibility, Security by Default, Stateless Services, Cloud-Native Evolution, Observability & Maintainability), engineering standards, hackathon phase quality gates, and governance rules. All placeholder tokens replaced. Version 1.0.0 ratified 2026-02-08.

## Outcome

- Impact: Established the authoritative governance document for the entire hackathon project across all five phases.
- Tests: none (governance document, no code)
- Files: .specify/memory/constitution.md (created v1.0.0)
- Next prompts: /sp.specify for Phase I (In-Memory Python Console App)
- Reflection: Constitution captures all six principles from user input and maps quality gates to each phase.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A (no code artifacts)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Begin Phase I spec creation
