// Client mirror of app/services/day_classifier.py — used for live preview only.

import type { CalendarConfig, SpecialEvent } from "@/types/calendar.types";

export const WEEKDAY_NAMES_RO = [
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
  "Duminică",
];

export const MONTH_NAMES_RO = [
  "ianuarie",
  "februarie",
  "martie",
  "aprilie",
  "mai",
  "iunie",
  "iulie",
  "august",
  "septembrie",
  "octombrie",
  "noiembrie",
  "decembrie",
];

export type DayType =
  | "first"
  | "last"
  | "celebration"
  | "holiday"
  | "reflection"
  | "rest"
  | "productive"
  | "general";

export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function weekdayIdx(d: Date): number {
  // JS Sunday=0..Saturday=6; we want Monday=0..Sunday=6
  return (d.getDay() + 6) % 7;
}

function isSpecialEvent(d: Date, events: SpecialEvent[]): SpecialEvent | null {
  for (const e of events) {
    if (e.month === d.getMonth() + 1 && e.day === d.getDate()) return e;
  }
  return null;
}

export function classifyDay(d: Date, config: Partial<CalendarConfig>): DayType {
  if (!config.start_date || !config.user_profile) return "general";
  const start = isoToDate(config.start_date);
  const end = addDays(start, 364);
  if (d.getTime() === start.getTime()) return "first";
  if (d.getTime() === end.getTime()) return "last";
  if (isSpecialEvent(d, config.special_events ?? [])) return "celebration";
  // Holiday lookup skipped client-side for simplicity — preview doesn't need it
  const wd = weekdayIdx(d);
  if (wd === config.user_profile.reflection_day) return "reflection";
  if (config.user_profile.rest_days.includes(wd)) return "rest";
  if (config.user_profile.productive_days.includes(wd)) return "productive";
  return "general";
}

export function formatHeader(d: Date) {
  return {
    weekday: WEEKDAY_NAMES_RO[weekdayIdx(d)],
    monthYear: `${MONTH_NAMES_RO[d.getMonth()]} ${d.getFullYear()}`,
    day: d.getDate(),
  };
}
