"""Pytest fixtures shared across tests."""

import os

# Set required env vars before any app imports.
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("APP_SECRET_KEY", "test-secret-key-please-change-me-1234567890")
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+asyncpg://test:test@localhost/test_unu_noaptea",
)
os.environ.setdefault("EMAIL_PROVIDER", "console")
