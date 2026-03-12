from collections.abc import Generator

from sqlmodel import Session, create_engine

from app.config import settings

engine = create_engine(settings.DATABASE_URL, echo=False, pool_pre_ping=True, pool_recycle=300)


def get_session() -> Generator[Session, None, None]:
    """Yield a SQLModel session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session
