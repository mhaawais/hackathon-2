"""Notification Service — Spec-010.

Subscribes to the 'reminders' Kafka topic via Dapr pub/sub.
On each reminder event, logs the notification (extensible to email/push/webhook).

Dapr push-delivery model:
  GET  /dapr/subscribe  → returns subscription config
  POST /reminder        → called by Dapr with each message
"""

import logging
import os
from datetime import datetime

from fastapi import FastAPI, Request, Response

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("notification-service")

app = FastAPI(title="Notification Service", version="1.0.0")

PUBSUB_NAME = os.environ.get("PUBSUB_NAME", "kafka-pubsub")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "notification-service"}


@app.get("/dapr/subscribe")
async def subscribe():
    """Tell Dapr which topics to push to which endpoints."""
    return [
        {
            "pubsubname": PUBSUB_NAME,
            "topic": "reminders",
            "route": "/reminder",
        }
    ]


@app.post("/reminder")
async def handle_reminder(request: Request):
    """Handle a reminder event pushed by Dapr from the reminders topic."""
    try:
        envelope = await request.json()
        # Dapr wraps the payload in a CloudEvent envelope
        data = envelope.get("data", envelope)

        task_id = data.get("task_id", "unknown")
        title = data.get("title", "Untitled task")
        due_at = data.get("due_at", "")
        user_id = data.get("user_id", "unknown")

        logger.info(
            "[REMINDER] user=%s task_id=%s title='%s' due_at=%s",
            user_id,
            task_id,
            title,
            due_at,
        )

        # Extension point: send email/push/webhook here
        # For hackathon scope: log only
        _log_notification(user_id, task_id, title, due_at)

    except Exception as exc:
        logger.error("Failed to process reminder event: %s", exc)
        # Return 200 to prevent Dapr retry loop for malformed messages
    return Response(status_code=200)


def _log_notification(user_id: str, task_id: str, title: str, due_at: str) -> None:
    """Simulate sending a notification. Replace with real delivery in production."""
    now = datetime.utcnow().isoformat()
    logger.info(
        "[NOTIFICATION SENT] time=%s user=%s task=%s '%s' due=%s",
        now,
        user_id,
        task_id,
        title,
        due_at,
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8001"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
