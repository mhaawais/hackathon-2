---
id: 0001
title: MCP Task Server Spec Creation
stage: spec
date: 2026-02-27
surface: claude-code
model: claude-sonnet-4-6
feature: 005-mcp-task-server
branch: 005-mcp-task-server
user: LENOVO
command: /sp.specify
labels: [spec, plan, research, contracts, quickstart, mcp, tools, backend]
links:
  spec: specs/005-mcp-task-server/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  created:
    - specs/005-mcp-task-server/spec.md
    - specs/005-mcp-task-server/plan.md
    - specs/005-mcp-task-server/research.md
    - specs/005-mcp-task-server/contracts/tool-contracts.md
    - specs/005-mcp-task-server/quickstart.md
    - specs/005-mcp-task-server/tasks.md
    - history/prompts/005-mcp-task-server/0001-mcp-task-server-spec-creation.spec.prompt.md
  modified: []
tests:
  before: N/A (spec stage)
  after: N/A (spec stage)
---

## Prompt

/sp.specify + /sp.tasks — Generate complete spec artifacts for Spec-5: MCP Task Server.

Context:
- Spec-4 (Conversation Persistence) fully implemented: 32/32 tests passing
- Spec-5 is the next spec in the Phase 3 sequence
- Constitution v2.0.0 mandates: Official Python MCP SDK, 5 tools, stdio transport, todo_service delegation
- AI provider is Google Gemini (not OpenAI)
- Stack: Python 3.11+ + mcp>=1.0.0 + existing todo_service.py (frozen)

## Response snapshot

Created all 6 spec-5 artifacts:

**spec.md**: 4 user stories
- US1 (P1): Add a task via natural language → add_task tool
- US2 (P1): List tasks → list_tasks tool
- US3 (P1): Manage existing tasks → complete_task, delete_task, update_task tools
- US4 (P2): Graceful error handling → structured error responses

Key requirements:
- FR-012: All tools MUST delegate to existing todo_service (no duplicate logic)
- FR-015: stdio transport only
- FR-009/010/011: All tools catch exceptions, return {error, code}, server never crashes

**plan.md**: Architecture diagram showing MCP server → task_tools.py → todo_service.py → Neon PostgreSQL.
Key design decisions:
1. stdio transport (vs HTTP) — simplest for hackathon; agent starts as subprocess
2. Handlers in task_tools.py (vs server.py) — separation of concerns; easier unit testing
3. Pure sync functions do_*() for testability; async handle_*() wrap them with asyncio.to_thread
4. Per-request session creation — MCP server is a separate process
5. Catch HTTPException from todo_service + convert to structured error response

**research.md**: 7 decisions documented with rationale and rejected alternatives.

**contracts/tool-contracts.md**: Full JSON Schema inputSchema and success/error response shapes for all 5 tools. Error code reference table. Spec-6 caller workflow sketch.

**quickstart.md**: Setup guide, expected test output (14 tests), architecture notes.

**tasks.md**: 18 tasks across 7 phases. 14 test cases.

## Outcome

- ✅ All 6 spec artifacts created
- 📁 Files: spec.md, plan.md, research.md, contracts/tool-contracts.md, quickstart.md, tasks.md
- 🔁 Next: Implement T001–T018 per tasks.md
- 🧠 Key decision: Pure sync do_*() layer + async handle_*() wrapper pattern allows full unit test coverage without starting MCP subprocess

## Evaluation notes (flywheel)

- Failure modes observed: None at spec stage
- Graders run: N/A (spec stage)
- Next experiment: Verify `mcp` package import pattern matches actual SDK version installed
