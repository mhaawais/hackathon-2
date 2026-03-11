"""Initialize the todo table in the database.

Run: python -m src.db.init_db (from phase-2/)
Or:  python init_db.py (from src/db/)
"""

import os
import sys

from dotenv import load_dotenv

# Load .env from phase-2 root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Add backend to path so app.db can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlmodel import SQLModel

# Import all models so they register with SQLModel metadata
from app.models.todo import Todo  # noqa: F401, E402
from app.models.conversation import Conversation  # noqa: F401, E402
from app.models.message import Message  # noqa: F401, E402
from app.db import engine  # noqa: E402


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    init_db()
