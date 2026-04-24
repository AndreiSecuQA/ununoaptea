"""Classifies each day of the calendar into a DayType used by the renderer."""

from __future__ import annotations

import enum
from collections.abc import Iterator
from dataclasses import dataclass
from datetime import date, timedelta

from app.data.holidays import HOLIDAYS, get_active_holidays_for_date
from app.schemas.calendar import CalendarConfig, SpecialEvent

WEEKDAY_NAMES_RO = [
    "Luni",
    "Marți",
    "Miercuri",
    "Joi",
    "Vineri",
    "Sâmbătă",
    "Duminică",
]
MONTH_NAMES_RO = [
    "ianuarie",
    "februarie",
    "martie",
    "aprilie",
    "mai",
    "iunie",
    "iulie",
    "august",
    "septembrie",
    "octombrie",
    "noiembrie",
    "decembrie",
]


class DayType(str, enum.Enum):
    FIRST = "first"
    LAST = "last"
    CELEBRATION = "celebration"
    HOLIDAY = "holiday"
    REFLECTION = "reflection"
    REST = "rest"
    PRODUCTIVE = "productive"
    GENERAL = "general"


# DayType → quote_pool (bucket in quotes.py).
DAY_TYPE_TO_POOL: dict[DayType, str] = {
    DayType.FIRST: "celebration",
    DayType.LAST: "celebration",
    DayType.CELEBRATION: "celebration",
    DayType.HOLIDAY: "celebration",
    DayType.REFLECTION: "reflection",
    DayType.REST: "rest",
    DayType.PRODUCTIVE: "productive",
    DayType.GENERAL: "general",
}

# DayType → icon_mapping slot name (one of `productive|rest|reflection|celebration|other`).
DAY_TYPE_TO_ICON_CAT: dict[DayType, str] = {
    DayType.FIRST: "celebration",
    DayType.LAST: "celebration",
    DayType.CELEBRATION: "celebration",
    DayType.HOLIDAY: "celebration",
    DayType.REFLECTION: "reflection",
    DayType.REST: "rest",
    DayType.PRODUCTIVE: "productive",
    DayType.GENERAL: "other",
}

# DayType → salutation key in salutations.py.
DAY_TYPE_TO_SALUTATION: dict[DayType, str] = {
    DayType.FIRST: "first_day",
    DayType.LAST: "last_day",
    DayType.CELEBRATION: "celebration",
    DayType.HOLIDAY: "holiday",
    DayType.REFLECTION: "reflection",
    DayType.REST: "rest",
    DayType.PRODUCTIVE: "productive",
    DayType.GENERAL: "general",
}


@dataclass
class DayContext:
    """All the info the renderer needs for a single calendar day."""

    the_date: date
    day_type: DayType
    weekday_name_ro: str
    month_year_ro: str
    day_number: int
    special_event: SpecialEvent | None = None
    holiday_name_ro: str | None = None


def _is_special_event(d: date, events: list[SpecialEvent]) -> SpecialEvent | None:
    for e in events:
        if e.month == d.month and e.day == d.day:
            return e
    return None


def _is_holiday(d: date, selected_ids: list[str]) -> str | None:
    matches = get_active_holidays_for_date(d, selected_ids)
    if matches:
        return matches[0].name_ro
    return None


def classify_day(d: date, config: CalendarConfig) -> DayType:
    """Deterministic classification with precedence:
    FIRST → LAST → CELEBRATION → HOLIDAY → REFLECTION → REST → PRODUCTIVE → GENERAL
    """
    if d == config.start_date:
        return DayType.FIRST
    if d == config.end_date:
        return DayType.LAST
    if _is_special_event(d, config.special_events):
        return DayType.CELEBRATION
    if _is_holiday(d, config.selected_holidays):
        return DayType.HOLIDAY

    weekday = d.weekday()
    if weekday == config.user_profile.reflection_day:
        return DayType.REFLECTION
    if weekday in config.user_profile.rest_days:
        return DayType.REST
    if weekday in config.user_profile.productive_days:
        return DayType.PRODUCTIVE
    return DayType.GENERAL


def build_day_context(d: date, config: CalendarConfig) -> DayContext:
    dt = classify_day(d, config)
    event = _is_special_event(d, config.special_events)
    hol = _is_holiday(d, config.selected_holidays) if dt == DayType.HOLIDAY else None
    return DayContext(
        the_date=d,
        day_type=dt,
        weekday_name_ro=WEEKDAY_NAMES_RO[d.weekday()],
        month_year_ro=f"{MONTH_NAMES_RO[d.month - 1]} {d.year}",
        day_number=d.day,
        special_event=event,
        holiday_name_ro=hol,
    )


def iter_days(config: CalendarConfig) -> Iterator[date]:
    d = config.start_date
    for _ in range(365):
        yield d
        d = d + timedelta(days=1)


def describe_holiday(holiday_id: str) -> str:
    h = HOLIDAYS.get(holiday_id)
    return h.name_ro if h else holiday_id
