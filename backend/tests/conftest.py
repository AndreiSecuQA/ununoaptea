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
# Tests exercise the full Stripe checkout flow by default; DEMO_MODE bypass
# is covered in its own dedicated test. Explicitly disable here so the
# production-safe default (DEMO_MODE=True) doesn't flip existing assertions.
os.environ.setdefault("DEMO_MODE", "false")
