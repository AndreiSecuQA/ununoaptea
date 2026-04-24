"""Orthodox Easter + holiday resolution."""

from datetime import date

from app.data.holidays import (
    compute_orthodox_easter,
    get_active_holidays_for_date,
    resolve_holiday_dates,
)


def test_orthodox_easter_known_years() -> None:
    # Known Orthodox Easter dates (Gregorian):
    assert compute_orthodox_easter(2024) == date(2024, 5, 5)
    assert compute_orthodox_easter(2025) == date(2025, 4, 20)
    assert compute_orthodox_easter(2026) == date(2026, 4, 12)
    assert compute_orthodox_easter(2027) == date(2027, 5, 2)


def test_pentecost_is_49_days_after_easter() -> None:
    easter = compute_orthodox_easter(2026)
    dates = resolve_holiday_dates(["pentecost"], 2026)
    pentecost = list(dates.keys())[0]
    assert (pentecost - easter).days == 49


def test_new_year_resolves() -> None:
    result = get_active_holidays_for_date(date(2026, 1, 1), ["new_year"])
    assert len(result) == 1
    assert result[0].id == "new_year"


def test_unknown_id_is_ignored() -> None:
    result = resolve_holiday_dates(["does_not_exist"], 2026)
    assert result == {}
