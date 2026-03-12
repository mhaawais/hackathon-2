"""Recurring Task Service — Spec-010.

Subscribes to 'task-events' Kafka topic via Dapr pub/sub.
When a recurring task is completed, auto-creates the next occurrence
by calling the backend's internal route via Dapr service invocation.

Dapr push-delivery model:
  GET  /dapr/subscribe  → subscription config
  POST /task-event      → called by Dapr for each task-events message
"""

import json
import logging
import os
from datetime import datetime, timedelta, timezone

import httpx
from dateutil.relativedelta import relativedelta
from fastapi import FastAPI, Request, Response

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("recurring-task-service")

app = FastAPI(title="Recurring Task Service", version="1.0.0")

PUBSUB_NAME = os.environ.get("PUBSUB_NAME", "kafka-pubsub")
DAPR_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))
BACKEND_APP_ID = os.environ.get("BACKEND_APP_ID", "todo-backend")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "recurring-task-service"}


@app.get("/dapr/subscribe")
async def subscribe():
    """Register subscription to task-events topic."""
    return [
        {
            "pubsubname": PUBSUB_NAME,
            "topic": "task-events",
            "route": "/task-event",
        }
    ]


@app.post("/task-event")
async def handle_task_event(request: Request):
    """Handle a task lifecycle event. Create next occurrence if recurring+completed."""
    try:
        envelope = await request.json()
        data = envelope.get("data", envelope)

        event_type = data.get("event_type", "")
        task_data = data.get("task_data", {})
        user_id = data.get("user_id", "")

        if event_type != "completed":
            return Response(status_code=200)

        is_recurring = task_data.get("is_recurring", False)
        if not is_recurring:
            return Response(status_code=200)

        frequency = task_data.get("recurrence_frequency")
        due_date = task_data.get("due_date")

        if not frequency:
            logger.warning("Recurring task has no frequency, skipping: %s", task_data)
            return Response(status_code=200)

        logger.info(
            "[RECURRING] Creating next occurrence for '%s' (freq=%s)",
            task_data.get("title"),
            frequency,
        )

        next_due = _calculate_next_due(due_date, frequency)
        await _create_next_occurrence(task_data, user_id, next_due)

    except Exception as exc:
        logger.error("Error processing task-event: %s", exc)
        # Return 200 to prevent Dapr retry storms
    return Response(status_code=200)


def _calculate_next_due(due_date_str: str | None, frequency: str) -> str | None:
    """Return ISO8601 string of next due date based on frequency."""
    if not due_date_str:
        # No due date: use now as base
        base = datetime.now(timezone.utc)
    else:
        try:
            base = datetime.fromisoformat(due_date_str.replace("Z", "+00:00"))
        except ValueError:
            base = datetime.now(timezone.utc)

    if frequency == "daily":
        next_dt = base + timedelta(days=1)
    elif frequency == "weekly":
        next_dt = base + timedelta(weeks=1)
    elif frequency == "monthly":
        next_dt = base + relativedelta(months=1)
    else:
        return None

    return next_dt.isoformat()


async def _create_next_occurrence(task_data: dict, user_id: str, next_due: str | None) -> None:
    """Call backend internal route via Dapr service invocation to create next task."""
    payload = {
        "title": task_data.get("title", "Recurring task"),
        "description": task_data.get("description"),
        "priority": task_data.get("priority", "medium"),
        "tags": task_data.get("tags", []),
        "due_date": next_due,
        "is_recurring": True,
        "recurrence_frequency": task_data.get("recurrence_frequency"),
    }

    # Dapr service invocation: POST to backend /api/internal/todos
    url = (
        f"http://localhost:{DAPR_PORT}/v1.0/invoke/"
        f"{BACKEND_APP_ID}/method/api/internal/todos"
    )
    headers = {
        "Content-Type": "application/json",
        "X-Internal-Service": "recurring-task-service",
        "X-User-Id": user_id,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, content=json.dumps(payload), headers=headers)
        if resp.status_code == 201:
            logger.info(
                "[RECURRING] Created next occurrence for user=%s title='%s' due=%s",
                user_id,
                payload["title"],
                next_due,
            )
        else:
            logger.error(
                "[RECURRING] Failed to create next occurrence: %d %s",
                resp.status_code,
                resp.text,
            )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8002"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
