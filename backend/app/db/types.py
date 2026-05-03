"""Portable column types that work on both Postgres and SQLite.

`with_variant()` only swaps the DDL type — it doesn't translate the bound
parameter value, so passing a `uuid.UUID` to SQLite raises
`sqlite3.ProgrammingError: type 'UUID' is not supported`. The TypeDecorator
below stringifies on the way in and re-parses on the way out.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import CHAR, TypeDecorator


class GUID(TypeDecorator):  # type: ignore[type-arg]
    """Platform-independent UUID column.

    On Postgres uses native UUID(as_uuid=True). On SQLite (and any other
    backend) stores as CHAR(36) and converts to/from `uuid.UUID` so app
    code can always work with `uuid.UUID` objects regardless of dialect.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect: Any) -> Any:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return value
        if dialect.name == "postgresql":
            # asyncpg accepts uuid.UUID directly.
            return value
        # SQLite (and others) — store as canonical string.
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(uuid.UUID(str(value)))

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))
