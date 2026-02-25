import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))


class Settings:
    DATABASE_URL: str
    BETTER_AUTH_SECRET: str
    FRONTEND_URL: str

    def __init__(self) -> None:
        self.DATABASE_URL = os.environ.get("DATABASE_URL", "")
        self.BETTER_AUTH_SECRET = os.environ.get("BETTER_AUTH_SECRET", "")
        self.FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL environment variable is required")
        if not self.BETTER_AUTH_SECRET:
            raise ValueError("BETTER_AUTH_SECRET environment variable is required")


settings = Settings()
