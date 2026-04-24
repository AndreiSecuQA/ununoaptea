"""Orders endpoints — create, status, download."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
from uuid import UUID

import jwt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import log
from app.core.security import create_download_token, decode_download_token, hash_ip
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import (
    OrderCreateRequest,
    OrderCreateResponse,
    OrderStatusResponse,
)
from app.services.s3_service import create_presigned_url, demo_local_path
from app.services.stripe_service import create_checkout_session
from app.workers.generate_calendar import generate_calendar_task

UTC = timezone.utc

router = APIRouter()


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


@router.post("/create", response_model=OrderCreateResponse)
async def create_order(
    payload: OrderCreateRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> OrderCreateResponse:
    """Persist pending order.

    In DEMO_MODE the order is marked paid immediately and PDF generation
    fires off in the background — no Stripe involvement. Otherwise, a real
    Stripe Checkout Session is created and its URL returned.
    """
    order = Order(
        email=payload.email.lower(),
        first_name=payload.calendar_config.first_name,
        status=OrderStatus.PENDING_PAYMENT,
        amount_eur=settings.CALENDAR_PRICE_EUR,
        currency="EUR",
        calendar_config=payload.calendar_config.model_dump(mode="json"),
        marketing_consent=payload.marketing_consent,
        ip_hash=hash_ip(_client_ip(request)),
    )
    db.add(order)
    await db.flush()

    # ------------------------------------------------------------------
    # Demo mode: bypass Stripe entirely.
    # ------------------------------------------------------------------
    if settings.DEMO_MODE:
        order.status = OrderStatus.GENERATING
        order.paid_at = datetime.now(UTC)
        order.stripe_session_id = f"demo_{order.id}"
        await db.commit()

        background_tasks.add_task(generate_calendar_task, order.id)
        log.info("orders.demo_created", order_id=str(order.id))

        demo_url = f"{settings.FRONTEND_URL}/orders/{order.id}/status"
        return OrderCreateResponse(order_id=order.id, checkout_url=demo_url)

    # ------------------------------------------------------------------
    # Live mode: real Stripe checkout.
    # ------------------------------------------------------------------
    success_url = f"{settings.FRONTEND_URL}/orders/{order.id}/status"
    cancel_url = f"{settings.FRONTEND_URL}/?cancelled=1"

    try:
        checkout = create_checkout_session(
            order_id=order.id,
            email=order.email,
            first_name=order.first_name,
            success_url=success_url,
            cancel_url=cancel_url,
        )
    except Exception as e:
        log.exception("orders.stripe_create_failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Nu am putut începe plata. Încearcă din nou în câteva secunde.",
        ) from e

    order.stripe_session_id = checkout["session_id"]
    await db.commit()

    return OrderCreateResponse(order_id=order.id, checkout_url=checkout["url"])


@router.get("/{order_id}/status", response_model=OrderStatusResponse)
async def get_order_status(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> OrderStatusResponse:
    """Status polled by frontend every 3s. No download URL here — use token flow."""
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(
            status_code=404, detail="Comanda nu a fost găsită."
        )

    estimated = None
    if order.status in (OrderStatus.PENDING_PAYMENT, OrderStatus.GENERATING):
        anchor = order.paid_at or order.created_at
        if anchor:
            estimated = anchor + timedelta(minutes=2)

    # Demo mode surfaces the signed download URL directly in the status
    # payload so the founder doesn't have to wait for the email to arrive.
    download_url = None
    if settings.DEMO_MODE and order.status == OrderStatus.READY:
        token = create_download_token(order.id, order.email)
        download_url = (
            f"{settings.API_BASE_URL}/api/v1/orders/{order.id}/download?token={token}"
        )

    return OrderStatusResponse(
        order_id=order.id,
        status=order.status.value,
        download_url=download_url,
        estimated_ready_at=estimated,
        error_message=order.last_error,
    )


@router.get("/{order_id}/download", response_model=None)
async def download_calendar(
    order_id: UUID,
    token: str,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse | FileResponse:
    """Validate the JWT and hand back the PDF.

    Live mode: 302-redirect to the S3 presigned URL.
    Demo mode: stream the local file directly (no S3 dependency).
    """
    try:
        payload = decode_download_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Link-ul a expirat. Te rugăm să ne contactezi.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Link invalid.")

    if payload.get("scope") != "download":
        raise HTTPException(status_code=403, detail="Token fără permisiune.")
    if payload.get("sub") != str(order_id):
        raise HTTPException(status_code=403, detail="Token pentru alt utilizator.")

    order = await db.get(Order, order_id)
    if order is None or order.pdf_s3_key is None:
        raise HTTPException(status_code=404, detail="PDF indisponibil încă.")
    if order.email != payload.get("email"):
        raise HTTPException(status_code=403, detail="Email nepotrivit.")
    if order.status != OrderStatus.READY:
        raise HTTPException(status_code=409, detail="Calendarul nu e încă gata.")

    if settings.DEMO_MODE:
        local: Path = demo_local_path(order.pdf_s3_key)
        if not local.exists():
            raise HTTPException(status_code=404, detail="PDF indisponibil (demo).")
        log.info("orders.download_demo", order_id=str(order_id))
        return FileResponse(
            path=str(local),
            media_type="application/pdf",
            filename=f"calendar-{order.first_name}.pdf",
        )

    try:
        url = await create_presigned_url(order.pdf_s3_key)
    except Exception as e:
        log.exception("orders.presign_failed", order_id=str(order_id), error=str(e))
        raise HTTPException(
            status_code=502, detail="Nu am putut pregăti linkul de descărcare."
        )

    log.info("orders.download", order_id=str(order_id))
    return RedirectResponse(url, status_code=302)
