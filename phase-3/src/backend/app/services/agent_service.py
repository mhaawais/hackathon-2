"""Gemini AI agent orchestration — Spec-6: AI Agent & Chat Endpoint.

Provides run_chat() which is the single public entry point for the chat endpoint.
Manages the full stateless request cycle:
  1. Create/resume conversation
  2. Store user message
  3. Load full conversation history
  4. Run Gemini with function calling (agentic loop, max 5 iterations)
  5. Store assistant response
  6. Return ChatResponse

Security: user_id is injected by the server into every tool call.
It is NOT included in any Gemini FunctionDeclaration — the AI never controls user identity.
"""

import os
import sys

import google.genai as genai
from google.genai import types
from google.genai.errors import ClientError
from sqlmodel import Session

# Add src/mcp/ to sys.path so we can import tools.task_tools
# Path: services/ → app/ → backend/ → src/ → src/mcp/
_mcp_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "mcp")
)
if _mcp_dir not in sys.path:
    sys.path.insert(0, _mcp_dir)

from app.config import settings  # noqa: E402
from app.models.schemas import ChatResponse, ToolCallRecord  # noqa: E402
from app.services.conversation_service import (  # noqa: E402
    add_message,
    create_conversation,
    get_conversation,
    get_messages_for_conversation,
)
from tools.task_tools import (  # noqa: E402
    do_add_task,
    do_complete_task,
    do_delete_task,
    do_list_tasks,
    do_update_task,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_ITERATIONS = 5
FALLBACK_MESSAGE = "I couldn't complete the operation. Please try again."

SYSTEM_PROMPT = """You are a helpful todo assistant. You help users manage their tasks through conversation.

Rules:
- Always use the provided tools to perform task operations (add, list, complete, delete, update).
- Never make up task data — only report what the tools return.
- After using a tool, confirm the action clearly and concisely to the user.
- If a tool returns an error, explain it to the user in plain language.
- Keep responses brief and action-focused."""

# ---------------------------------------------------------------------------
# Gemini tool definitions (user_id excluded — server-injected per security requirement)
# ---------------------------------------------------------------------------

_FUNCTION_DECLARATIONS = [
    types.FunctionDeclaration(
        name="add_task",
        description="Create a new task for the user.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "title": types.Schema(type="STRING", description="Task title (required, non-empty)"),
                "description": types.Schema(type="STRING", description="Optional task details"),
            },
            required=["title"],
        ),
    ),
    types.FunctionDeclaration(
        name="list_tasks",
        description="List the user's tasks, optionally filtered by status. Call when user asks to see or list tasks.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "status": types.Schema(
                    type="STRING",
                    description="Filter by status: 'all', 'pending', or 'completed'. Default: 'all'",
                ),
            },
            required=[],
        ),
    ),
    types.FunctionDeclaration(
        name="complete_task",
        description="Toggle a task's completion status between pending and completed.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "task_id": types.Schema(type="STRING", description="UUID of the task to toggle"),
            },
            required=["task_id"],
        ),
    ),
    types.FunctionDeclaration(
        name="delete_task",
        description="Permanently delete a task.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "task_id": types.Schema(type="STRING", description="UUID of the task to delete"),
            },
            required=["task_id"],
        ),
    ),
    types.FunctionDeclaration(
        name="update_task",
        description="Update a task's title or description.",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "task_id": types.Schema(type="STRING", description="UUID of the task to update"),
                "title": types.Schema(type="STRING", description="New title (optional)"),
                "description": types.Schema(type="STRING", description="New description (optional)"),
            },
            required=["task_id"],
        ),
    ),
]

TASK_TOOL = types.Tool(function_declarations=_FUNCTION_DECLARATIONS)

# ---------------------------------------------------------------------------
# Tool dispatcher
# ---------------------------------------------------------------------------

_TOOL_MAP = {
    "add_task": do_add_task,
    "list_tasks": do_list_tasks,
    "complete_task": do_complete_task,
    "delete_task": do_delete_task,
    "update_task": do_update_task,
}


def _dispatch_tool(session: Session, name: str, args: dict) -> dict:
    """Route a Gemini function call to the correct do_*() handler."""
    handler = _TOOL_MAP.get(name)
    if handler is None:
        return {"error": f"Unknown tool: {name}", "code": "NOT_FOUND"}
    return handler(session, **args)


# ---------------------------------------------------------------------------
# Gemini content builder
# ---------------------------------------------------------------------------


def _build_contents(messages: list) -> list[types.Content]:
    """Convert DB Message rows to Gemini Content objects."""
    contents = []
    for msg in messages:
        role = "user" if msg.role == "user" else "model"
        contents.append(
            types.Content(role=role, parts=[types.Part(text=msg.content)])
        )
    return contents


# ---------------------------------------------------------------------------
# Agentic loop
# ---------------------------------------------------------------------------


def _run_gemini_agent(
    session: Session,
    user_id: str,
    history_messages: list,
) -> tuple[str, list[dict]]:
    """Run Gemini with function calling loop.

    Returns (response_text, tool_calls_record).
    Loops at most MAX_ITERATIONS times to prevent runaway loops.
    user_id is injected into every tool call — never comes from the model.
    """
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    contents: list = _build_contents(history_messages)
    tool_calls_record: list[dict] = []

    for _ in range(MAX_ITERATIONS):
        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    tools=[TASK_TOOL],
                    system_instruction=SYSTEM_PROMPT,
                ),
            )
        except ClientError as e:
            if e.status_code == 429:
                return (
                    "I'm temporarily unavailable due to API rate limits. "
                    "Please wait a moment and try again.",
                    tool_calls_record,
                )
            return (
                f"The AI service returned an error: {e.status_code}. Please try again.",
                tool_calls_record,
            )

        candidate = response.candidates[0]
        candidate_content = candidate.content

        # Collect function calls from this response
        function_calls = [
            part.function_call
            for part in candidate_content.parts
            if part.function_call
        ]

        if not function_calls:
            # No tool calls — extract text and return
            text_parts = [part.text for part in candidate_content.parts if part.text]
            text = "".join(text_parts).strip()
            return text or FALLBACK_MESSAGE, tool_calls_record

        # Append model's response (with function calls) to content history
        contents.append(candidate_content)

        # Execute each function call and collect function response parts
        fn_response_parts = []
        for fc in function_calls:
            args = dict(fc.args)
            args["user_id"] = user_id  # Inject from JWT — model never controls this

            result = _dispatch_tool(session, fc.name, args)
            tool_calls_record.append(
                {"tool_name": fc.name, "arguments": args, "result": result}
            )

            fn_response_parts.append(
                types.Part.from_function_response(name=fc.name, response=result)
            )

        # Feed function results back into content for the next Gemini turn
        contents.append(types.Content(role="user", parts=fn_response_parts))

    return FALLBACK_MESSAGE, tool_calls_record


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def run_chat(
    session: Session,
    user_id: str,
    message: str,
    conversation_id: int | None = None,
) -> ChatResponse:
    """Full stateless chat turn.

    1. Get or create conversation (silently creates new if not found/wrong user).
    2. Store user message to DB.
    3. Load full conversation history.
    4. Run Gemini agentic loop.
    5. Store assistant response to DB.
    6. Return ChatResponse with conversation_id, response text, and tool calls.
    """
    # 1. Get or create conversation
    conv = None
    if conversation_id is not None:
        conv = get_conversation(session, conversation_id, user_id)
    if conv is None:
        conv = create_conversation(session, user_id)

    # 2. Store user message
    add_message(session, conv.id, user_id, "user", message)

    # 3. Load full history (includes the message we just added)
    history = get_messages_for_conversation(session, conv.id, user_id)

    # 4. Run Gemini agent
    response_text, tool_calls = _run_gemini_agent(session, user_id, history)

    # 5. Store assistant response
    add_message(session, conv.id, user_id, "assistant", response_text)

    return ChatResponse(
        conversation_id=conv.id,
        response=response_text,
        tool_calls=[ToolCallRecord(**tc) for tc in tool_calls],
    )
