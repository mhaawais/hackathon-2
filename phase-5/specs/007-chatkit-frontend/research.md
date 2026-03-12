# Research: ChatKit Frontend (Spec-7)

**Date**: 2026-03-04

---

## Decision 1: Vercel AI SDK `useChat` vs Custom Hook

**Initial spec said**: Use Vercel AI SDK `useChat` wired to `POST /api/chat`.

**Finding**: `useChat` from the Vercel AI SDK is designed for **streaming backends** that return Server-Sent Events (SSE) or chunked text streams. Our FastAPI `POST /api/chat` returns a **complete JSON response** (`{ conversation_id, response, tool_calls }`), not a stream.

To use `useChat` with our backend would require:
1. A Next.js API proxy route at `app/api/chat/route.ts`
2. The route fetches from FastAPI, gets the JSON response
3. Converts it to a `ReadableStream` and pipes it back
4. Custom response headers to propagate `conversation_id` and `tool_calls`
5. Parsing those headers in `onResponse` callback

This is significant complexity with zero UX benefit (fake streaming from a non-streaming source).

**Decision**: **Skip Vercel AI SDK. Build a custom hook using the existing `api.ts` client.**

The existing `api.ts` already handles:
- JWT retrieval via Better Auth `jwtClient()` plugin
- `Authorization: Bearer <token>` header on every request
- 401 → redirect to `/sign-in`
- JSON parsing and error handling

A custom hook adds ~30 lines and covers 100% of the UX requirements.

---

## Decision 2: Conversation + Message Persistence

**Options**:
A. In-memory only (lost on refresh)
B. Fetch conversation history from a new GET endpoint on mount
C. Store in `localStorage`

**Finding**: The backend has no `GET /api/conversations/:id/messages` endpoint. Adding one is out of scope for Spec-7. Option B is ruled out.

**Decision**: **Store `conversation_id` and messages in `localStorage`**. On mount, restore both. On each successful response, overwrite both. "New Chat" clears localStorage and resets state.

---

## Decision 3: Message Type Shape

```typescript
interface ChatMessage {
  id: string                           // crypto.randomUUID() for React keys
  role: 'user' | 'assistant'
  content: string
  tool_calls?: ToolCallRecord[]        // only present on assistant messages
}

interface ToolCallRecord {
  tool_name: string
  arguments: Record<string, unknown>
  result: Record<string, unknown>
}
```

---

## Decision 4: Component Split

| Component | Responsibility |
|-----------|---------------|
| `chat-window.tsx` | Scrollable container rendering message list; auto-scrolls to bottom |
| `message-bubble.tsx` | Individual message (user right-aligned, assistant left-aligned) + tool badges |
| `tool-call-badge.tsx` | Single badge showing tool name + key arguments |
| `chat-input.tsx` | Textarea + Send button; disabled while loading |
| `chat/page.tsx` | Orchestrates all above; handles state, API calls, auth check |

---

## Decision 5: Auth Check Strategy

Use `authClient.getSession()` on mount (same pattern as dashboard page). If session is null, `router.push('/sign-in')`. The `api.ts` client handles subsequent 401s.

---

## Decision 6: Navbar Update Strategy

Add a "Chat" link to `AppNavbar` without breaking the existing search/user/signout functionality. Add the link as an `href` to the desktop nav and mobile drawer.
