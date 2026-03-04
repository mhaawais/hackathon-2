# Spec-7: ChatKit Frontend

**Feature**: Chat UI — authenticated Next.js chat interface wired to `POST /api/chat`
**Branch**: `007-chatkit-frontend`
**Date**: 2026-03-04
**Depends on**: Spec-6 (`POST /api/chat` endpoint) — COMPLETE

---

## User Stories

### US1 — Start a New Conversation
> As an authenticated user, I want to open the `/chat` page and start typing a message so the AI responds and manages my tasks without leaving the page.

**Acceptance Criteria**:
- `/chat` page loads within the app shell (navbar, responsive layout)
- An empty chat window is shown when there is no prior conversation
- Typing a message and pressing Send / Enter submits it to the backend
- The AI response appears in the chat window without a page reload
- A loading state is shown while waiting for the response

### US2 — Resume a Previous Conversation
> As an authenticated user, I want my conversation to persist between page refreshes so I can continue where I left off.

**Acceptance Criteria**:
- `conversation_id` and message history are stored in `localStorage`
- On page refresh, the stored messages and `conversation_id` are restored
- The next message is sent with the stored `conversation_id`, continuing the prior conversation in the backend
- A "New Chat" button allows clearing the stored conversation and starting fresh

### US3 — See Tool Call Feedback
> As an authenticated user, I want to see which tools the AI invoked (e.g., "Added task: Buy groceries") so I understand what actions the AI performed.

**Acceptance Criteria**:
- For each AI response, if `tool_calls` is non-empty, tool-call badges are shown below the response text
- Each badge shows the tool name and a human-readable summary of the arguments
- Tool call badges are visually distinct from message text

### US4 — Auth Protection & 401 Handling
> As a visitor (unauthenticated), accessing `/chat` redirects me to sign-in. If my session expires during a chat, the page redirects to sign-in.

**Acceptance Criteria**:
- On mount, session is checked; if no session, redirect to `/sign-in`
- A 401 from the API (handled by `api.ts`) redirects to `/sign-in`
- `GEMINI_API_KEY` does not appear in any frontend file, JS bundle, or network request

---

## Functional Requirements

| # | Requirement |
|---|-------------|
| FR1 | `/chat` route exists at `src/app/chat/page.tsx` and is accessible only when authenticated |
| FR2 | Auth check runs on mount via `authClient.getSession()`; unauthenticated users are redirected to `/sign-in` |
| FR3 | Chat messages are displayed in a scrollable chat window, newest at the bottom |
| FR4 | User messages and assistant messages are visually differentiated (alignment, color) |
| FR5 | A chat input field accepts text; submitting via Enter or Send button sends the message |
| FR6 | While waiting for a response, the input is disabled and a loading indicator is shown |
| FR7 | The API call uses `api.post('/chat', { message, conversation_id })` from `lib/api.ts` |
| FR8 | `conversation_id` is read from `localStorage` on mount and written after each response |
| FR9 | Message history is stored in `localStorage` and restored on page load |
| FR10 | A "New Chat" button clears `localStorage` state and resets the message list |
| FR11 | Tool calls from each AI response are rendered below the response text as badges |
| FR12 | Each tool-call badge shows the tool name and key argument values |
| FR13 | The chat page uses `AppNavbar` with a Chat link added to navigation |
| FR14 | The UI is responsive: works on mobile (< 640px), tablet (640–1024px), desktop (> 1024px) |
| FR15 | `GEMINI_API_KEY` does not appear in any frontend file |

---

## Non-Goals

- No Vercel AI SDK `useChat` (backend is non-streaming; see research.md for decision)
- No streaming responses — backend returns complete JSON
- No multi-conversation switcher (single active conversation only)
- No file/image attachments
- No message editing or deletion from the chat UI
- No read receipts or typing indicators from the AI

---

## Acceptance Checklist

- [ ] `/chat` page redirects unauthenticated users to `/sign-in`
- [ ] Sending a message returns an AI response without page reload
- [ ] Tool call badges appear when the AI invokes tools
- [ ] Message history survives page refresh
- [ ] "New Chat" clears history and starts a new conversation
- [ ] Chat link appears in AppNavbar on both desktop and mobile
- [ ] Responsive at mobile, tablet, desktop widths
- [ ] `GEMINI_API_KEY` absent from all frontend files (`grep -r GEMINI_API_KEY src/frontend/`)
