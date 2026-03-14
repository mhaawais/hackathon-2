"""Reminder scheduling via Dapr Jobs API (alpha).

Uses the Dapr Jobs API to schedule exact-time callbacks:
  POST /v1.0-alpha1/jobs/{name}  →  schedules a one-shot job
  POST /api/jobs/trigger          →  Dapr calls this endpoint at scheduled time

Job naming: `reminder-{task_id}` (one active reminder per task).
Scheduling is best-effort — errors logged, never raised.
"""

import json
import logging
import os
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

DAPR_PORT = int(os.environ.get("DAPR_HTTP_PORT", "3500"))


async def schedule_reminder(task_id: str, remind_at: datetime, user_id: str) -> None:
    """Schedule a Dapr job to fire at remind_at. Best-effort."""
    # Dapr Jobs API requires RFC3339 dueTime
    due_time = remind_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    job_name = f"reminder-{task_id}"

    payload = {
        "dueTime": due_time,
        "data": {
            "task_id": task_id,
            "user_id": user_id,
            "type": "reminder",
        },
    }

    url = f"http://localhost:{DAPR_PORT}/v1.0-alpha1/jobs/{job_name}"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(
                url,
                content=json.dumps(payload),
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code in (200, 201, 204):
                logger.info(
                    "[JOBS] Scheduled reminder job=%s due=%s user=%s",
                    job_name,
                    due_time,
                    user_id,
                )
            else:
                logger.warning(
                    "[JOBS] Failed to schedule job=%s: %d %s",
                    job_name,
                    resp.status_code,
                    resp.text,
                )
    except Exception as exc:
        logger.debug("Dapr Jobs schedule skipped (sidecar unavailable?): %s", exc)


async def cancel_reminder(task_id: str) -> None:
    """Cancel a previously scheduled reminder. Best-effort."""
    job_name = f"reminder-{task_id}"
    url = f"http://localhost:{DAPR_PORT}/v1.0-alpha1/jobs/{job_name}"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            await client.delete(url)
            logger.info("[JOBS] Cancelled reminder job=%s", job_name)
    except Exception as exc:
        logger.debug("Dapr Jobs cancel skipped: %s", exc)
