"""Pydantic schemas for CalendarConfig — the full wizard payload."""

from __future__ import annotations

import re
from datetime import date, timedelta
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

# --- Constants ---

QuoteStyle = Literal[
    "stoic", "modern", "spiritual", "romanian_authors", "existentialist"
]
EventType = Literal["birthday", "anniversary", "celebration", "reminder", "other"]
MorningStyle = Literal["energetic", "slow", "variable", "no_routine"]
MotivationStyle = Literal["challenging", "gentle", "mixed", "self"]
FocusArea = Literal[
    "career",
    "health",
    "relationships",
    "creativity",
    "peace",
    "finance",
    "self_knowledge",
]

NAME_RE = re.compile(r"^[A-Za-zĂăÂâÎîȘșȚțşţ\s\-']+$")


# --- Sub-models ---


class SpecialEvent(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    month: int = Field(ge=1, le=12)
    day: int = Field(ge=1, le=31)
    event_type: EventType

    @model_validator(mode="after")
    def check_date(self) -> SpecialEvent:
        # Reject clearly impossible combos (31 Feb etc.)
        try:
            date(2024, self.month, self.day)  # leap year — permissive
        except ValueError:
            raise ValueError(
                f"Data {self.day}.{self.month} nu există — verifică ziua/luna."
            )
        return self


class UserProfile(BaseModel):
    productive_days: list[int] = Field(min_length=1, max_length=7)
    rest_days: list[int] = Field(min_length=1, max_length=7)
    reflection_day: int = Field(ge=0, le=6)
    morning_style: MorningStyle
    motivation_style: MotivationStyle
    focus_areas: list[FocusArea] = Field(min_length=1, max_length=3)
    quote_styles: list[QuoteStyle] = Field(min_length=1)

    @field_validator("productive_days", "rest_days")
    @classmethod
    def days_in_range(cls, v: list[int]) -> list[int]:
        for d in v:
            if not 0 <= d <= 6:
                raise ValueError("Zilele trebuie să fie între 0 (Luni) și 6 (Duminică)")
        if len(set(v)) != len(v):
            raise ValueError("Zilele nu pot fi duplicate")
        return sorted(set(v))

    @model_validator(mode="after")
    def no_overlap_and_valid_reflection(self) -> UserProfile:
        if set(self.productive_days) & set(self.rest_days):
            raise ValueError(
                "Zilele productive și zilele de odihnă nu se pot suprapune."
            )
        if (
            self.reflection_day in self.productive_days
            or self.reflection_day in self.rest_days
        ):
            raise ValueError(
                "Ziua de reflecție nu poate fi și zi productivă sau zi de odihnă."
            )
        return self


class IconMapping(BaseModel):
    productive: list[str] = Field(min_length=1, max_length=2)
    rest: list[str] = Field(min_length=1, max_length=2)
    reflection: list[str] = Field(min_length=1, max_length=2)
    celebration: list[str] = Field(min_length=1, max_length=2)
    other: list[str] = Field(min_length=1, max_length=2)


class CalendarConfig(BaseModel):
    """Full wizard payload persisted in Order.calendar_config."""

    template: str = "template1"
    first_name: str = Field(min_length=1, max_length=40)
    start_date: date
    special_events: list[SpecialEvent] = Field(default_factory=list, max_length=20)
    selected_holidays: list[str] = Field(default_factory=list)
    user_profile: UserProfile
    icon_mapping: IconMapping
    cover_message: str | None = Field(None, max_length=500)
    closing_message: str | None = Field(None, max_length=1000)
    calendar_name: str = Field(min_length=3, max_length=60)

    @field_validator("first_name")
    @classmethod
    def valid_name(cls, v: str) -> str:
        v = v.strip()
        if not NAME_RE.match(v):
            raise ValueError(
                "Numele trebuie să conțină doar litere (inclusiv diacritice), spații și cratimă."
            )
        return v

    @field_validator("start_date")
    @classmethod
    def start_date_in_range(cls, v: date) -> date:
        today = date.today()
        if v < today:
            raise ValueError("Data de început nu poate fi în trecut.")
        if v > today + timedelta(days=540):
            raise ValueError("Data de început trebuie să fie în următoarele 18 luni.")
        return v

    @field_validator("template")
    @classmethod
    def known_template(cls, v: str) -> str:
        # MVP accepts only template1; keep schema open for v2.
        if v not in {"template1"}:
            raise ValueError(f"Template necunoscut: {v}")
        return v

    @property
    def end_date(self) -> date:
        return self.start_date + timedelta(days=364)
