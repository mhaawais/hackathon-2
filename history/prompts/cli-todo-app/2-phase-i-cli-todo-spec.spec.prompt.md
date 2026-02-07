---
id: 2
title: Phase I CLI Todo Spec
stage: spec
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: cli-todo-app
branch: 001-cli-todo-app
user: user
command: /sp.specify
labels: ["spec", "phase-1", "cli", "todo", "python"]
links:
  spec: specs/001-cli-todo-app/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-cli-todo-app/spec.md
  - specs/001-cli-todo-app/checklists/requirements.md
tests:
  - none
---

## Prompt

/sp.specify

Phase I — In-Memory Python Console Todo App

Target:
Hackathon judges evaluating Spec-Driven Development using Claude Code.

Focus:
Demonstrate clean Spec → Plan → Tasks → Implement workflow by building a deterministic, in-memory Python CLI Todo application supporting the five core operations: add, list, update, complete, delete.

Success Criteria:
- All five commands work end-to-end without crashes.
- Input validation enforced for title, description, and IDs.
- Deterministic auto-increment task IDs per session.
- Clear, readable CLI output and helpful error messages.
- README enables setup and verification in under 2 minutes.
- Implementation is fully generated via Claude Code from specs.

Constraints:
- Language: Python
- Storage: In-memory only (no files, no database)
- Interface: Command-line only
- Architecture: simple modular structure (models, store, cli)
- No manual code edits — refine spec if output is incorrect.

Required Features:
- Add task (title required, description optional)
- List tasks (all, or filtered by status)
- Update task (title and/or description by ID)
- Complete task (by ID)
- Delete task (by ID)

## Response snapshot

Created feature branch `001-cli-todo-app` and wrote the Phase I specification at `specs/001-cli-todo-app/spec.md`. The spec defines 5 user stories (Add P1, List P1, Complete P2, Update P2, Delete P3) with 19 acceptance scenarios, 15 functional requirements, 6 edge cases, 5 success criteria, and 5 assumptions. Quality checklist passed all items — no [NEEDS CLARIFICATION] markers. Ready for `/sp.plan`.

## Outcome

- Impact: Established the complete specification for Phase I, enabling plan and task generation.
- Tests: none (specification artifact, no code)
- Files: specs/001-cli-todo-app/spec.md, specs/001-cli-todo-app/checklists/requirements.md
- Next prompts: /sp.plan to create the implementation plan, or /sp.clarify to refine
- Reflection: User input was comprehensive — no clarification markers needed. All acceptance scenarios are concrete Given/When/Then.

## Evaluation notes (flywheel)

- Failure modes observed: PowerShell create-new-feature.ps1 errored on positional params but branch was created successfully; manual spec write completed the flow.
- Graders run and results (PASS/FAIL): Quality checklist PASS (all items checked)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Proceed to /sp.plan for Phase I architecture
