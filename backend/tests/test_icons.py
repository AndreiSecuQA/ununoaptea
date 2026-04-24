"""Ensure the SVG icon pool meets the spec minimum of 30 icons."""

from pathlib import Path

ICON_DIR = Path(__file__).parent.parent / "app" / "assets" / "icons"

REQUIRED_ICONS = {
    # Work
    "rocket", "target", "lightbulb", "briefcase", "flame", "pen",
    # Rest
    "moon", "cloud", "leaf", "teacup", "bath", "butterfly",
    # Reflection
    "candle", "spiral", "feather", "key", "meditation",
    # Celebration
    "sparkle", "gift", "heart", "balloon", "cake",
    # Nature / Other
    "sun", "mountain", "tree", "flower", "compass", "star", "bird", "wheat",
}


def test_icon_directory_exists() -> None:
    assert ICON_DIR.is_dir(), f"icon dir missing: {ICON_DIR}"


def test_minimum_icon_count() -> None:
    svgs = list(ICON_DIR.glob("*.svg"))
    assert len(svgs) >= 30, f"expected 30+ icons, got {len(svgs)}"


def test_every_required_icon_present() -> None:
    present = {p.stem for p in ICON_DIR.glob("*.svg")}
    missing = REQUIRED_ICONS - present
    assert not missing, f"missing icons: {sorted(missing)}"


def test_every_icon_is_valid_svg() -> None:
    for p in ICON_DIR.glob("*.svg"):
        text = p.read_text(encoding="utf-8")
        assert text.lstrip().startswith("<svg"), f"{p.name}: not an <svg> root"
        assert "</svg>" in text, f"{p.name}: unterminated <svg>"
