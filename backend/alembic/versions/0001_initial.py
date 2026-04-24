"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-22 20:00:00
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001_initial"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(40), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending_payment",
                "generating",
                "ready",
                "failed",
                "deleted",
                name="order_status",
            ),
            nullable=False,
        ),
        sa.Column("stripe_session_id", sa.String(255), nullable=True),
        sa.Column("stripe_payment_intent_id", sa.String(255), nullable=True),
        sa.Column("amount_eur", sa.Float, nullable=False, server_default="15.0"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="EUR"),
        sa.Column("calendar_config", postgresql.JSONB(), nullable=False),
        sa.Column("pdf_s3_key", sa.String(512), nullable=True),
        sa.Column(
            "marketing_consent", sa.Boolean, nullable=False, server_default=sa.false()
        ),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_error", sa.String(2000), nullable=True),
    )
    op.create_index("ix_orders_email", "orders", ["email"])
    op.create_index("ix_orders_status", "orders", ["status"])
    op.create_index(
        "ix_orders_stripe_session_id", "orders", ["stripe_session_id"], unique=True
    )
    op.create_index("ix_orders_email_status", "orders", ["email", "status"])
    op.create_index("ix_orders_created_at_desc", "orders", ["created_at"])

    op.create_table(
        "processed_stripe_events",
        sa.Column("event_id", sa.String(255), primary_key=True),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column(
            "processed_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    op.create_table(
        "admin_users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_table("admin_users")
    op.drop_table("processed_stripe_events")
    op.drop_index("ix_orders_created_at_desc", table_name="orders")
    op.drop_index("ix_orders_email_status", table_name="orders")
    op.drop_index("ix_orders_stripe_session_id", table_name="orders")
    op.drop_index("ix_orders_status", table_name="orders")
    op.drop_index("ix_orders_email", table_name="orders")
    op.drop_table("orders")
    sa.Enum(name="order_status").drop(op.get_bind(), checkfirst=True)
