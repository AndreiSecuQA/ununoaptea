"""Async SQLAlchemy engine + session factory."""

import os
from collections.abc import AsyncGenerator
from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings

# Pool tuning applies to server DBs (postgres, mysql). SQLite uses NullPool and
# rejects pool_size/max_overflow — keep the kwargs conditional so local dev
# against sqlite+aiosqlite works without editing this file.
#
# SQL echo is OPT-IN via the `SQL_ECHO=1` env var. Previously it auto-enabled
# whenever APP_ENV=development, which on Railway flooded the deploy logs with
# every CREATE TABLE statement during startup and made the boot look like it
# was hanging (it wasn't — just slow log flushing). Default off everywhere.
_engine_kwargs: dict[str, Any] = {
    "echo": os.environ.get("SQL_ECHO") == "1",
    "pool_pre_ping": True,
}
if not settings.DATABASE_URL.startswith("sqlite"):
    _engine_kwargs["pool_size"] = 10
    _engine_kwargs["max_overflow"] = 20

engine = create_async_engine(settings.DATABASE_URL, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async session per-request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
