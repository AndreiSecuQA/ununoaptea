// Client-side preview logic — mirrors backend PDF rendering just enough
// for the hybrid preview (thumbnail + 3-card preview at Step 6).

import type { CalendarConfig } from "@/types/calendar.types";
import {
  addDays,
  classifyDay,
  formatHeader,
  isoToDate,
  type DayType,
} from "@/lib/dayClassifier";
import { pickSalutation } from "@/lib/salutations";
import { pickQuote } from "@/lib/quotesSample";
import type { IconId } from "@/lib/iconRegistry";

export type PoolName =
  | "productive"
  | "rest"
  | "reflection"
  | "celebration"
  | "general";

const DAY_TYPE_TO_POOL: Record<DayType, PoolName> = {
  first: "celebration",
  last: "celebration",
  celebration: "celebration",
  holiday: "celebration",
  reflection: "reflection",
  rest: "rest",
  productive: "productive",
  general: "general",
};

const DAY_TYPE_TO_ICON_CAT: Record<
  DayType,
  keyof CalendarConfig["icon_mapping"]
> = {
  first: "celebration",
  last: "celebration",
  celebration: "celebration",
  holiday: "celebration",
  reflection: "reflection",
  rest: "rest",
  productive: "productive",
  general: "other",
};

export interface PreviewPage {
  date: Date;
  dayType: DayType;
  header: { weekday: string; monthYear: string; day: number };
  salutation: string;
  quote: { text: string; author: string };
  iconId: IconId;
}

function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function buildPreviewPages(
  config: Partial<CalendarConfig>,
  opts: { extraSeed?: number } = {}
): PreviewPage[] {
  if (!config.start_date || !config.user_profile || !config.icon_mapping) {
    return [];
  }

  const start = isoToDate(config.start_date);
  const rest = config.user_profile.rest_days[0] ?? 5;
  const prodIdx = config.user_profile.productive_days[0] ?? 0;

  // Pick a productive day within the year range.
  let productive = start;
  for (let i = 0; i < 14; i++) {
    const d = addDays(start, i);
    const wd = (d.getDay() + 6) % 7;
    if (wd === prodIdx) {
      productive = d;
      break;
    }
  }

  // Pick first rest day in range.
  let restDay = addDays(start, 6);
  for (let i = 0; i < 14; i++) {
    const d = addDays(start, i);
    const wd = (d.getDay() + 6) % 7;
    if (wd === rest) {
      restDay = d;
      break;
    }
  }

  const extra = opts.extraSeed ?? 0;
  const dates = [start, productive, restDay];
  return dates.map((d, i) => buildPage(d, config, seedFrom(String(d)) + extra + i));
}

export function buildPage(
  date: Date,
  config: Partial<CalendarConfig>,
  seed: number
): PreviewPage {
  const dayType = classifyDay(date, config);
  const pool = DAY_TYPE_TO_POOL[dayType];
  const styles = config.user_profile?.quote_styles ?? ["stoic"];
  const quote = pickQuote(pool, styles, seed);
  const iconCat = DAY_TYPE_TO_ICON_CAT[dayType];
  const icons = config.icon_mapping?.[iconCat] ?? ["star"];
  const iconId = (icons[seed % icons.length] as IconId) ?? "star";
  return {
    date,
    dayType,
    header: formatHeader(date),
    salutation: pickSalutation(dayType, config.first_name ?? "prieten", seed),
    quote: { text: quote.text, author: quote.author },
    iconId,
  };
}
