# API Contract: POST /api/chat

**Spec**: 006-ai-agent-chat-endpoint | **Date**: 2026-02-27

---

## Endpoint

```
POST /api/chat
Authorization: Bearer <jwt>
Content-Type: application/json
```

---

## Request Schema

```json
{
  "message": "string (required, non-empty)",
  "conversation_id": "integer | null (optional, default: null)"
}
```

**Validation rules**:
- `message`: required, must not be empty or whitespace-only (Pydantic validator)
- `conversation_id`: optional integer; null means start a new conversation

**Example — new conversation**:
```json
{ "message": "Add a task to buy groceries" }
```

**Example — resume existing**:
```json
{ "message": "Show me all my pending tasks", "conversation_id": 42 }
```

---

## Response Schema (HTTP 200)

```json
{
  "conversation_id": 42,
  "response": "I've added the task 'Buy groceries' to your list.",
  "tool_calls": [
    {
      "tool_name": "add_task",
      "arguments": {
        "user_id": "user-abc-123",
        "title": "Buy groceries"
      },
      "result": {
        "task_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Buy groceries",
        "status": "pending",
        "description": null
      }
    }
  ]
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `conversation_id` | int | The conversation used (new or existing) |
| `response` | str | The AI's final text response |
| `tool_calls` | list | Ordered list of tools invoked during this turn |
| `tool_calls[].tool_name` | str | Name of the tool called |
| `tool_calls[].arguments` | dict | Arguments passed to the tool (includes `user_id`) |
| `tool_calls[].result` | dict | The tool's return value (success or error dict) |

---

## Error Responses

| Status | Condition |
|--------|-----------|
| 401 | Missing, expired, or invalid JWT |
| 422 | `message` is empty/whitespace |
| 500 | Unexpected agent or database error |

---

## Pydantic Schemas (added to `schemas.py`)

```python
from pydantic import BaseModel, field_validator

class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: dict
    result: dict

class ChatRequest(BaseModel):
    message: str
    conversation_id: int | None = None

    @field_validator("message")
    @classmethod
    def message_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("message cannot be empty")
        return v

class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: list[ToolCallRecord]
```

---

## Function Declarations (passed to Gemini — user_id excluded)

The AI model sees these function signatures. `user_id` is NOT included — it is injected
by the server after the model returns a function call.

### add_task
```json
{
  "name": "add_task",
  "description": "Create a new task for the user.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "title": { "type": "STRING", "description": "Task title (required)" },
      "description": { "type": "STRING", "description": "Optional task details" }
    },
    "required": ["title"]
  }
}
```

### list_tasks
```json
{
  "name": "list_tasks",
  "description": "List the user's tasks, optionally filtered by status.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "status": {
        "type": "STRING",
        "description": "Filter: 'all', 'pending', or 'completed'. Default: 'all'"
      }
    },
    "required": []
  }
}
```

### complete_task
```json
{
  "name": "complete_task",
  "description": "Toggle a task's completion status. Call when user says they finished a task.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "task_id": { "type": "STRING", "description": "UUID of the task to toggle" }
    },
    "required": ["task_id"]
  }
}
```

### delete_task
```json
{
  "name": "delete_task",
  "description": "Permanently delete a task.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "task_id": { "type": "STRING", "description": "UUID of the task to delete" }
    },
    "required": ["task_id"]
  }
}
```

### update_task
```json
{
  "name": "update_task",
  "description": "Update a task's title or description.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "task_id": { "type": "STRING", "description": "UUID of the task to update" },
      "title": { "type": "STRING", "description": "New title (optional)" },
      "description": { "type": "STRING", "description": "New description (optional)" }
    },
    "required": ["task_id"]
  }
}
```

---

## Full Request Lifecycle

```
1. JWT extracted → user_id string
2. ChatRequest validated (message non-empty)
3. agent_service.run_chat(session, user_id, message, conversation_id)
   a. get/create Conversation via conversation_service
   b. add_message(session, conv.id, user_id, "user", message)
   c. get_messages_for_conversation(session, conv.id, user_id) → history
   d. Build Gemini content list: [{role:"user"|"model", parts:[{text:...}]}, ...]
   e. [Agentic loop, max 5 iterations]:
      - generate_content(model, contents, config=GenerateContentConfig(tools, system_instruction))
      - if function_calls present: dispatch to do_*(), inject user_id, record in tool_calls_record, feed result back
      - if text only: exit loop
   f. add_message(session, conv.id, user_id, "assistant", response_text)
   g. return ChatResponse(conversation_id, response_text, tool_calls_record)
4. HTTP 200 {conversation_id, response, tool_calls}
```
