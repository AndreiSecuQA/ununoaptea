"""PDF generator — turns a CalendarConfig into a 367-page A5 PDF.

Structure:
- Page 1  : cover (calendar_name + date range + optional cover_message)
- Pages 2..366 : 365 days, each classified + salutation + quote + icon
- Page 367: closing page (default message + optional closing_message + promo)

Fonts:
- EB Garamond (Regular, Bold, Italic) — serif for quote/salutation
- Inter (Regular, Medium, Bold) — sans-serif for dates and metadata

If font/asset files are missing on disk, we fall back to ReportLab built-ins so
tests and dev environments still succeed.
"""

from __future__ import annotations

import hashlib
import io
import random
import time
from collections import deque
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A5
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas

from app.core.logging import log
from app.data.quotes import get_pools_for_styles
from app.data.salutations import SALUTATIONS
from app.schemas.calendar import CalendarConfig
from app.services.day_classifier import (
    DAY_TYPE_TO_ICON_CAT,
    DAY_TYPE_TO_POOL,
    DAY_TYPE_TO_SALUTATION,
    DayContext,
    build_day_context,
    iter_days,
)

# --- Constants ---
W, H = A5  # 419.53 × 595.28 pt
GLUE_MARGIN_TOP = 60
LEFT_MARGIN = 40
RIGHT_MARGIN = 40
ICON_SIZE = 36

INK = HexColor("#1a1a1a")
MUTED = HexColor("#6b6b6b")
ACCENT = HexColor("#8b7355")

ASSETS_DIR = Path(__file__).parent.parent / "assets"
FONTS_DIR = ASSETS_DIR / "fonts"
BACKGROUNDS_DIR = ASSETS_DIR / "backgrounds"
ICONS_DIR = ASSETS_DIR / "icons"

# Deduplication window: don't repeat a quote within this many days (spec: 14).
QUOTE_RECENT_WINDOW = 14


# --- Font registration (idempotent, best-effort) ---
_FONT_GARAMOND_REG = "EBGaramond"
_FONT_GARAMOND_BOLD = "EBGaramond-Bold"
_FONT_GARAMOND_ITALIC = "EBGaramond-Italic"
_FONT_INTER_REG = "Inter"
_FONT_INTER_MED = "Inter-Medium"
_FONT_INTER_BOLD = "Inter-Bold"

_fonts_registered = False


def _register_fonts() -> None:
    """Attempt to register bundled TTFs; fall back to Helvetica/Times aliases."""
    global _fonts_registered
    if _fonts_registered:
        return

    font_files = {
        _FONT_GARAMOND_REG: "EBGaramond-Regular.ttf",
        _FONT_GARAMOND_BOLD: "EBGaramond-Bold.ttf",
        _FONT_GARAMOND_ITALIC: "EBGaramond-Italic.ttf",
        _FONT_INTER_REG: "Inter-Regular.ttf",
        _FONT_INTER_MED: "Inter-Medium.ttf",
        _FONT_INTER_BOLD: "Inter-Bold.ttf",
    }
    for name, filename in font_files.items():
        path = FONTS_DIR / filename
        try:
            if path.exists():
                pdfmetrics.registerFont(TTFont(name, str(path)))
            else:
                # Fallback: register the name as an alias to a built-in.
                # ReportLab can't alias by registerFont, so we leave these
                # unregistered and the renderer will call _font() which resolves
                # missing fonts to built-ins.
                pass
        except Exception as e:  # pragma: no cover
            log.warning("font.register_failed", font=name, error=str(e))
    _fonts_registered = True


def _font(name: str) -> str:
    """Return `name` if registered, else a sensible built-in fallback."""
    if name in pdfmetrics.getRegisteredFontNames():
        return name
    fallback = {
        _FONT_GARAMOND_REG: "Times-Roman",
        _FONT_GARAMOND_BOLD: "Times-Bold",
        _FONT_GARAMOND_ITALIC: "Times-Italic",
        _FONT_INTER_REG: "Helvetica",
        _FONT_INTER_MED: "Helvetica",
        _FONT_INTER_BOLD: "Helvetica-Bold",
    }
    return fallback.get(name, "Helvetica")


# --- Asset loaders ---

_bg_cache: dict[str, ImageReader | None] = {}


def _load_background(template: str) -> ImageReader | None:
    if template in _bg_cache:
        return _bg_cache[template]
    path = BACKGROUNDS_DIR / f"{template}.png"
    img = ImageReader(str(path)) if path.exists() else None
    _bg_cache[template] = img
    return img


_icon_cache: dict[str, Any] = {}


def _load_icon_drawing(icon_id: str, size: int = ICON_SIZE) -> Any:
    """Load and cache an SVG icon as a ReportLab Drawing. Best-effort — returns
    None if svglib is not available or the file doesn't exist."""
    key = f"{icon_id}@{size}"
    if key in _icon_cache:
        return _icon_cache[key]
    try:
        from svglib.svglib import svg2rlg

        path = ICONS_DIR / f"{icon_id}.svg"
        if not path.exists():
            _icon_cache[key] = None
            return None
        drawing = svg2rlg(str(path))
        if drawing is None:
            _icon_cache[key] = None
            return None
        # Scale to requested size.
        scale = size / max(drawing.width, drawing.height, 1)
        drawing.scale(scale, scale)
        drawing.width *= scale
        drawing.height *= scale
        _icon_cache[key] = drawing
        return drawing
    except Exception as e:  # pragma: no cover
        log.debug("icon.load_failed", icon=icon_id, error=str(e))
        _icon_cache[key] = None
        return None


# --- Deterministic RNG ---

def get_seed(config: CalendarConfig) -> int:
    raw = (
        f"{config.first_name}|{config.start_date.isoformat()}|"
        f"{'+'.join(sorted(config.user_profile.quote_styles))}"
    ).encode()
    return int(hashlib.sha256(raw).hexdigest()[:16], 16)


# --- Quote sequencer with no-repeat window ---


def _item_key(item: Any) -> str:
    """Stable key for dedupe window — text for quote dicts, str(item) otherwise."""
    if isinstance(item, dict):
        return str(item.get("text", item))
    return str(item)


class _PoolCycler:
    """Shuffles a pool with the seeded RNG and yields items without repeating
    within the last N picks (sliding window)."""

    def __init__(self, items: list[Any], rng: random.Random, window: int):
        self.items = list(items)
        self.rng = rng
        self.window = window
        self._recent: deque[str] = deque(maxlen=window)
        self.rng.shuffle(self.items)
        self._idx = 0

    def next(self) -> Any:
        if not self.items:
            return None
        attempts = 0
        while attempts < len(self.items):
            item = self.items[self._idx % len(self.items)]
            self._idx += 1
            item_key = _item_key(item)
            if item_key not in self._recent:
                self._recent.append(item_key)
                return item
            attempts += 1
        # Pool exhausted within window — reshuffle and keep going.
        self.rng.shuffle(self.items)
        self._recent.clear()
        item = self.items[0]
        self._idx = 1
        self._recent.append(_item_key(item))
        return item


# --- Text layout helpers ---


def _wrap_text(canvas: Canvas, text: str, font: str, size: int, max_width: float) -> list[str]:
    """Greedy word-wrap using stringWidth."""
    if not text:
        return []
    words = text.split()
    lines: list[str] = []
    current = ""
    for w in words:
        trial = f"{current} {w}".strip()
        if pdfmetrics.stringWidth(trial, font, size) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def _draw_centred_paragraph(
    c: Canvas,
    text: str,
    cx: float,
    top_y: float,
    font: str,
    size: int,
    max_width: float,
    line_gap: float = 1.3,
) -> float:
    """Draw centred wrapped text starting at top_y; return the y of the last baseline."""
    c.setFont(font, size)
    lines = _wrap_text(c, text, font, size, max_width)
    y = top_y
    leading = size * line_gap
    for line in lines:
        c.drawCentredString(cx, y, line)
        y -= leading
    return y


# --- Page renderers ---


def _paint_background(c: Canvas, template: str) -> None:
    bg = _load_background(template)
    if bg is not None:
        c.drawImage(bg, 0, 0, W, H, preserveAspectRatio=False, mask="auto")


def render_cover_page(c: Canvas, config: CalendarConfig) -> None:
    _paint_background(c, config.template)

    c.setFillColor(INK)
    c.setFont(_font(_FONT_INTER_MED), 10)
    c.drawCentredString(W / 2, H - 50, "UNU NOAPTEA")

    # Calendar name
    c.setFont(_font(_FONT_GARAMOND_BOLD), 26)
    _draw_centred_paragraph(
        c, config.calendar_name, W / 2, H * 0.72,
        _font(_FONT_GARAMOND_BOLD), 26, W * 0.8, 1.15,
    )

    # Date range
    from app.services.day_classifier import MONTH_NAMES_RO

    sd = config.start_date
    ed = config.end_date
    range_text = (
        f"{sd.day} {MONTH_NAMES_RO[sd.month - 1]} {sd.year} — "
        f"{ed.day} {MONTH_NAMES_RO[ed.month - 1]} {ed.year}"
    )
    c.setFillColor(MUTED)
    c.setFont(_font(_FONT_INTER_REG), 11)
    c.drawCentredString(W / 2, H * 0.58, range_text)

    if config.cover_message:
        c.setFillColor(INK)
        _draw_centred_paragraph(
            c,
            config.cover_message,
            W / 2,
            H * 0.42,
            _font(_FONT_GARAMOND_ITALIC),
            12,
            W * 0.75,
            1.35,
        )

    c.setFillColor(MUTED)
    c.setFont(_font(_FONT_INTER_REG), 9)
    c.drawRightString(W - RIGHT_MARGIN, 40, f"pentru {config.first_name}")

    c.showPage()


def render_day_page(
    c: Canvas,
    config: CalendarConfig,
    ctx: DayContext,
    salutation: str,
    quote_text: str,
    quote_author: str,
    icon_id: str,
) -> None:
    _paint_background(c, config.template)

    c.setFillColor(MUTED)
    c.setFont(_font(_FONT_INTER_MED), 10)
    c.drawString(LEFT_MARGIN, H - GLUE_MARGIN_TOP, ctx.weekday_name_ro.upper())
    c.drawRightString(W - RIGHT_MARGIN, H - GLUE_MARGIN_TOP, ctx.month_year_ro)

    # Big date number
    c.setFillColor(INK)
    c.setFont(_font(_FONT_GARAMOND_BOLD), 96)
    c.drawCentredString(W / 2, H * 0.68, str(ctx.day_number))

    # Hair-line separator
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.6)
    c.line(W * 0.38, H * 0.6, W * 0.62, H * 0.6)

    # Optional special event label or holiday name
    label_y = H * 0.55
    if ctx.special_event:
        c.setFillColor(ACCENT)
        c.setFont(_font(_FONT_INTER_MED), 10)
        c.drawCentredString(W / 2, label_y, ctx.special_event.label.upper())
        label_y -= 14
    elif ctx.holiday_name_ro:
        c.setFillColor(ACCENT)
        c.setFont(_font(_FONT_INTER_MED), 10)
        c.drawCentredString(W / 2, label_y, ctx.holiday_name_ro.upper())
        label_y -= 14

    # Salutation (italic)
    c.setFillColor(INK)
    y_after_salutation = _draw_centred_paragraph(
        c,
        salutation,
        W / 2,
        label_y - 4,
        _font(_FONT_GARAMOND_ITALIC),
        14,
        W * 0.8,
        1.3,
    )

    # Quote body
    y_after_quote = _draw_centred_paragraph(
        c,
        f"„{quote_text}”",
        W / 2,
        y_after_salutation - 20,
        _font(_FONT_GARAMOND_REG),
        13,
        W * 0.78,
        1.35,
    )

    # Small separator
    c.setStrokeColor(MUTED)
    c.setLineWidth(0.4)
    c.line(W * 0.45, y_after_quote - 10, W * 0.55, y_after_quote - 10)

    # Author
    c.setFillColor(MUTED)
    c.setFont(_font(_FONT_INTER_REG), 10)
    c.drawCentredString(W / 2, y_after_quote - 24, f"— {quote_author}")

    # Footer icon
    icon_drawing = _load_icon_drawing(icon_id)
    if icon_drawing is not None:
        from reportlab.graphics import renderPDF

        icon_x = W / 2 - ICON_SIZE / 2
        icon_y = 60
        renderPDF.draw(icon_drawing, c, icon_x, icon_y)
    else:
        # Fallback: small bullet so footer isn't empty.
        c.setFillColor(ACCENT)
        c.circle(W / 2, 72, 3, stroke=0, fill=1)

    c.showPage()


def render_closing_page(c: Canvas, config: CalendarConfig, promo_code: str) -> None:
    _paint_background(c, config.template)

    c.setFillColor(INK)
    default_closing = (
        "Aici se încheie călătoria de 365 de zile. "
        "Sperăm că a fost plină de momente de reflecție, odihnă și curaj."
    )
    y = _draw_centred_paragraph(
        c,
        default_closing,
        W / 2,
        H * 0.72,
        _font(_FONT_GARAMOND_ITALIC),
        13,
        W * 0.8,
        1.35,
    )

    if config.closing_message:
        c.setStrokeColor(MUTED)
        c.setLineWidth(0.3)
        c.line(W * 0.45, y - 18, W * 0.55, y - 18)
        y = _draw_centred_paragraph(
            c,
            config.closing_message,
            W / 2,
            y - 32,
            _font(_FONT_GARAMOND_REG),
            12,
            W * 0.78,
            1.35,
        )

    c.setFillColor(MUTED)
    c.setFont(_font(_FONT_INTER_REG), 10)
    c.drawCentredString(
        W / 2,
        max(y - 60, 140),
        f"Pentru calendarul de anul viitor, cod: {promo_code}",
    )

    c.setFont(_font(_FONT_INTER_MED), 9)
    c.drawCentredString(W / 2, 50, "UNU NOAPTEA — www.ununoaptea.com")
    c.showPage()


# --- Main entrypoint ---


@dataclass
class GenerationResult:
    pdf_bytes: bytes
    pages: int
    duration_seconds: float


def generate_calendar_pdf(config: CalendarConfig, promo_code: str = "VU1P3") -> GenerationResult:
    """Generate the full 367-page PDF in-memory and return the bytes."""
    started = time.perf_counter()
    _register_fonts()

    buffer = io.BytesIO()
    c = Canvas(buffer, pagesize=A5)
    c.setTitle(config.calendar_name)
    c.setAuthor("Unu Noaptea")
    c.setSubject("Calendar personalizat 365 de zile")

    seed = get_seed(config)

    # Stable, per-string seed derivation (Python's built-in hash() is randomised
    # across processes, which breaks reproducibility for repeat orders).
    def _sub_seed(label: str) -> int:
        raw = f"{seed}|{label}".encode()
        return int(hashlib.sha256(raw).hexdigest()[:16], 16)

    # Build pools filtered by user's quote styles + cycler per pool
    pools = get_pools_for_styles(config.user_profile.quote_styles)
    cyclers: dict[str, _PoolCycler] = {
        name: _PoolCycler(items, random.Random(_sub_seed(f"pool_{name}")), QUOTE_RECENT_WINDOW)
        for name, items in pools.items()
    }

    # Salutation cyclers (one per key)
    sal_cyclers: dict[str, _PoolCycler] = {
        key: _PoolCycler(lines, random.Random(_sub_seed(f"sal_{key}")), 7)
        for key, lines in SALUTATIONS.items()
    }

    # Icon cyclers per mapping slot
    icon_cyclers: dict[str, _PoolCycler] = {
        slot: _PoolCycler(ids, random.Random(_sub_seed(f"icon_{slot}")), 3)
        for slot, ids in config.icon_mapping.model_dump().items()
    }

    # --- Render cover ---
    render_cover_page(c, config)
    page_count = 1

    # --- Render 365 days ---
    for d in iter_days(config):
        ctx = build_day_context(d, config)
        pool_name = DAY_TYPE_TO_POOL[ctx.day_type]
        icon_cat = DAY_TYPE_TO_ICON_CAT[ctx.day_type]
        sal_key = DAY_TYPE_TO_SALUTATION[ctx.day_type]

        quote = cyclers[pool_name].next()
        sal_template = sal_cyclers[sal_key].next() or "O zi bună, {name}."
        salutation = sal_template.format(name=config.first_name)
        icon_id = icon_cyclers[icon_cat].next() or "sun"

        quote_text = quote.get("text", "—") if quote else "—"
        quote_author = quote.get("author", "") if quote else ""

        render_day_page(c, config, ctx, salutation, quote_text, quote_author, icon_id)
        page_count += 1

    # --- Render closing ---
    render_closing_page(c, config, promo_code=promo_code)
    page_count += 1

    c.save()
    pdf_bytes = buffer.getvalue()
    buffer.close()
    duration = time.perf_counter() - started
    log.info(
        "pdf.generated",
        pages=page_count,
        bytes=len(pdf_bytes),
        duration_s=round(duration, 2),
        first_name=config.first_name,
    )
    return GenerationResult(pdf_bytes=pdf_bytes, pages=page_count, duration_seconds=duration)
