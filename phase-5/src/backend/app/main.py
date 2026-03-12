from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.config import settings
from app.db import engine
from app.routes import chat, health, internal, todos

# Import all models so SQLModel.metadata knows about every table
import app.models.todo  # noqa: F401
import app.models.conversation  # noqa: F401
import app.models.message  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create any missing tables on startup (safe — uses CREATE TABLE IF NOT EXISTS)
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(title="Todo API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router, prefix="/api")
app.include_router(todos.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(internal.router, prefix="/api")
