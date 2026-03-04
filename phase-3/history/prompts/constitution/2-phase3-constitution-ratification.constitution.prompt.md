---
id: 2
title: Phase 3 Constitution Ratification
stage: constitution
date: 2026-02-27
surface: claude-code
model: claude-sonnet-4-6
feature: phase3-ai-chatbot
branch: 003-api-frontend-integration
user: user
command: /sp.constitution
labels: [constitution, phase3, gemini, mcp, vercel-ai-sdk, chatbot, governance]
links:
  spec: n/a
  ticket: n/a
  adr: n/a
  pr: n/a
files:
  - path: phase-3/.specify/memory/constitution.md
    action: updated
    note: Bumped 1.0.0 → 2.0.0; added Principles XI–XIV; updated tech constraints and success criteria
  - path: phase-3/CLAUDE.md
    action: updated
    note: Rewritten for Phase 3 scope; added MCP, Gemini, Vercel AI SDK, new agents, new repo structure
  - path: phase-3/history/prompts/constitution/2-phase3-constitution-ratification.constitution.prompt.md
    action: created
    note: This PHR
tests:
  - none at constitution stage
---

## Prompt

User invoked `/sp.constitution` to update the constitution and CLAUDE.md files for Phase 3 of Hackathon II.
Context: Phase 2 is complete (specs 001–003 frozen). Phase 3 = Todo AI Chatbot using Google Gemini
(free API key, replacing OpenAI), Official Python MCP SDK, and Vercel AI SDK for the frontend chat UI.
4 new specs planned: 004 (conversation persistence), 005 (MCP task server), 006 (AI agent + chat
endpoint), 007 (ChatKit frontend). User confirmed Gemini as the AI provider.

## Response snapshot

Updated `.specify/memory/constitution.md` from v1.0.0 to v2.0.0 (MAJOR bump):
- Retained all 10 Phase 2 principles
- Added Principle XI: AI Agent Architecture (stateless per-request agent)
- Added Principle XII: MCP Tool Design (5 tools, official SDK, call service layer)
- Added Principle XIII: Conversation Persistence (all state in DB)
- Added Principle XIV: AI Provider Abstraction (Gemini via google-generativeai)
- Updated Phase 2 tech table + added Phase 3 tech table (Gemini, MCP SDK, Vercel AI SDK)
- Added Agent Roster section with 2 new agents: mcp-server-specialist, ai-agent-specialist
- Added Phase 3 Success Criteria (criteria 7–16)

Updated `CLAUDE.md` completely for Phase 3:
- Scope lock updated: Phase 3 in scope, Phase 4+ out of scope
- Added full project overview table with new tech
- Updated all 6 agents with new responsibilities (including 2 new Phase 3 agents)
- Added Phase 3 repo structure (mcp/, chat routes, chat components)
- Added GEMINI_API_KEY and GEMINI_MODEL to environment variables
- Added Phase 3 verification criteria (8.2–8.6)
- Added Phase 3 code standards (11.2)

## Outcome

- ✅ Impact: Phase 3 governance fully defined; all agents, specs, and tech constraints documented
- 🧪 Tests: N/A at constitution stage
- 📁 Files: constitution.md (updated), CLAUDE.md (updated), this PHR (created)
- 🔁 Next prompts: /sp.specify for spec-4 (004-conversation-persistence)
- 🧠 Reflection: Constitution v2.0.0 correctly builds on Phase 2 rather than replacing it;
  Gemini substitution for OpenAI cleanly accommodated via Principle XIV and explicit guardrails
  against OpenAI SDK usage

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): proceed to sp.specify for spec-4
