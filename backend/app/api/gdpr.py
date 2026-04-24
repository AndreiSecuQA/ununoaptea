"""GDPR data-deletion endpoints (magic-link confirmation)."""

from __future__ import annotations

from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import log
from app.core.security import create_gdpr_delete_token, decode_gdpr_delete_token
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import GdprDeleteRequest, GdprDeleteResponse
from app.services.email_service import send_gdpr_confirm
from app.services.s3_service import delete_pdf

UTC = timezone.utc

router = APIRouter()


@router.post("/delete-my-data", response_model=GdprDeleteResponse)
async def request_deletion(
    payload: GdprDeleteRequest,
    db: AsyncSession = Depends(get_db),
) -> GdprDeleteResponse:
    """Send a 24h magic link to the user's email to confirm deletion."""
    token = create_gdpr_delete_token(payload.email.lower())
    confirm_url = f"{settings.API_BASE_URL}/api/v1/gdpr/delete-my-data/confirm?token={token}"
    try:
        await send_gdpr_confirm(payload.email, confirm_url)
    except Exception as e:
        log.exception("gdpr.email_failed", error=str(e))
        raise HTTPException(
            status_code=502, detail="Nu am putut trimite email-ul. Încearcă din nou."
        )
    log.info("gdpr.request_sent", email_hash=hash(payload.email.lower()))
    return GdprDeleteResponse()


@router.get("/delete-my-data/confirm")
async def confirm_deletion(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    try:
        payload = decode_gdpr_delete_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=410, detail="Linkul a expirat. Te rugăm să ceri din nou."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Token invalid.")

    email = payload["email"]
    result = await db.execute(
        select(Order).where(
            Order.email == email,
            Order.status != OrderStatus.DELETED,
        )
    )
    orders = result.scalars().all()

    deleted_count = 0
    for order in orders:
        if order.pdf_s3_key:
            try:
                await delete_pdf(order.pdf_s3_key)
            except Exception as e:
                log.warning(
                    "gdpr.s3_delete_failed",
                    order_id=str(order.id),
                    error=str(e),
                )
        order.status = OrderStatus.DELETED
        order.calendar_config = {"redacted": True}
        order.first_name = "[redacted]"
        order.pdf_s3_key = None
        order.marketing_consent = False
        order.deleted_at = datetime.now(UTC)
        deleted_count += 1

    await db.commit()
    log.info("gdpr.deletion_confirmed", email_hash=hash(email), count=deleted_count)
    return {
        "status": "deleted",
        "message": f"Datele asociate cu {email} au fost șterse. Comenzi afectate: {deleted_count}.",
    }
