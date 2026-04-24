"""Stripe webhook endpoint with idempotency + background PDF generation."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import stripe
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import log
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.models.processed_stripe_event import ProcessedStripeEvent
from app.services.stripe_service import verify_webhook_signature
from app.workers.generate_calendar import generate_calendar_task

UTC = timezone.utc

router = APIRouter()


@router.post("/stripe", include_in_schema=False)
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = verify_webhook_signature(payload, sig)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")

    # --- Idempotency guard ---
    processed = ProcessedStripeEvent(event_id=event["id"], event_type=event["type"])
    db.add(processed)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        log.info("webhook.duplicate", event_id=event["id"])
        return {"status": "duplicate"}

    handler = _HANDLERS.get(event["type"])
    if handler is None:
        await db.commit()
        return {"status": "ignored", "type": event["type"]}

    await handler(event, db, background_tasks)
    await db.commit()
    return {"status": "ok"}


# --- Handlers ---


async def _handle_checkout_completed(
    event: dict[str, Any],
    db: AsyncSession,
    background_tasks: BackgroundTasks,
) -> None:
    session = event["data"]["object"]
    order_id_str = (session.get("metadata") or {}).get("order_id")
    if not order_id_str:
        log.error("webhook.no_order_id", session=session.get("id"))
        return
    try:
        order_id = UUID(order_id_str)
    except ValueError:
        log.error("webhook.bad_order_id", value=order_id_str)
        return

    order = await db.get(Order, order_id)
    if order is None:
        log.error("webhook.order_missing", order_id=order_id_str)
        return

    # Only transition if still pending.
    if order.status == OrderStatus.PENDING_PAYMENT:
        order.status = OrderStatus.GENERATING
        order.paid_at = datetime.now(UTC)
        order.stripe_payment_intent_id = session.get("payment_intent")
        await db.flush()

        # Dispatch background task — runs after this request returns.
        background_tasks.add_task(generate_calendar_task, order.id)
        log.info("webhook.checkout_completed", order_id=str(order.id))
    else:
        log.info(
            "webhook.checkout_completed_noop",
            order_id=str(order.id),
            status=order.status.value,
        )


async def _handle_payment_failed(
    event: dict[str, Any],
    db: AsyncSession,
    background_tasks: BackgroundTasks,
) -> None:
    session = event["data"]["object"]
    order_id_str = (session.get("metadata") or {}).get("order_id")
    if not order_id_str:
        return
    try:
        order_id = UUID(order_id_str)
    except ValueError:
        return
    order = await db.get(Order, order_id)
    if order and order.status == OrderStatus.PENDING_PAYMENT:
        order.status = OrderStatus.FAILED
        order.last_error = "Plata a eșuat."
        log.warning("webhook.payment_failed", order_id=str(order.id))


_HANDLERS = {
    "checkout.session.completed": _handle_checkout_completed,
    "checkout.session.async_payment_failed": _handle_payment_failed,
    "payment_intent.payment_failed": _handle_payment_failed,
}
