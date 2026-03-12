# Quickstart: MCP Task Server (Spec-5)

## Setup

### 1. Install dependencies (from `phase-3/src/backend/`)

```bash
pip install -r requirements.txt
# Includes: mcp>=1.0.0,<2.0.0, google-generativeai>=0.8.0,<1.0.0
```

### 2. Verify environment

```bash
# .env must have DATABASE_URL set
cat phase-3/.env | grep DATABASE_URL
```

### 3. Run the MCP server manually (smoke test)

```bash
# From phase-3/src/mcp/
python server.py
# Expected: server starts silently, awaiting MCP protocol messages on stdin
# Press Ctrl+C to exit
```

### 4. Run the unit tests

```bash
# From phase-3/src/backend/
pytest tests/test_mcp_task_tools.py -v
```

Expected output:
```
tests/test_mcp_task_tools.py::test_add_task_success PASSED
tests/test_mcp_task_tools.py::test_add_task_with_description PASSED
tests/test_mcp_task_tools.py::test_add_task_empty_title PASSED
tests/test_mcp_task_tools.py::test_list_tasks_all PASSED
tests/test_mcp_task_tools.py::test_list_tasks_status_filter PASSED
tests/test_mcp_task_tools.py::test_list_tasks_empty PASSED
tests/test_mcp_task_tools.py::test_list_tasks_user_isolation PASSED
tests/test_mcp_task_tools.py::test_complete_task_success PASSED
tests/test_mcp_task_tools.py::test_complete_task_not_found PASSED
tests/test_mcp_task_tools.py::test_delete_task_success PASSED
tests/test_mcp_task_tools.py::test_delete_task_not_found PASSED
tests/test_mcp_task_tools.py::test_update_task_success PASSED
tests/test_mcp_task_tools.py::test_update_task_not_found PASSED
tests/test_mcp_task_tools.py::test_invalid_task_id_format PASSED

14 passed in <1s
```

### 5. Run the full backend test suite (regression check)

```bash
# From phase-3/src/backend/
pytest tests/ -v
# Expected: 46 tests pass (32 existing + 14 new MCP tests), 0 failures
```

## File Locations

| File | Purpose |
|------|---------|
| `src/mcp/__init__.py` | Package marker |
| `src/mcp/server.py` | MCP server entry point (stdio transport) |
| `src/mcp/tools/__init__.py` | Tools package marker |
| `src/mcp/tools/task_tools.py` | 5 tool handlers + pure sync functions |
| `src/backend/tests/test_mcp_task_tools.py` | 14 unit tests |
| `src/backend/requirements.txt` | Updated with `mcp` and `google-generativeai` |

## Architecture Notes

- The MCP server is a standalone Python process. It is NOT imported by the FastAPI backend.
- The server creates its own SQLModel engine from `DATABASE_URL` env var.
- Tool handlers in `task_tools.py` expose pure sync functions for testability.
- MCP async handlers wrap the sync functions using `asyncio.to_thread()`.
- All tool errors return structured JSON; the server never crashes on bad input.
- Spec-6 (AI Agent) will start this server as a subprocess using stdio transport.
