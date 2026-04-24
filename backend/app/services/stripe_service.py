"""Stripe integration — hosted Checkout + webhook verification."""

from __future__ import annotations

from typing import Any, cast
from uuid import UUID

import stripe

from app.core.config import settings
from app.core.logging import log

if settings.STRIPE_SECRET_KEY:
    stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(
    order_id: UUID,
    email: str,
    first_name: str,
    success_url: str,
    cancel_url: str,
) -> dict[str, Any]:
    """Create a Stripe Checkout Session for the digital PDF (€15).

    Metadata carries `order_id` so the webhook can reconcile.
    """
    if not settings.STRIPE_SECRET_KEY:
        raise RuntimeError("Stripe nu este configurat — setează STRIPE_SECRET_KEY.")

    # Prefer price object if configured, otherwise inline price_data.
    line_item: dict[str, Any]
    if settings.STRIPE_DIGITAL_PRICE_ID:
        line_item = {"price": settings.STRIPE_DIGITAL_PRICE_ID, "quantity": 1}
    else:
        line_item = {
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": "Calendar: Vorbim la UNU NOAPTEA",
                    "description": "Calendar personalizat PDF, 365 de zile.",
                },
                "unit_amount": int(settings.CALENDAR_PRICE_EUR * 100),
            },
            "quantity": 1,
        }

    session = stripe.checkout.Session.create(
        mode="payment",
        payment_method_types=["card"],
        customer_email=email,
        # cast: Stripe SDK types the items as TypedDicts — our dict is
        # structurally identical but mypy insists on a nominal match.
        line_items=cast(Any, [line_item]),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"order_id": str(order_id), "first_name": first_name},
        locale="ro",
    )
    log.info(
        "stripe.checkout_created",
        order_id=str(order_id),
        session_id=session.id,
    )
    return {"session_id": session.id, "url": session.url}


def verify_webhook_signature(payload: bytes, sig_header: str) -> stripe.Event:
    """Raises stripe.SignatureVerificationError on tampering."""
    event = stripe.Webhook.construct_event(  # type: ignore[no-untyped-call]
        payload=payload,
        sig_header=sig_header,
        secret=settings.STRIPE_WEBHOOK_SECRET,
    )
    return cast(stripe.Event, event)
