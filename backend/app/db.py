"""SQLAlchemy engine and session for the SQLite database (WAL mode) on E:.

The engine is built from settings at import time; tests set DATABASE_URL before
importing this module (see tests/conftest.py) so they always run against an
isolated database file.
"""

from __future__ import annotations

from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.settings import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    """Declarative base for all ORM models (tables land in Phase 2)."""


engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    future=True,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, _connection_record) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables. Phase 2 fills app.models; the import is what registers them."""
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)