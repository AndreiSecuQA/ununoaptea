"""Minimal admin dashboard — list orders, re-send email, GDPR actions.

Protected by HTTP Basic auth comparing against ADMIN_EMAIL + ADMIN_PASSWORD_HASH.
For MVP this is enough; v2 can add proper session-based admin auth.
"""

from __future__ import annotations

import csv
import io
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import log
from app.core.security import create_download_token, verify_password
from app.db.session import get_db
from app.models.order import Order, OrderStatus
from app.schemas.order import AdminOrderListResponse, AdminOrderSummary
from app.services.email_service import send_calendar_ready
from app.workers.generate_calendar import generate_calendar_task

UTC = timezone.utc

router = APIRouter()
_security = HTTPBasic()


def _require_admin(
    credentials: Annotated[HTTPBasicCredentials, Depends(_security)],
) -> str:
    expected_email = settings.ADMIN_EMAIL
    if not settings.ADMIN_PASSWORD_HASH:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin password not configured.",
        )
    email_ok = secrets.compare_digest(
        credentials.username.lower(), expected_email.lower()
    )
    pass_ok = verify_password(credentials.password, settings.ADMIN_PASSWORD_HASH)
    if not (email_ok and pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials.",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username


@router.get("/orders", response_model=AdminOrderListResponse)
async def list_orders(
    db: AsyncSession = Depends(get_db),
    _admin: str = Depends(_require_admin),
    status_filter: str | None = Query(None, alias="status"),
    email_search: str | None = Query(None, alias="email"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> AdminOrderListResponse:
    stmt = select(Order).order_by(Order.created_at.desc())
    count_stmt = select(func.count(Order.id))

    if status_filter:
        stmt = stmt.where(Order.status == OrderStatus(status_filter))
        count_stmt = count_stmt.where(Order.status == OrderStatus(status_filter))
    if email_search:
        like = f"%{email_search.lower()}%"
        stmt = stmt.where(Order.email.ilike(like))
        count_stmt = count_stmt.where(Order.email.ilike(like))

    total = (await db.execute(count_stmt)).scalar_one()
    rows = (
        await db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        )
    ).scalars().all()

    return AdminOrderListResponse(
        orders=[AdminOrderSummary.model_validate(o) for o in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/orders/{order_id}/resend-email")
async def resend_download_email(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    _admin: str = Depends(_require_admin),
) -> dict[str, str]:
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.status != OrderStatus.READY or not order.pdf_s3_key:
        raise HTTPException(status_code=409, detail="PDF not ready.")
    token = create_download_token(order.id, order.email)
    url = f"{settings.FRONTEND_URL}/orders/{order.id}/download?token={token}"
    await send_calendar_ready(order.email, order.first_name, url)
    log.info("admin.resend_email", order_id=str(order_id))
    return {"status": "sent"}


@router.post("/orders/{order_id}/regenerate")
async def regenerate_pdf(
    order_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    _admin: str = Depends(_require_admin),
) -> dict[str, str]:
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.status == OrderStatus.DELETED:
        raise HTTPException(status_code=410, detail="Order is deleted.")
    order.status = OrderStatus.GENERATING
    order.last_error = None
    order.updated_at = datetime.now(UTC)
    await db.commit()
    background_tasks.add_task(generate_calendar_task, order.id)
    return {"status": "queued"}


@router.get("/orders.csv")
async def export_orders_csv(
    db: AsyncSession = Depends(get_db),
    _admin: str = Depends(_require_admin),
    status_filter: str | None = Query(None, alias="status"),
) -> StreamingResponse:
    """Export all orders as CSV for accounting / bookkeeping."""
    stmt = select(Order).order_by(Order.created_at.desc())
    if status_filter:
        stmt = stmt.where(Order.status == OrderStatus(status_filter))
    rows = (await db.execute(stmt)).scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(
        [
            "order_id",
            "email",
            "first_name",
            "status",
            "amount_eur",
            "currency",
            "stripe_session_id",
            "marketing_consent",
            "created_at",
            "paid_at",
            "generated_at",
            "deleted_at",
        ]
    )
    for o in rows:
        writer.writerow(
            [
                str(o.id),
                o.email,
                o.first_name,
                o.status.value if hasattr(o.status, "value") else o.status,
                f"{o.amount_eur:.2f}",
                o.currency,
                o.stripe_session_id or "",
                "yes" if o.marketing_consent else "no",
                o.created_at.isoformat() if o.created_at else "",
                o.paid_at.isoformat() if o.paid_at else "",
                o.generated_at.isoformat() if o.generated_at else "",
                o.deleted_at.isoformat() if o.deleted_at else "",
            ]
        )
    buf.seek(0)

    today = datetime.now(UTC).strftime("%Y%m%d")
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="unu-noaptea-orders-{today}.csv"',
        },
    )


@router.get("/metrics")
async def metrics(
    db: AsyncSession = Depends(get_db),
    _admin: str = Depends(_require_admin),
    days: int = Query(30, ge=1, le=365),
) -> dict[str, object]:
    """Simple aggregate metrics for the admin dashboard."""
    since = datetime.now(UTC) - timedelta(days=days)

    total_orders = (
        await db.execute(select(func.count(Order.id)))
    ).scalar_one() or 0

    recent_orders = (
        await db.execute(
            select(func.count(Order.id)).where(Order.created_at >= since)
        )
    ).scalar_one() or 0

    paid_amount = (
        await db.execute(
            select(func.coalesce(func.sum(Order.amount_eur), 0.0)).where(
                Order.status.in_(
                    [OrderStatus.READY, OrderStatus.GENERATING]
                )
            )
        )
    ).scalar_one() or 0.0

    failed = (
        await db.execute(
            select(func.count(Order.id)).where(Order.status == OrderStatus.FAILED)
        )
    ).scalar_one() or 0

    ready = (
        await db.execute(
            select(func.count(Order.id)).where(Order.status == OrderStatus.READY)
        )
    ).scalar_one() or 0

    status_breakdown = {
        s.value: (
            await db.execute(
                select(func.count(Order.id)).where(Order.status == s)
            )
        ).scalar_one()
        or 0
        for s in OrderStatus
    }

    failure_rate = (failed / total_orders) if total_orders else 0.0

    return {
        "window_days": days,
        "total_orders": int(total_orders),
        "recent_orders": int(recent_orders),
        "ready_orders": int(ready),
        "failed_orders": int(failed),
        "failure_rate": round(failure_rate, 4),
        "revenue_eur": round(float(paid_amount), 2),
        "status_breakdown": status_breakdown,
    }
