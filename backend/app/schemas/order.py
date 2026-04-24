"""Request/response schemas for /orders endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.calendar import CalendarConfig


class OrderCreateRequest(BaseModel):
    calendar_config: CalendarConfig
    email: EmailStr
    gdpr_consent: bool
    marketing_consent: bool = False
    withdrawal_waiver: bool

    @model_validator(mode="after")
    def required_consents(self) -> OrderCreateRequest:
        if not self.gdpr_consent:
            raise ValueError(
                "Trebuie să accepți Termenii și Politica de confidențialitate."
            )
        if not self.withdrawal_waiver:
            raise ValueError(
                "Trebuie să confirmi renunțarea la dreptul de retragere pentru produs digital."
            )
        return self


class OrderCreateResponse(BaseModel):
    order_id: UUID
    checkout_url: str


class OrderStatusResponse(BaseModel):
    order_id: UUID
    status: Literal[
        "pending_payment", "generating", "ready", "failed", "deleted"
    ]
    download_url: str | None = None
    estimated_ready_at: datetime | None = None
    error_message: str | None = None


class GdprDeleteRequest(BaseModel):
    email: EmailStr
    order_id: UUID | None = None


class GdprDeleteResponse(BaseModel):
    status: Literal["email_sent"] = "email_sent"
    message: str = (
        "Ți-am trimis un link de confirmare pe email. Apasă-l pentru a finaliza ștergerea."
    )


class AdminOrderSummary(BaseModel):
    id: UUID
    email: str
    first_name: str
    status: str
    amount_eur: float
    created_at: datetime
    paid_at: datetime | None
    generated_at: datetime | None

    model_config = {"from_attributes": True}


class AdminOrderListResponse(BaseModel):
    orders: list[AdminOrderSummary]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
