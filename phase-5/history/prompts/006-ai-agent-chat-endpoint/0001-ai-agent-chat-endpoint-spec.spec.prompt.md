---
id: 0001
title: AI Agent Chat Endpoint Spec
stage: spec
date: 2026-02-27
surface: claude-code
model: claude-sonnet-4-6
feature: 006-ai-agent-chat-endpoint
branch: 006-ai-agent-chat-endpoint
user: LENOVO
command: /sp.specify
labels: [spec, plan, research, contracts, quickstart, tasks, gemini, agent, chat-endpoint]
links:
  spec: specs/006-ai-agent-chat-endpoint/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  created:
    - specs/006-ai-agent-chat-endpoint/spec.md
    - specs/006-ai-agent-chat-endpoint/plan.md
    - specs/006-ai-agent-chat-endpoint/research.md
    - specs/006-ai-agent-chat-endpoint/contracts/api-contract.md
    - specs/006-ai-agent-chat-endpoint/quickstart.md
    - specs/006-ai-agent-chat-endpoint/tasks.md
    - history/prompts/006-ai-agent-chat-endpoint/0001-ai-agent-chat-endpoint-spec.spec.prompt.md
  modified: []
tests:
  before: N/A (spec stage)
  after: N/A (spec stage)
---

## Prompt

/sp.specify + /sp.tasks — Generate complete spec artifacts for Spec-6: AI Agent & Chat Endpoint.

Context:
- Spec-4 (Conversation Persistence): 32/32 tests passing, models + services complete
- Spec-5 (MCP Task Server): 46/46 tests passing, do_*() functions + server.py complete
- google-genai 1.65.0 installed; API surface confirmed (Client, types.Tool, FunctionDeclaration, Schema, Part.from_function_response)
- Key constraint: google-generativeai is deprecated — use google-genai (import google.genai as genai)

## Response snapshot

Created all 6 spec-6 artifacts:

**spec.md**: 4 user stories
- US1 (P1): Start a chat and manage tasks via natural language → agent calls tools, creates conversation
- US2 (P1): Resume previous conversation → history loaded from DB
- US3 (P1): AI correctly invokes task tools → function calling dispatches to do_*()
- US4 (P1): Protected endpoint → 401 without JWT

Key requirements:
- FR-016: user_id injected by server; NOT in function declarations (security)
- FR-017: Agentic loop max 5 iterations
- FR-020: Tool calls via do_*() from task_tools.py (not MCP stdio)
- FR-009/010: User message + assistant response stored to DB per turn

**plan.md**: Stateless request cycle diagram. Key decisions: sync Gemini client, direct Python tool calls, user_id injection, mock in tests.

**research.md**: 8 decisions including: google-genai SDK, gemini-2.0-flash default, user_id security design, max 5 iterations, system prompt as constant.

**contracts/api-contract.md**: Full request/response schema, Pydantic models, all 5 function declarations (user_id excluded), full lifecycle.

**quickstart.md**: Setup, manual curl tests, expected test output (5 tests).

**tasks.md**: 10 tasks across 6 phases. 5 endpoint tests (mocked).

## Outcome

- ✅ All 6 spec artifacts created
- 📁 Files: spec.md, plan.md, research.md, contracts/api-contract.md, quickstart.md, tasks.md
- 🔁 Next: Implement T001–T010 per tasks.md
- 🧠 Key design: user_id never in function declarations (security); call do_*() directly (not MCP subprocess); mock genai.Client in tests

## Evaluation notes (flywheel)

- Failure modes observed: None at spec stage
- Critical note: conftest.py must set GEMINI_API_KEY env var before app import to prevent config.py ValueError
- Next experiment: Verify correct google.genai agentic loop pattern with function_call detection
