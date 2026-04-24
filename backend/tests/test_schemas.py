"""CalendarConfig validators."""

from datetime import date, timedelta

import pytest

from app.schemas.calendar import (
    CalendarConfig,
    IconMapping,
    UserProfile,
)


def _profile() -> UserProfile:
    return UserProfile(
        productive_days=[0, 1, 3, 4],
        rest_days=[5, 6],
        reflection_day=2,
        morning_style="slow",
        motivation_style="gentle",
        focus_areas=["career"],
        quote_styles=["stoic"],
    )


def _icons() -> IconMapping:
    return IconMapping(
        productive=["rocket"],
        rest=["moon"],
        reflection=["candle"],
        celebration=["sparkle"],
        other=["sun"],
    )


def test_happy_path() -> None:
    cfg = CalendarConfig(
        template="template1",
        first_name="Ștefania-Maria",
        start_date=date.today() + timedelta(days=5),
        special_events=[],
        selected_holidays=[],
        user_profile=_profile(),
        icon_mapping=_icons(),
        calendar_name="Calendarul Ștefaniei",
    )
    assert cfg.end_date == cfg.start_date + timedelta(days=364)


def test_name_with_digits_rejected() -> None:
    with pytest.raises(Exception):
        CalendarConfig(
            template="template1",
            first_name="Andrei123",
            start_date=date.today() + timedelta(days=1),
            user_profile=_profile(),
            icon_mapping=_icons(),
            calendar_name="Calendar",
        )


def test_start_date_too_far() -> None:
    with pytest.raises(Exception):
        CalendarConfig(
            template="template1",
            first_name="Andrei",
            start_date=date.today() + timedelta(days=600),
            user_profile=_profile(),
            icon_mapping=_icons(),
            calendar_name="Calendar",
        )


def test_start_date_in_past_rejected() -> None:
    with pytest.raises(Exception):
        CalendarConfig(
            template="template1",
            first_name="Andrei",
            start_date=date.today() - timedelta(days=1),
            user_profile=_profile(),
            icon_mapping=_icons(),
            calendar_name="Calendar",
        )
