"""Application settings loaded from environment variables."""

import os
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Sentinel value injected by the demo fallback when DATABASE_URL is missing or
# is the .env.example placeholder AND DEMO_MODE is on. Persisted under /tmp so
# orders survive a uvicorn reload but are wiped on container restart — fine
# for a demo, never use this in production.
_DEMO_SQLITE_URL = "sqlite+aiosqlite:////tmp/unu_noaptea_demo.db"


class Settings(BaseSettings):
    """Typed configuration. Values come from environment (.env)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # --- App ---
    # Default `production` so unconfigured Railway deploys behave safely
    # (stricter CORS, no debug mode). Local dev overrides via .env.
    APP_ENV: Literal["development", "staging", "production", "test"] = "production"
    APP_SECRET_KEY: str = Field(
        default="railway-demo-insecure-secret-please-rotate-after-demo",
        min_length=16,
    )
    FRONTEND_URL: str = "http://localhost:5173"
    API_BASE_URL: str = "http://localhost:8000"
    # Comma-separated extra allowed origins (e.g. Railway preview URLs, custom
    # domains, staging frontends). Blank by default.
    CORS_EXTRA_ORIGINS: str = ""

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/unu_noaptea"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def _coerce_async_driver(cls, v: str) -> str:
        """Railway (and Heroku) inject `postgres://...` or `postgresql://...`.
        SQLAlchemy async requires an explicit driver — upgrade it to asyncpg
        at parse time so the deployer doesn't have to remember the prefix.

        Detection of the `.env.example` placeholder is deferred to a
        model_validator (after) below, where DEMO_MODE is also visible — in
        DEMO_MODE we fall back to SQLite instead of raising, so the demo
        deploys without Postgres being correctly wired.
        """
        if not v:
            return v
        if v.startswith("postgres://"):
            return "postgresql+asyncpg://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            return "postgresql+asyncpg://" + v[len("postgresql://") :]
        return v

    @model_validator(mode="after")
    def _demo_sqlite_fallback(self) -> "Settings":
        """If DATABASE_URL is missing or the .env.example placeholder, swap
        it for a local SQLite URL so the deploy can boot. The original
        validator used to raise here, which made Railway deploys fail before
        the healthcheck could report the actual misconfig — better to boot
        with a clearly-warned-about ephemeral DB and let the user see the
        warning in the logs than to crash on import.

        SQLite is a strict downgrade (no concurrent writes, wiped on
        container restart) — never deploy real production traffic against
        this fallback. The startup banner in start.sh prints a loud warning
        whenever this kicks in.
        """
        url = self.DATABASE_URL or ""
        is_placeholder = (not url) or ("user:pass@db:5432" in url)
        if is_placeholder:
            object.__setattr__(self, "DATABASE_URL", _DEMO_SQLITE_URL)
            # Also force DEMO_MODE on — there's no real Postgres, so order
            # creation must skip Stripe (which writes idempotency keys to DB).
            object.__setattr__(self, "DEMO_MODE", True)
            os.environ["UNU_NOAPTEA_DB_FALLBACK"] = "1"
        return self

    # --- Stripe ---
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_DIGITAL_PRICE_ID: str = ""

    # --- S3 / R2 ---
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""
    S3_BUCKET: str = "unu-noaptea-calendars"
    S3_REGION: str = "eu-central-1"

    # --- Email ---
    EMAIL_PROVIDER: Literal["resend", "sendgrid", "console"] = "console"
    RESEND_API_KEY: str = ""
    SENDGRID_API_KEY: str = ""
    EMAIL_FROM: str = "calendare@ununoaptea.com"
    EMAIL_FROM_NAME: str = "Unu Noaptea"

    # --- Admin ---
    ADMIN_EMAIL: str = "andrei.s3cu@gmail.com"
    ADMIN_PASSWORD_HASH: str = ""

    # --- Observability ---
    SENTRY_DSN: str = ""
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    # --- Business ---
    PROMO_CODE_NEXT_YEAR: str = "VU1P3"
    JWT_DOWNLOAD_TOKEN_EXPIRE_DAYS: int = 90
    PDF_S3_PRESIGNED_URL_EXPIRE_HOURS: int = 24
    CALENDAR_PRICE_EUR: float = 15.0

    # --- Demo mode ---
    # When True, order creation bypasses Stripe entirely: the order is marked
    # as paid immediately and PDF generation kicks off. Used for founder demos
    # and staging previews where no real payments should happen.
    # Default True: until real Stripe credentials are wired up in Railway, we
    # want the live preview to let testers download the PDF end-to-end.
    DEMO_MODE: bool = True

    # --- Rate limiting ---
    RATE_LIMIT_CREATE_ORDER: str = "5/minute"
    RATE_LIMIT_ORDER_STATUS: str = "20/minute"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"

    @property
    def cors_origins(self) -> list[str]:
        # FRONTEND_URL + any explicit extras; localhost added in non-prod.
        origins: list[str] = [self.FRONTEND_URL]
        if self.CORS_EXTRA_ORIGINS.strip():
            origins += [o.strip() for o in self.CORS_EXTRA_ORIGINS.split(",") if o.strip()]
        if not self.is_production:
            origins += ["http://localhost:5173", "http://127.0.0.1:5173"]
        return list(dict.fromkeys(origins))


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
