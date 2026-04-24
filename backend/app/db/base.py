"""SQLAlchemy Declarative Base.

Note: models intentionally live in `app.models` and import `Base` from here.
To register them on `Base.metadata`, import `app.models` (the package) at
the top-level of any entrypoint that needs the full schema (Alembic env,
test fixtures, admin scripts). Avoid importing models at the bottom of
this module — it creates a circular import.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Shared base for all ORM models."""

    pass
