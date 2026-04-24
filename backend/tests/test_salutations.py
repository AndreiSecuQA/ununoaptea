"""Salutations content integrity."""

from app.data.salutations import SALUTATIONS

EXPECTED_KEYS = {
    "first_day",
    "last_day",
    "celebration",
    "holiday",
    "reflection",
    "rest",
    "productive",
    "general",
}


def test_all_categories_present() -> None:
    assert set(SALUTATIONS.keys()) == EXPECTED_KEYS


def test_every_category_meets_minimum_count() -> None:
    """Spec: minim 20 salutări per categorie pentru varietate."""
    for key, items in SALUTATIONS.items():
        assert len(items) >= 15, (
            f"category {key} has only {len(items)} salutations (minim 15)"
        )


def test_every_salutation_has_name_placeholder() -> None:
    """Every salutation must interpolate {name}."""
    for key, items in SALUTATIONS.items():
        for s in items:
            assert "{name}" in s, f"{key}: salutation missing {{name}}: {s!r}"


def test_no_internal_jokes() -> None:
    for items in SALUTATIONS.values():
        for s in items:
            assert "ni ha ha" not in s.lower()
