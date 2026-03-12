# Tool Contracts: MCP Task Server

**Spec**: 005-mcp-task-server | **Date**: 2026-02-27

All 5 MCP tool input/output contracts. All tools return a single `TextContent` with
`type="text"` and `text=json.dumps(result)`. JSON is the canonical interchange format.

---

## Tool: `add_task`

**Description**: Create a new task for the user. Call this when the user wants to add,
create, or remember a new task or to-do item.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "The authenticated user's ID (derived from JWT)"
    },
    "title": {
      "type": "string",
      "description": "The task title (required, non-empty)"
    },
    "description": {
      "type": "string",
      "description": "Optional additional details about the task"
    }
  },
  "required": ["user_id", "title"]
}
```

### Success Response

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "status": "pending",
  "description": null
}
```

### Error Response

```json
{ "error": "title cannot be empty or contain only whitespace", "code": "VALIDATION_ERROR" }
```

### Backend Delegation

```python
todo_service.create_todo(session, user_id, TodoCreate(title=title, description=description))
```

---

## Tool: `list_tasks`

**Description**: List the user's tasks, optionally filtered by status. Call this when the
user asks to see, show, or list their tasks, or asks what tasks they have.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "The authenticated user's ID"
    },
    "status": {
      "type": "string",
      "enum": ["all", "pending", "completed"],
      "description": "Filter by status. Default: 'all'"
    }
  },
  "required": ["user_id"]
}
```

### Success Response

```json
{
  "tasks": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Buy groceries",
      "status": "pending",
      "description": null
    },
    {
      "task_id": "661f9511-f3ac-52e5-b827-557766551111",
      "title": "Read book",
      "status": "completed",
      "description": "Finish chapter 5"
    }
  ],
  "count": 2
}
```

### Error Response

```json
{ "error": "Database connection error", "code": "INTERNAL_ERROR" }
```

### Backend Delegation

```python
status_filter = None if status in (None, "all") else status
todos = todo_service.list_todos(session, user_id, status_filter=status_filter)
```

---

## Tool: `complete_task`

**Description**: Toggle a task's completion status between 'pending' and 'completed'.
Call this when the user says they finished a task, completed it, or wants to mark it done
or uncomplete it.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "The authenticated user's ID"
    },
    "task_id": {
      "type": "string",
      "description": "The UUID of the task to toggle"
    }
  },
  "required": ["user_id", "task_id"]
}
```

### Success Response

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "status": "completed",
  "toggled": true
}
```

### Error Responses

```json
{ "error": "Todo not found", "code": "NOT_FOUND" }
{ "error": "Invalid task_id format: expected UUID", "code": "VALIDATION_ERROR" }
```

### Backend Delegation

```python
task_uuid = uuid.UUID(task_id)  # raises ValueError if invalid
todo = todo_service.complete_todo(session, task_uuid, user_id)
```

---

## Tool: `delete_task`

**Description**: Permanently delete a task. Call this when the user wants to remove,
delete, or get rid of a task.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "The authenticated user's ID"
    },
    "task_id": {
      "type": "string",
      "description": "The UUID of the task to delete"
    }
  },
  "required": ["user_id", "task_id"]
}
```

### Success Response

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "deleted": true
}
```

### Error Responses

```json
{ "error": "Todo not found", "code": "NOT_FOUND" }
{ "error": "Invalid task_id format: expected UUID", "code": "VALIDATION_ERROR" }
```

### Backend Delegation

```python
task_uuid = uuid.UUID(task_id)
todo_service.delete_todo(session, task_uuid, user_id)  # returns None on success
```

---

## Tool: `update_task`

**Description**: Update a task's title or description. Call this when the user wants to
rename, edit, change, or update the details of an existing task.

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "The authenticated user's ID"
    },
    "task_id": {
      "type": "string",
      "description": "The UUID of the task to update"
    },
    "title": {
      "type": "string",
      "description": "New title for the task (optional)"
    },
    "description": {
      "type": "string",
      "description": "New description for the task (optional)"
    }
  },
  "required": ["user_id", "task_id"]
}
```

### Success Response

```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy organic groceries",
  "status": "pending",
  "description": "Check the health food store first"
}
```

### Error Responses

```json
{ "error": "Todo not found", "code": "NOT_FOUND" }
{ "error": "Invalid task_id format: expected UUID", "code": "VALIDATION_ERROR" }
```

### Backend Delegation

```python
task_uuid = uuid.UUID(task_id)
todo = todo_service.update_todo(session, task_uuid, user_id, TodoUpdate(title=title, description=description))
```

---

## Error Code Reference

| Code | Meaning | Source |
|------|---------|--------|
| `NOT_FOUND` | Task does not exist or belongs to a different user | `HTTPException(404)` from `todo_service` |
| `VALIDATION_ERROR` | Invalid input (empty title, malformed UUID, etc.) | `ValueError` from `todo_service` or handler |
| `INTERNAL_ERROR` | Unexpected database or system error | Any uncaught `Exception` |

---

## Caller Workflow (Spec-6 AI Agent)

```python
# Spec-6 AI agent will use the MCP server as a tool provider:
# 1. Start the MCP server subprocess (stdio transport)
# 2. List tools → receive the 5 tool definitions
# 3. For each AI tool call:
#    a. Invoke the tool with user_id and required args
#    b. Receive TextContent with JSON text
#    c. json.loads(content.text) → success dict or error dict
#    d. If "error" key present → surface error to user
# 4. Shut down subprocess when request is complete
```
