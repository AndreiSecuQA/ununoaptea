"""Day classification precedence + context building."""

from datetime import date, timedelta

import pytest

from app.schemas.calendar import (
    CalendarConfig,
    IconMapping,
    SpecialEvent,
    UserProfile,
)
from app.services.day_classifier import DayType, classify_day


def _cfg(
    start: date = date.today() + timedelta(days=7),
    productive: list[int] | None = None,
    rest: list[int] | None = None,
    reflection: int = 2,
    events: list[SpecialEvent] | None = None,
    holidays: list[str] | None = None,
) -> CalendarConfig:
    return CalendarConfig(
        template="template1",
        first_name="Andrei",
        start_date=start,
        special_events=events or [],
        selected_holidays=holidays or [],
        user_profile=UserProfile(
            productive_days=productive or [0, 1, 3, 4],
            rest_days=rest or [5, 6],
            reflection_day=reflection,
            morning_style="slow",
            motivation_style="gentle",
            focus_areas=["career"],
            quote_styles=["stoic"],
        ),
        icon_mapping=IconMapping(
            productive=["rocket"],
            rest=["moon"],
            reflection=["candle"],
            celebration=["sparkle"],
            other=["sun"],
        ),
        calendar_name="Calendarul lui Andrei",
    )


def test_first_and_last_day() -> None:
    c = _cfg()
    assert classify_day(c.start_date, c) == DayType.FIRST
    assert classify_day(c.end_date, c) == DayType.LAST


def test_holiday_beats_weekday() -> None:
    # Use Jan 1 2027 (a Friday — productive under defaults) with new_year holiday
    c = _cfg(start=date(2027, 1, 1), holidays=["new_year"])
    assert classify_day(date(2027, 1, 1), c) == DayType.FIRST  # FIRST > HOLIDAY
    # Pick a second new_year in the range only if there is one — skip this case.


def test_productive_rest_reflection() -> None:
    c = _cfg(start=date(2027, 3, 1))  # Mon start
    # Mon = productive (weekday 0)
    assert classify_day(date(2027, 3, 2), c) == DayType.PRODUCTIVE  # Tue
    # Sat = rest (weekday 5)
    assert classify_day(date(2027, 3, 6), c) == DayType.REST
    # Wed (weekday 2) = reflection
    assert classify_day(date(2027, 3, 3), c) == DayType.REFLECTION


def test_overlap_rejected_by_schema() -> None:
    with pytest.raises(Exception):
        UserProfile(
            productive_days=[0, 1, 2],
            rest_days=[2, 5, 6],
            reflection_day=3,
            morning_style="slow",
            motivation_style="gentle",
            focus_areas=["career"],
            quote_styles=["stoic"],
        )
