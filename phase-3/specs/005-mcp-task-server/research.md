# Research: MCP Task Server

**Branch**: `005-mcp-task-server` | **Date**: 2026-02-27

## Decision Log

### D-001: MCP Package — Official Python MCP SDK (`mcp`)

**Decision**: Use `mcp>=1.0.0,<2.0.0` from PyPI (the Official Python MCP SDK).

**Rationale**: Constitution Principle XII explicitly requires the Official Python MCP SDK.
The package name on PyPI is `mcp`. Version `1.x` provides a stable server API with
`Server`, `stdio_server`, `Tool`, `TextContent`, and `CallToolResult` types.

**Key API surface**:
```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

server = Server("name")

@server.list_tools()
async def list_tools() -> list[Tool]: ...

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]: ...

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())
```

**Alternative rejected**: Writing a custom MCP-compatible JSON-RPC server — violates
constitution requirement to use the Official SDK.

---

### D-002: Transport — stdio

**Decision**: Use stdio transport exclusively. The MCP server reads from stdin and writes to stdout.

**Rationale**: The AI agent in Spec-6 will start the MCP server as a subprocess and
communicate via stdin/stdout. This is the simplest MCP deployment model for a Python
application. No port management, no HTTP server, no TLS configuration needed.

**Implementation pattern**:
```python
import asyncio

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
```

**Alternative rejected**: HTTP (SSE) transport — requires FastAPI or similar HTTP server,
complicates the deployment model for the hackathon scope.

---

### D-003: Database Session Strategy — Per-Request Session

**Decision**: Create a new SQLModel `Session` for each tool call using a module-level `engine`.

**Rationale**: The MCP server is a separate process from the FastAPI backend. It cannot share
the FastAPI `get_session()` dependency. A module-level engine initialized from `DATABASE_URL`
environment variable (same `.env` file) is correct. Per-request session creation matches the
FastAPI pattern and avoids stale session state.

```python
import os
from sqlmodel import Session, create_engine

engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True, pool_recycle=300)

def get_db_session() -> Session:
    return Session(engine)
```

**Alternative rejected**: Sharing a persistent session — SQLModel sessions are not
thread/async-safe for long-lived use; connection can go stale.

---

### D-004: Async Strategy — `asyncio.to_thread` for Sync Service Calls

**Decision**: Wrap synchronous `todo_service` calls in `asyncio.to_thread()`.

**Rationale**: MCP SDK requires async handler functions. The existing `todo_service.py`
functions are synchronous and use synchronous SQLModel sessions. Rewriting them as async
is out of scope (they are frozen Phase 2 code). `asyncio.to_thread()` runs the sync
function in a thread pool without blocking the async event loop.

```python
import asyncio

async def add_task_handler(args: dict) -> dict:
    def sync_call():
        with get_db_session() as session:
            return todo_service.create_todo(session, args["user_id"], TodoCreate(...))
    return await asyncio.to_thread(sync_call)
```

**Alternative rejected**: `loop.run_in_executor(None, ...)` — more verbose than `to_thread`;
functionally identical.

---

### D-005: Error Handling — Catch `HTTPException` + All Exceptions

**Decision**: Each tool handler wraps its entire logic in `try/except HTTPException, Exception`.
Convert `HTTPException(404)` → `{"error": ..., "code": "NOT_FOUND"}`;
other HTTPException → `{"error": ..., "code": "INTERNAL_ERROR"}`;
`ValueError` → `{"error": ..., "code": "VALIDATION_ERROR"}`;
any `Exception` → `{"error": ..., "code": "INTERNAL_ERROR"}`.

**Rationale**: `todo_service.py` raises `fastapi.HTTPException` for not-found and
authorization errors (e.g., `get_todo` raises HTTP 404 for wrong user). The MCP server
must catch these and return structured responses so the AI agent can communicate the
error to the user gracefully. The MCP server process must not crash.

```python
from fastapi import HTTPException

async def complete_task_handler(args: dict) -> dict:
    try:
        # ... call service
    except HTTPException as exc:
        code = "NOT_FOUND" if exc.status_code == 404 else "INTERNAL_ERROR"
        return {"error": exc.detail, "code": code}
    except ValueError as exc:
        return {"error": str(exc), "code": "VALIDATION_ERROR"}
    except Exception as exc:
        return {"error": str(exc), "code": "INTERNAL_ERROR"}
```

**Alternative rejected**: Let exceptions propagate to MCP SDK — crashes the server process
or returns malformed MCP error responses; unacceptable for production use.

---

### D-006: Test Strategy — Direct Handler Function Calls (No Subprocess)

**Decision**: Unit tests call the async handler functions directly using `pytest-asyncio` or
by running them with `asyncio.run()`. Tests use the same `session` fixture from `conftest.py`
but inject a pre-built session into the handler rather than using a module-level engine.

**Rationale**: Subprocess-based testing (spawning the MCP server as a process and sending
JSON-RPC over stdin) is complex, slow, and fragile for unit tests. Calling handler functions
directly is simpler, faster, and sufficient to verify tool behavior. The session fixture
provides in-memory SQLite, matching the Spec-4 test pattern.

**Implementation**: The handler functions accept an optional `session` parameter for testing;
in production they create their own session from `DATABASE_URL`. Alternatively, handlers
can be extracted to pure functions that accept a session, and the MCP server creates the session before calling them.

**Chosen approach**: Extract tool logic into pure sync functions that accept `Session`:
```python
def do_add_task(session: Session, user_id: str, title: str, description: str | None) -> dict:
    todo = todo_service.create_todo(session, user_id, TodoCreate(title=title, description=description))
    return {"task_id": str(todo.id), "title": todo.title, "status": todo.status}
```
The MCP async handler wraps this:
```python
async def handle_add_task(args: dict) -> list[TextContent]:
    def sync():
        with get_db_session() as session:
            return do_add_task(session, args["user_id"], args["title"], args.get("description"))
    result = await asyncio.to_thread(sync)
    return [TextContent(type="text", text=json.dumps(result))]
```
Tests call `do_add_task(session, ...)` directly — no asyncio needed in tests.

**Alternative rejected**: Full subprocess testing — slow, complex, flaky; unit tests of pure
functions are faster and just as valid for correctness verification.

---

### D-007: `google-generativeai` Added to Requirements (Pre-emptive for Spec-6)

**Decision**: Add `google-genai>=1.0.0,<2.0.0` to `requirements.txt` in this spec
alongside `mcp>=1.0.0,<2.0.0`.

**Rationale**: Spec-6 (AI Agent) will immediately depend on the Google Gemini SDK.
`google-generativeai` (old package, `import google.generativeai`) is deprecated as of
2025 — the new package is `google-genai` (`import google.genai as genai`). Adding the
correct new package now avoids a second requirements.txt change and ensures Spec-6 can
use the current API immediately.

**Alternative rejected**: `google-generativeai` — deprecated, FutureWarning on import,
no more updates or bug fixes per upstream README.
