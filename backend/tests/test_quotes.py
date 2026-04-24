"""Quote database sanity + filtering."""

from collections import Counter

from app.data.quotes import ALL_QUOTES, ALL_QUOTES_LIST, get_pools_for_styles

VALID_STYLES = {"stoic", "modern", "spiritual", "romanian_authors", "existentialist"}
VALID_POOLS = {"productive", "rest", "reflection", "celebration", "general"}


def test_quote_shape_is_valid() -> None:
    """Every quote should have required fields with valid values."""
    for q in ALL_QUOTES_LIST:
        assert isinstance(q["text"], str) and q["text"]
        assert isinstance(q["author"], str) and q["author"]
        assert q["style"] in VALID_STYLES, f"unknown style: {q['style']!r}"
        assert q["pools"], "each quote needs at least one pool"
        for p in q["pools"]:
            assert p in VALID_POOLS, f"unknown pool: {p!r}"


def test_no_internal_jokes_leaked() -> None:
    """Spec: 'ni ha ha' must never appear as user-facing content."""
    for q in ALL_QUOTES_LIST:
        assert "ni ha ha" not in q["text"].lower()
        assert "ni ha ha" not in q["author"].lower()


def test_every_pool_has_content() -> None:
    """Rendering requires every pool to be non-empty."""
    for pool_name, quotes in ALL_QUOTES.items():
        assert len(quotes) > 0, f"pool {pool_name} is empty"


def test_filter_by_single_style_works() -> None:
    """Filtering by a single style must never leave a pool empty
    (fallback-to-full ensures the renderer always has content)."""
    for style in VALID_STYLES:
        filtered = get_pools_for_styles([style])
        for pool in VALID_POOLS:
            assert filtered[pool], f"pool {pool} empty for style {style}"


def test_filter_returns_selected_style_only_when_available() -> None:
    """When a style has coverage for a pool, filter should only return that style."""
    filtered = get_pools_for_styles(["stoic"])
    # Stoic pool has productive quotes — filter must not contain other styles.
    assert filtered["productive"], "stoic must cover productive"
    assert all(q["style"] == "stoic" for q in filtered["productive"])


def test_total_quotes_meets_minimum() -> None:
    """Sanity check on overall corpus size. Adjust upward as we expand."""
    assert len(ALL_QUOTES_LIST) >= 200


def test_style_distribution_is_balanced() -> None:
    """No single style should be absent or dominate."""
    styles = Counter(q["style"] for q in ALL_QUOTES_LIST)
    assert set(styles) == VALID_STYLES
    for style, count in styles.items():
        assert count >= 30, f"style {style} under-represented ({count})"
