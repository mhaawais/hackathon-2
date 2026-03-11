"""MCP Task Server — Spec-5.

Exposes 5 tools for task management via the Official Python MCP SDK (stdio transport).
Started as a subprocess by the AI agent in Spec-6.

Run: python server.py (from src/mcp/)
"""

import asyncio
import json
import os
import sys

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# Add src/mcp/tools/ parent (src/mcp/) to path so we can import tools.task_tools
sys.path.insert(0, os.path.dirname(__file__))

from tools.task_tools import (  # noqa: E402
    handle_add_task,
    handle_complete_task,
    handle_delete_task,
    handle_list_tasks,
    handle_update_task,
)

server = Server("todo-task-server")

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOLS: list[Tool] = [
    Tool(
        name="add_task",
        description=(
            "Create a new task for the user. Call this when the user wants to add, "
            "create, or remember a new task or to-do item."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "The authenticated user's ID"},
                "title": {"type": "string", "description": "The task title (required, non-empty)"},
                "description": {
                    "type": "string",
                    "description": "Optional additional details about the task",
                },
            },
            "required": ["user_id", "title"],
        },
    ),
    Tool(
        name="list_tasks",
        description=(
            "List the user's tasks, optionally filtered by status. Call this when the "
            "user asks to see, show, or list their tasks, or asks what tasks they have."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "The authenticated user's ID"},
                "status": {
                    "type": "string",
                    "enum": ["all", "pending", "completed"],
                    "description": "Filter by status. Default: 'all'",
                },
            },
            "required": ["user_id"],
        },
    ),
    Tool(
        name="complete_task",
        description=(
            "Toggle a task's completion status between 'pending' and 'completed'. "
            "Call this when the user says they finished a task or wants to mark it done."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "The authenticated user's ID"},
                "task_id": {"type": "string", "description": "The UUID of the task to toggle"},
            },
            "required": ["user_id", "task_id"],
        },
    ),
    Tool(
        name="delete_task",
        description=(
            "Permanently delete a task. Call this when the user wants to remove, "
            "delete, or get rid of a task."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "The authenticated user's ID"},
                "task_id": {"type": "string", "description": "The UUID of the task to delete"},
            },
            "required": ["user_id", "task_id"],
        },
    ),
    Tool(
        name="update_task",
        description=(
            "Update a task's title or description. Call this when the user wants to "
            "rename, edit, change, or update the details of an existing task."
        ),
        inputSchema={
            "type": "object",
            "properties": {
                "user_id": {"type": "string", "description": "The authenticated user's ID"},
                "task_id": {"type": "string", "description": "The UUID of the task to update"},
                "title": {"type": "string", "description": "New title for the task (optional)"},
                "description": {
                    "type": "string",
                    "description": "New description for the task (optional)",
                },
            },
            "required": ["user_id", "task_id"],
        },
    ),
]

# ---------------------------------------------------------------------------
# MCP protocol handlers
# ---------------------------------------------------------------------------


@server.list_tools()
async def handle_list_tools() -> list[Tool]:
    """Return all 5 tool definitions."""
    return TOOLS


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Route tool calls to the appropriate handler function."""
    args = arguments or {}

    if name == "add_task":
        return await handle_add_task(args)
    elif name == "list_tasks":
        return await handle_list_tasks(args)
    elif name == "complete_task":
        return await handle_complete_task(args)
    elif name == "delete_task":
        return await handle_delete_task(args)
    elif name == "update_task":
        return await handle_update_task(args)
    else:
        error_payload = json.dumps({"error": f"Unknown tool: {name}", "code": "NOT_FOUND"})
        return [TextContent(type="text", text=error_payload)]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


async def main() -> None:
    """Start the MCP server with stdio transport."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
