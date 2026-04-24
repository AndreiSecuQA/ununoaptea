// Mirror of backend/app/data/holidays.py — used for checkboxes in Step 3.

export interface HolidayMeta {
  id: string;
  name_ro: string;
  country: "MD" | "RO" | "BOTH";
  when: string; // user-readable date ("1 Ian", "Paștele Ortodox")
}

export const HOLIDAYS: HolidayMeta[] = [
  { id: "new_year", name_ro: "Anul Nou", country: "BOTH", when: "1 Ian" },
  { id: "womens_day", name_ro: "Ziua Femeii", country: "BOTH", when: "8 Mar" },
  { id: "labour_day", name_ro: "Ziua Muncii", country: "BOTH", when: "1 Mai" },
  { id: "childrens_day", name_ro: "Ziua Ocrotirii Copilului", country: "BOTH", when: "1 Iun" },
  { id: "christmas", name_ro: "Crăciunul", country: "BOTH", when: "25 Dec" },
  { id: "orthodox_easter", name_ro: "Paștele Ortodox", country: "BOTH", when: "variabil" },
  { id: "easter_monday", name_ro: "Lunea Paștelui", country: "BOTH", when: "variabil" },
  { id: "pentecost", name_ro: "Rusaliile", country: "BOTH", when: "variabil" },
  { id: "pentecost_monday", name_ro: "Lunea Rusaliilor", country: "BOTH", when: "variabil" },

  // MD
  { id: "md_christmas_old", name_ro: "Crăciunul (rit vechi) — 7 Ian", country: "MD", when: "7 Ian" },
  { id: "md_christmas_old_2", name_ro: "Crăciunul (rit vechi) — 8 Ian", country: "MD", when: "8 Ian" },
  { id: "md_europe_day", name_ro: "Ziua Europei", country: "MD", when: "9 Mai" },
  { id: "md_independence", name_ro: "Ziua Independenței", country: "MD", when: "27 Aug" },
  { id: "md_limba_noastra", name_ro: "Limba Noastră", country: "MD", when: "31 Aug" },

  // RO
  { id: "ro_unirea", name_ro: "Ziua Unirii Principatelor", country: "RO", when: "24 Ian" },
  { id: "ro_dormition", name_ro: "Adormirea Maicii Domnului", country: "RO", when: "15 Aug" },
  { id: "ro_saint_andrew", name_ro: "Sfântul Andrei", country: "RO", when: "30 Nov" },
  { id: "ro_national_day", name_ro: "Ziua Națională a României", country: "RO", when: "1 Dec" },
  { id: "ro_christmas_2", name_ro: "A doua zi de Crăciun", country: "RO", when: "26 Dec" },
];

export function holidaysFor(country: "MD" | "RO"): HolidayMeta[] {
  return HOLIDAYS.filter((h) => h.country === "BOTH" || h.country === country);
}
