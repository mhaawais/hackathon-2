# Tasks: ChatKit Frontend

**Input**: Design documents from `/specs/007-chatkit-frontend/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅
**Branch**: `007-chatkit-frontend`
**Date**: 2026-03-04

---

## Phase 1: Types

- [x] T001 Create `src/frontend/src/lib/chat-api.ts`:
  - Export `ToolCallRecord`, `ChatMessage`, `ChatApiResponse` TypeScript interfaces
  - `ChatMessage` has `id: string`, `role: 'user' | 'assistant'`, `content: string`, `tool_calls?: ToolCallRecord[]`
  - `ChatApiResponse` has `conversation_id: number`, `response: string`, `tool_calls: ToolCallRecord[]`

**Checkpoint**: No TypeScript errors when importing from `chat-api.ts`.

---

## Phase 2: Components

- [x] T002 Create `src/frontend/src/components/chat/tool-call-badge.tsx`:
  - Props: `toolCall: ToolCallRecord`
  - Shows tool name chip + key argument summary (e.g., `add_task: "Buy groceries"`)
  - Small pill design, indigo/violet tones

- [x] T003 Create `src/frontend/src/components/chat/message-bubble.tsx`:
  - Props: `message: ChatMessage`
  - User messages: right-aligned, `bg-indigo-600 text-white`
  - Assistant messages: left-aligned, `bg-white dark:bg-slate-800 border`
  - Renders `<ToolCallBadge>` list below assistant content if `tool_calls` non-empty

- [x] T004 Create `src/frontend/src/components/chat/chat-window.tsx`:
  - Props: `messages: ChatMessage[]`, `loading: boolean`
  - Scrollable container, auto-scrolls to bottom on new messages (`useEffect` + `ref`)
  - Empty state: "Start a conversation — ask me to add, list, or manage your tasks."
  - Loading: shows a pulsing "..." assistant bubble

- [x] T005 Create `src/frontend/src/components/chat/chat-input.tsx`:
  - Props: `onSubmit: (text: string) => void`, `disabled: boolean`
  - Textarea that grows up to 4 rows; submits on Enter (no shift), or Send button click
  - Send button disabled when `disabled` prop is true or input is empty

**Checkpoint**: All 4 components render without import errors.

---

## Phase 3: Page

- [x] T006 Create `src/frontend/src/app/chat/page.tsx`:
  - `"use client"` — auth check via `authClient.getSession()` on mount; redirect to `/sign-in` if null
  - Restore `conversationId` and `messages` from `localStorage` on mount
  - `sendMessage(text)`:
    1. Add user message to state
    2. `api.post<ChatApiResponse>('/chat', { message: text, conversation_id })`
    3. Add assistant message with `tool_calls` to state
    4. Update `conversationId`; persist both to `localStorage`
    5. On API error: show error toast and keep messages (no rollback)
  - "New Chat" button: clears `localStorage`, resets `messages` and `conversationId`
  - Wraps `ToastProvider` for error toasts
  - Uses `AppNavbar` (pass `userEmail`, `userName`, `onSignOut`)
  - Layout: `min-h-screen flex flex-col` — navbar fixed, chat fills remaining height

**Checkpoint**: Page renders; sending "hello" returns a response from the backend.

---

## Phase 4: Navbar

- [x] T007 Update `src/frontend/src/components/layout/app-navbar.tsx`:
  - Add "Chat" `<Link href="/chat">` to the desktop nav (between logo and search area)
  - Add "Chat" link to mobile drawer (above Settings)
  - Active state highlight when on `/chat` (use `usePathname()`)

**Checkpoint**: Chat link appears on desktop and mobile; navigates to `/chat`.

---

## Phase 5: Verification

- [x] T008 TypeScript check: `npx tsc --noEmit` from `src/frontend/` — zero errors.

- [x] T009 Security check: `grep -r "GEMINI_API_KEY" src/frontend/` — zero matches.

- [x] T010 Build check: `npm run build` from `src/frontend/` — zero errors, zero warnings.

---

## Dependencies & Execution Order

```
T001 (Types)
    │
    ├──▶ T002 (ToolCallBadge) — depends on ToolCallRecord type
    ├──▶ T003 (MessageBubble) — depends on ChatMessage + ToolCallBadge
    ├──▶ T004 (ChatWindow) — depends on ChatMessage + MessageBubble
    └──▶ T005 (ChatInput) — independent of types
    │
    ▼
T006 (Page) — depends on all components + ChatApiResponse type
    │
    ▼
T007 (Navbar) — independent of other tasks, can run in parallel with T006
    │
    ▼
T008 → T009 → T010 (Verification)
```

---

## Notes

- `api.ts` already handles JWT, 401→redirect, error parsing — no changes needed
- No Vercel AI SDK installed — custom hook in page.tsx instead (see research.md)
- Messages are stored in `localStorage` as JSON array
- `conversation_id` stored separately in `localStorage`
- Dark mode works via Tailwind `dark:` variants (theme toggle already works)
- Do NOT modify any Phase 2 files beyond `app-navbar.tsx`
