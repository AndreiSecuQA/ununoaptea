"""Integration tests for the orders + webhooks + gdpr API endpoints.

Uses an in-memory SQLite database with the app's ORM metadata, overrides the
`get_db` dependency, and monkey-patches external calls (Stripe, S3, email).
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import Order, OrderStatus  # noqa: F401 — registers tables

# --- Fixtures --------------------------------------------------------------


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    SessionLocal = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with SessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine):
    SessionLocal = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )

    async def _override_get_db():
        async with SessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


def _minimal_config() -> dict[str, Any]:
    return {
        "template": "template1",
        "first_name": "Andrei",
        "start_date": (date.today() + timedelta(days=5)).isoformat(),
        "special_events": [],
        "selected_holidays": ["new_year"],
        "user_profile": {
            "productive_days": [0, 1, 2, 3, 4],
            "rest_days": [5],
            "reflection_day": 6,
            "morning_style": "slow",
            "motivation_style": "gentle",
            "focus_areas": ["career"],
            "quote_styles": ["stoic"],
        },
        "icon_mapping": {
            "productive": ["rocket"],
            "rest": ["moon"],
            "reflection": ["spiral"],
            "celebration": ["sparkle"],
            "other": ["star"],
        },
        "cover_message": None,
        "closing_message": None,
        "calendar_name": "Calendarul lui Andrei",
    }


# --- Tests -----------------------------------------------------------------


@pytest.mark.asyncio
async def test_health_ok(client: AsyncClient) -> None:
    r = await client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_orders_create_requires_consents(client: AsyncClient) -> None:
    payload = {
        "calendar_config": _minimal_config(),
        "email": "user@example.com",
        "gdpr_consent": False,  # invalid
        "marketing_consent": False,
        "withdrawal_waiver": True,
    }
    r = await client.post("/api/v1/orders/create", json=payload)
    assert r.status_code == 422


@pytest.mark.asyncio
async def test_orders_create_stripe_stubbed(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def _fake_create_checkout(**kwargs: Any) -> dict[str, str]:
        return {
            "session_id": "cs_test_stub",
            "url": "https://checkout.stripe.test/stub",
        }

    # Patch the symbol used by the endpoint.
    monkeypatch.setattr(
        "app.api.orders.create_checkout_session", _fake_create_checkout
    )

    payload = {
        "calendar_config": _minimal_config(),
        "email": "user@example.com",
        "gdpr_consent": True,
        "marketing_consent": False,
        "withdrawal_waiver": True,
    }
    r = await client.post("/api/v1/orders/create", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["checkout_url"] == "https://checkout.stripe.test/stub"
    assert UUID(body["order_id"])


@pytest.mark.asyncio
async def test_orders_status_404_for_missing(client: AsyncClient) -> None:
    r = await client.get(f"/api/v1/orders/{uuid4()}/status")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_orders_status_returns_pending(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    order = Order(
        email="u@example.com",
        first_name="Andrei",
        status=OrderStatus.PENDING_PAYMENT,
        amount_eur=15.0,
        calendar_config=_minimal_config(),
        marketing_consent=False,
    )
    db_session.add(order)
    await db_session.commit()
    order_id = order.id

    r = await client.get(f"/api/v1/orders/{order_id}/status")
    assert r.status_code == 200
    assert r.json()["status"] == "pending_payment"


@pytest.mark.asyncio
async def test_legal_privacy_served(client: AsyncClient) -> None:
    r = await client.get("/api/v1/legal/privacy")
    assert r.status_code == 200
    assert "Confidențialitate" in r.text


@pytest.mark.asyncio
async def test_gdpr_delete_request_sends_email(
    client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    sent: list[dict[str, str]] = []

    async def _fake_send(to: str, confirm_url: str) -> None:
        sent.append({"to": to, "url": confirm_url})

    monkeypatch.setattr("app.api.gdpr.send_gdpr_confirm", _fake_send)

    # Seed an order so the endpoint has something to target.
    order = Order(
        email="del@example.com",
        first_name="Del",
        status=OrderStatus.READY,
        amount_eur=15.0,
        calendar_config=_minimal_config(),
        marketing_consent=False,
    )
    db_session.add(order)
    await db_session.commit()

    r = await client.post(
        "/api/v1/gdpr/delete-my-data",
        json={"email": "del@example.com"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "email_sent"
    assert len(sent) == 1
    assert sent[0]["to"] == "del@example.com"


@pytest.mark.asyncio
async def test_download_requires_valid_token(client: AsyncClient) -> None:
    """Download endpoint must reject missing/invalid tokens."""
    r = await client.get(
        f"/api/v1/orders/{uuid4()}/download", params={"token": "nope"}
    )
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_download_happy_path(
    client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """With a valid JWT and READY status the endpoint 302-redirects to S3."""
    from app.core.security import create_download_token

    async def _fake_presign(key: str) -> str:
        return f"https://s3.example/{key}?sig=ok"

    monkeypatch.setattr("app.api.orders.create_presigned_url", _fake_presign)

    order = Order(
        email="dl@example.com",
        first_name="Dl",
        status=OrderStatus.READY,
        amount_eur=15.0,
        calendar_config=_minimal_config(),
        marketing_consent=False,
        pdf_s3_key="orders/test/calendar.pdf",
    )
    db_session.add(order)
    await db_session.commit()

    token = create_download_token(order.id, "dl@example.com")
    r = await client.get(
        f"/api/v1/orders/{order.id}/download",
        params={"token": token},
        follow_redirects=False,
    )
    assert r.status_code == 302
    assert r.headers["location"].startswith("https://s3.example/")


@pytest.mark.asyncio
async def test_download_email_mismatch_403(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    """Token claiming a different email than the order is rejected."""
    from app.core.security import create_download_token

    order = Order(
        email="owner@example.com",
        first_name="Owner",
        status=OrderStatus.READY,
        amount_eur=15.0,
        calendar_config=_minimal_config(),
        marketing_consent=False,
        pdf_s3_key="orders/test/calendar.pdf",
    )
    db_session.add(order)
    await db_session.commit()

    token = create_download_token(order.id, "attacker@example.com")
    r = await client.get(
        f"/api/v1/orders/{order.id}/download", params={"token": token}
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_gdpr_confirm_deletes_order(
    client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Confirm endpoint soft-deletes matching orders and redacts PII."""
    from app.core.security import create_gdpr_delete_token

    # S3 delete is patched — we don't have a real bucket in tests.
    async def _fake_s3_delete(key: str) -> None:
        return None

    monkeypatch.setattr("app.api.gdpr.delete_pdf", _fake_s3_delete)

    order = Order(
        email="bye@example.com",
        first_name="Bye",
        status=OrderStatus.READY,
        amount_eur=15.0,
        calendar_config=_minimal_config(),
        marketing_consent=True,
        pdf_s3_key="orders/bye/calendar.pdf",
    )
    db_session.add(order)
    await db_session.commit()
    order_id = order.id

    token = create_gdpr_delete_token("bye@example.com")
    r = await client.get(
        "/api/v1/gdpr/delete-my-data/confirm", params={"token": token}
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] == "deleted"

    # Reload from DB and verify redaction.
    db_session.expire_all()
    reloaded = await db_session.get(Order, order_id)
    assert reloaded is not None
    assert reloaded.status == OrderStatus.DELETED
    assert reloaded.first_name == "[redacted]"
    assert reloaded.pdf_s3_key is None
    assert reloaded.marketing_consent is False


@pytest.mark.asyncio
async def test_gdpr_confirm_rejects_invalid_token(client: AsyncClient) -> None:
    r = await client.get(
        "/api/v1/gdpr/delete-my-data/confirm", params={"token": "bogus"}
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_webhook_ignores_unhandled_event(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Events we don't subscribe to are acknowledged without side effects."""
    event = {"id": "evt_unhandled_1", "type": "customer.updated", "data": {}}

    def _fake_verify(payload: bytes, sig: str) -> dict[str, Any]:
        return event

    monkeypatch.setattr("app.api.webhooks.verify_webhook_signature", _fake_verify)
    r = await client.post(
        "/api/v1/webhooks/stripe", content=b"{}", headers={"stripe-signature": "x"}
    )
    assert r.status_code == 200
    assert r.json() == {"status": "ignored", "type": "customer.updated"}


@pytest.mark.asyncio
async def test_webhook_rejects_invalid_signature(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Tampered webhook payloads yield 400."""
    import stripe as stripe_pkg

    def _fake_verify(payload: bytes, sig: str) -> Any:
        raise stripe_pkg.SignatureVerificationError("bad sig", sig_header=sig)

    monkeypatch.setattr("app.api.webhooks.verify_webhook_signature", _fake_verify)
    r = await client.post(
        "/api/v1/webhooks/stripe", content=b"{}", headers={"stripe-signature": "x"}
    )
    assert r.status_code == 400


@pytest.mark.asyncio
async def test_webhook_idempotency(
    client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Seed a pending order.
    order = Order(
        email="hook@example.com",
        first_name="Hook",
        status=OrderStatus.PENDING_PAYMENT,
        amount_eur=15.0,
        calendar_config=_minimal_config(),
        marketing_consent=False,
    )
    db_session.add(order)
    await db_session.commit()

    event = {
        "id": "evt_test_1",
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_1",
                "payment_intent": "pi_test_1",
                "metadata": {"order_id": str(order.id)},
            }
        },
    }

    def _fake_verify(payload: bytes, sig: str) -> dict[str, Any]:
        return event

    # Don't actually dispatch PDF generation in the background.
    async def _noop_task(*args: Any, **kwargs: Any) -> None:
        return None

    monkeypatch.setattr("app.api.webhooks.verify_webhook_signature", _fake_verify)
    monkeypatch.setattr("app.api.webhooks.generate_calendar_task", _noop_task)

    r1 = await client.post(
        "/api/v1/webhooks/stripe", content=b"{}", headers={"stripe-signature": "x"}
    )
    assert r1.status_code == 200
    assert r1.json()["status"] == "ok"

    # Duplicate delivery — should be marked duplicate thanks to idempotency table.
    r2 = await client.post(
        "/api/v1/webhooks/stripe", content=b"{}", headers={"stripe-signature": "x"}
    )
    assert r2.status_code == 200
    assert r2.json()["status"] == "duplicate"
