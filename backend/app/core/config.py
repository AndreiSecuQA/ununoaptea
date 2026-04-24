"""Application settings loaded from environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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

        Also guards against the `.env.example` placeholder `user:pass@db:5432`
        leaking into production: if that exact string is detected (Railway's
        "Suggested Variables" feature will auto-copy it), we fail loudly so the
        deploy doesn't spend 5 minutes timing out on DNS.
        """
        if not v:
            return v
        # Detect the unreplaced `.env.example` placeholder leaking into Railway
        # config. The local-dev default uses `user:pass@localhost`, which is
        # fine — we only reject the `db:5432` hostname that comes from the
        # committed example file.
        if "user:pass@db:5432" in v:
            raise ValueError(
                "DATABASE_URL is still set to the .env.example placeholder "
                "('user:pass@db:5432'). In Railway, set it to "
                "${{Postgres.DATABASE_URL}} — not the example literal."
            )
        if v.startswith("postgres://"):
            return "postgresql+asyncpg://" + v[len("postgres://") :]
        if v.startswith("postgresql://"):
            return "postgresql+asyncpg://" + v[len("postgresql://") :]
        return v

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
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
