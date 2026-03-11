# Plan: ChatKit Frontend (Spec-7)

**Date**: 2026-03-04

---

## Architecture

```
app/chat/page.tsx
│
├─ authClient.getSession() → redirect if no session
├─ localStorage → restore conversationId + messages on mount
│
├─ sendMessage(text: string)
│   ├─ add user message to state
│   ├─ api.post('/chat', { message: text, conversation_id })
│   ├─ add assistant message + tool_calls to state
│   ├─ update conversationId from response
│   └─ persist { conversationId, messages } to localStorage
│
└─ renders
    ├─ AppNavbar (with Chat link added)
    ├─ ChatWindow
    │   └─ MessageBubble (per message)
    │       └─ ToolCallBadge (per tool_call, if any)
    └─ ChatInput
```

---

## File Plan

| File | Action |
|------|--------|
| `src/lib/chat-api.ts` | New — TypeScript types (ChatMessage, ToolCallRecord, ChatResponse) |
| `src/components/chat/chat-window.tsx` | New — scrollable message list |
| `src/components/chat/message-bubble.tsx` | New — single message with tool badges |
| `src/components/chat/tool-call-badge.tsx` | New — tool name + args summary |
| `src/components/chat/chat-input.tsx` | New — textarea + send button |
| `src/app/chat/page.tsx` | New — full page: auth check, state, API call |
| `src/components/layout/app-navbar.tsx` | Update — add Chat nav link |

---

## Data Flow

```
User types "add groceries"
    ↓
ChatInput onSubmit
    ↓
page.tsx: sendMessage("add groceries")
    ↓
setMessages([...prev, { role: 'user', content: 'add groceries' }])
    ↓
api.post<ChatApiResponse>('/chat', { message: 'add groceries', conversation_id: 3 })
    ↓
FastAPI POST /api/chat
    → Gemini agent → MCP add_task → returns { conversation_id: 3, response: "Done! Added 'groceries'", tool_calls: [{...}] }
    ↓
setMessages([...prev, { role: 'assistant', content: 'Done!...', tool_calls: [{...}] }])
setConversationId(3)
localStorage.setItem(...)
```

---

## Design System

Matches the existing dashboard exactly:
- Colors: `slate-*` for backgrounds/text, `indigo-600` for primary actions
- Rounded: `rounded-xl` / `rounded-2xl`
- Dark mode: `dark:` variants on all interactive elements
- Font: inherited (system font via Tailwind)

**Message bubble styling**:
- User: right-aligned, `bg-indigo-600 text-white`
- Assistant: left-aligned, `bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border`

---

## Design Constraint

`GEMINI_API_KEY` must not appear in any frontend file. All API calls go through `api.ts` which calls the FastAPI backend (which holds the key server-side).
