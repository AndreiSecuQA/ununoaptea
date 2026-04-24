"""Background task that turns a paid Order into a PDF on S3 + notifies user."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from uuid import UUID

from app.core.config import settings
from app.core.logging import log
from app.core.security import create_download_token
from app.db.session import AsyncSessionLocal
from app.models.order import Order, OrderStatus
from app.schemas.calendar import CalendarConfig
from app.services.email_service import (
    send_calendar_ready,
    send_generation_failed,
    send_order_confirmation,
)
from app.services.pdf_generator import generate_calendar_pdf
from app.services.s3_service import upload_pdf

UTC = timezone.utc


async def generate_calendar_task(order_id: UUID) -> None:
    """End-to-end: load order → gen PDF → S3 upload → mark ready → email."""
    log.info("worker.start", order_id=str(order_id))
    async with AsyncSessionLocal() as session:
        order = await session.get(Order, order_id)
        if order is None:
            log.error("worker.order_not_found", order_id=str(order_id))
            return

        if order.status not in (OrderStatus.GENERATING, OrderStatus.PENDING_PAYMENT):
            log.warning(
                "worker.order_wrong_status",
                order_id=str(order_id),
                status=order.status.value,
            )
            return

        order.status = OrderStatus.GENERATING
        await session.commit()

        try:
            config = CalendarConfig.model_validate(order.calendar_config)
        except Exception as e:
            log.exception("worker.config_invalid", order_id=str(order_id), error=str(e))
            order.status = OrderStatus.FAILED
            order.last_error = f"Config invalid: {e}"
            await session.commit()
            await send_generation_failed(order.email, order.first_name)
            return

        status_url = f"{settings.FRONTEND_URL}/orders/{order.id}/status"
        try:
            await send_order_confirmation(order.email, order.first_name, status_url)
        except Exception as e:  # don't fail the job over email
            log.warning(
                "worker.confirmation_email_failed",
                order_id=str(order_id),
                error=str(e),
            )

        try:
            # PDF generation is CPU-bound — offload to thread.
            result = await asyncio.to_thread(
                generate_calendar_pdf, config, settings.PROMO_CODE_NEXT_YEAR
            )
            key = f"orders/{order.id}/calendar.pdf"
            await upload_pdf(key, result.pdf_bytes)
            order.pdf_s3_key = key
            order.status = OrderStatus.READY
            order.generated_at = datetime.now(UTC)
            order.last_error = None
            await session.commit()

            token = create_download_token(order.id, order.email)
            download_url = (
                f"{settings.FRONTEND_URL}/orders/{order.id}/download?token={token}"
            )
            await send_calendar_ready(order.email, order.first_name, download_url)
            log.info(
                "worker.done",
                order_id=str(order_id),
                pages=result.pages,
                duration_s=round(result.duration_seconds, 2),
            )
        except Exception as e:
            log.exception(
                "worker.generation_failed",
                order_id=str(order_id),
                error=str(e),
            )
            order.status = OrderStatus.FAILED
            order.last_error = str(e)[:2000]
            await session.commit()
            try:
                await send_generation_failed(order.email, order.first_name)
            except Exception as mail_err:
                log.warning(
                    "worker.failure_email_failed",
                    order_id=str(order_id),
                    error=str(mail_err),
                )
