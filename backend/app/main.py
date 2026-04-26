"""FastAPI entrypoint — `uvicorn app.main:app`."""

from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import admin, gdpr, legal, orders, webhooks
from app.core.config import settings
from app.core.logging import configure_logging, log

# --- Observability ---
configure_logging()
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.APP_ENV,
        traces_sample_rate=0.1,
    )

# --- Rate limiter ---
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    log.info("app.startup", env=settings.APP_ENV)
    yield
    log.info("app.shutdown")


app = FastAPI(
    title="Unu Noaptea Calendar API",
    version="0.1.0",
    description="Backend pentru Calendar: Vorbim la UNU NOAPTEA",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

# In DEMO_MODE we allow any origin (the demo is meant to be reachable from
# any preview URL — Railway, Vercel, custom domains, browser extensions, etc.).
# `allow_credentials` MUST be False when allow_origins contains "*" per spec;
# the demo doesn't need cookies anyway.
if settings.DEMO_MODE:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["x-request-id"],
        max_age=600,
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        # Also match any Railway public domain so the demo frontend works
        # without the deployer having to set FRONTEND_URL by hand. Safe for
        # this project: the API has no unauthenticated destructive endpoints.
        allow_origin_regex=r"https://.*\.(up\.railway\.app|vercel\.app|netlify\.app)",
        allow_credentials=True,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["x-request-id"],
        max_age=600,
    )


@app.middleware("http")
async def bind_request_id(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    import uuid

    import structlog

    rid = request.headers.get("x-request-id", str(uuid.uuid4()))
    structlog.contextvars.bind_contextvars(request_id=rid, path=request.url.path)
    response = await call_next(request)
    response.headers["x-request-id"] = rid
    structlog.contextvars.clear_contextvars()
    return response


@app.get("/api/v1/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(orders.router, prefix="/api/v1/orders", tags=["orders"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["webhooks"])
app.include_router(gdpr.router, prefix="/api/v1/gdpr", tags=["gdpr"])
app.include_router(legal.router, prefix="/api/v1/legal", tags=["legal"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    log.exception("unhandled_exception", error=str(exc))
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Ceva n-a mers bine pe server. Te-am contactat — încercăm din nou.",
        },
    )
