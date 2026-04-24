"""Holiday registry for Moldova + Romania, with Orthodox Easter computation.

Easter is calculated via the Meeus Julian algorithm (common for Orthodox churches
in RO/MD), with the +13 day offset to Gregorian.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta


@dataclass(frozen=True)
class Holiday:
    id: str
    name_ro: str
    country: str  # "MD" | "RO" | "BOTH"
    # If fixed: (month, day). Else: None and use `compute_date`.
    fixed: tuple[int, int] | None = None
    # Offset in days from Orthodox Easter (Sunday). 0 = Easter, 1 = Easter Monday, etc.
    easter_offset: int | None = None


HOLIDAYS: dict[str, Holiday] = {
    # --- BOTH ---
    "new_year": Holiday("new_year", "Anul Nou", "BOTH", fixed=(1, 1)),
    "womens_day": Holiday(
        "womens_day", "Ziua Internațională a Femeii", "BOTH", fixed=(3, 8)
    ),
    "labour_day": Holiday("labour_day", "Ziua Muncii", "BOTH", fixed=(5, 1)),
    "childrens_day": Holiday(
        "childrens_day", "Ziua Ocrotirii Copilului", "BOTH", fixed=(6, 1)
    ),
    "christmas": Holiday("christmas", "Crăciunul", "BOTH", fixed=(12, 25)),
    "orthodox_easter": Holiday(
        "orthodox_easter", "Paștele Ortodox", "BOTH", easter_offset=0
    ),
    "easter_monday": Holiday(
        "easter_monday", "Lunea Paștelui", "BOTH", easter_offset=1
    ),
    "pentecost": Holiday("pentecost", "Rusaliile", "BOTH", easter_offset=49),
    "pentecost_monday": Holiday(
        "pentecost_monday", "Lunea Rusaliilor", "BOTH", easter_offset=50
    ),
    # --- MD ---
    "md_christmas_old": Holiday(
        "md_christmas_old", "Crăciunul (rit vechi) — 7 Ian", "MD", fixed=(1, 7)
    ),
    "md_christmas_old_2": Holiday(
        "md_christmas_old_2", "Crăciunul (rit vechi) — 8 Ian", "MD", fixed=(1, 8)
    ),
    "md_europe_day": Holiday("md_europe_day", "Ziua Europei", "MD", fixed=(5, 9)),
    "md_independence": Holiday(
        "md_independence", "Ziua Independenței", "MD", fixed=(8, 27)
    ),
    "md_limba_noastra": Holiday(
        "md_limba_noastra", "Limba Noastră", "MD", fixed=(8, 31)
    ),
    # --- RO ---
    "ro_unirea": Holiday(
        "ro_unirea", "Ziua Unirii Principatelor", "RO", fixed=(1, 24)
    ),
    "ro_dormition": Holiday(
        "ro_dormition", "Adormirea Maicii Domnului", "RO", fixed=(8, 15)
    ),
    "ro_saint_andrew": Holiday(
        "ro_saint_andrew", "Sfântul Andrei", "RO", fixed=(11, 30)
    ),
    "ro_national_day": Holiday(
        "ro_national_day", "Ziua Națională a României", "RO", fixed=(12, 1)
    ),
    "ro_christmas_2": Holiday(
        "ro_christmas_2", "A doua zi de Crăciun", "RO", fixed=(12, 26)
    ),
}


HOLIDAYS_MOLDOVA: list[str] = [
    h.id for h in HOLIDAYS.values() if h.country in ("BOTH", "MD")
]
HOLIDAYS_ROMANIA: list[str] = [
    h.id for h in HOLIDAYS.values() if h.country in ("BOTH", "RO")
]


def compute_orthodox_easter(year: int) -> date:
    """Meeus Julian algorithm → Gregorian date.

    Reference: Jean Meeus, 'Astronomical Algorithms', Ch. 8.
    """
    a = year % 4
    b = year % 7
    c = year % 19
    d = (19 * c + 15) % 30
    e = (2 * a + 4 * b - d + 34) % 7
    month = (d + e + 114) // 31
    day = ((d + e + 114) % 31) + 1
    julian_easter = date(year, month, day)
    # Julian → Gregorian: +13 days (valid 1900–2099).
    return julian_easter + timedelta(days=13)


def resolve_holiday_dates(
    holiday_ids: list[str], year: int
) -> dict[date, list[Holiday]]:
    """Given a list of holiday IDs and a year, return {date: [Holiday]}."""
    result: dict[date, list[Holiday]] = {}
    easter = compute_orthodox_easter(year)
    for hid in holiday_ids:
        h = HOLIDAYS.get(hid)
        if h is None:
            continue
        if h.fixed is not None:
            try:
                d = date(year, h.fixed[0], h.fixed[1])
            except ValueError:
                continue
        elif h.easter_offset is not None:
            d = easter + timedelta(days=h.easter_offset)
        else:
            continue
        result.setdefault(d, []).append(h)
    return result


def get_active_holidays_for_date(
    d: date, selected_holiday_ids: list[str]
) -> list[Holiday]:
    """Return all selected holidays active on `d`."""
    year_map = resolve_holiday_dates(selected_holiday_ids, d.year)
    return year_map.get(d, [])
