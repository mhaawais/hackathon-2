"""Legacy DB connection module — delegates to the canonical source in app.db.

All new code should import from src.backend.app.db directly.
This file exists for backward compatibility only.
"""

import os
import sys

from dotenv import load_dotenv

# Load .env from phase-2 root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

# Add backend to path so app.db can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.db import engine, get_session  # noqa: E402, F401
