"""Kafka event publishing via Dapr pub/sub HTTP API.

All publishing is best-effort: errors are logged and swallowed so they never
fail the primary API response. The Dapr sidecar must be running on port
DAPR_HTTP_PORT (default 3500) for events to actually reach Kafka.

Usage:
    from app.services import kafka_service
    await kafka_service.publish_task_event("created", task_id, task_data, user_id)
    await kafka_service.publish_reminder(task_id, title, due_at, user_id)
"""

import json
import logging
import os
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

DAPR_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))
PUBSUB_NAME = "kafka-pubsub"
TOPIC_TASK_EVENTS = "task-events"
TOPIC_REMINDERS = "reminders"


async def publish_task_event(
    event_type: str,
    task_id: str,
    task_data: dict,
    user_id: str,
) -> None:
    """Publish a task lifecycle event to the task-events Kafka topic via Dapr."""
    payload = {
        "event_type": event_type,
        "task_id": task_id,
        "task_data": task_data,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await _publish(TOPIC_TASK_EVENTS, payload)


async def publish_reminder(
    task_id: str,
    title: str,
    due_at: datetime,
    user_id: str,
) -> None:
    """Publish a reminder event to the reminders Kafka topic via Dapr."""
    payload = {
        "task_id": task_id,
        "title": title,
        "due_at": due_at.isoformat(),
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await _publish(TOPIC_REMINDERS, payload)


async def _publish(topic: str, data: dict) -> None:
    """POST to Dapr pub/sub publish endpoint. Silently fails if Dapr is unavailable."""
    url = f"http://localhost:{DAPR_PORT}/v1.0/publish/{PUBSUB_NAME}/{topic}"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                url,
                content=json.dumps(data),
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code not in (200, 204):
                logger.warning(
                    "Dapr publish to %s returned %d: %s",
                    topic,
                    resp.status_code,
                    resp.text,
                )
    except Exception as exc:
        logger.warning("Dapr publish to %s failed (Dapr unavailable?): %s", topic, exc)
