"""Smoke test — PDF generator produces a non-empty PDF with 367 pages."""

from datetime import date, timedelta

from app.schemas.calendar import (
    CalendarConfig,
    IconMapping,
    UserProfile,
)
from app.services.pdf_generator import generate_calendar_pdf


def test_generate_smoke() -> None:
    config = CalendarConfig(
        template="template1",
        first_name="Andrei",
        start_date=date.today() + timedelta(days=3),
        special_events=[],
        selected_holidays=["new_year", "labour_day", "christmas"],
        user_profile=UserProfile(
            productive_days=[0, 1, 3, 4],
            rest_days=[5, 6],
            reflection_day=2,
            morning_style="slow",
            motivation_style="gentle",
            focus_areas=["career"],
            quote_styles=["stoic", "modern"],
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

    result = generate_calendar_pdf(config)
    assert result.pages == 367
    assert result.pdf_bytes.startswith(b"%PDF-")
    assert len(result.pdf_bytes) > 50_000  # clearly non-trivial
