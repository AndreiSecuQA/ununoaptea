import { describe, it, expect } from "vitest";
import { classifyDay, isoToDate, addDays, formatHeader } from "./dayClassifier";
import type { CalendarConfig } from "@/types/calendar.types";

function makeConfig(overrides: Partial<CalendarConfig> = {}): Partial<CalendarConfig> {
  return {
    template: "template1",
    first_name: "Andrei",
    start_date: "2026-05-01",
    calendar_name: "Test",
    special_events: [],
    selected_holidays: [],
    icon_mapping: {
      productive: ["rocket"],
      rest: ["moon"],
      reflection: ["feather"],
      celebration: ["star"],
      other: ["sun"],
    },
    user_profile: {
      productive_days: [0, 1, 2, 3, 4],
      rest_days: [5],
      reflection_day: 6,
      morning_style: "slow",
      motivation_style: "mixed",
      focus_areas: ["career"],
      quote_styles: ["stoic"],
    },
    ...overrides,
  };
}

describe("dayClassifier", () => {
  it("classifies the start date as first", () => {
    const cfg = makeConfig();
    const d = isoToDate("2026-05-01");
    expect(classifyDay(d, cfg)).toBe("first");
  });

  it("classifies the last day as last", () => {
    const cfg = makeConfig();
    const d = addDays(isoToDate("2026-05-01"), 364);
    expect(classifyDay(d, cfg)).toBe("last");
  });

  it("classifies a special event as celebration", () => {
    const cfg = makeConfig({
      special_events: [
        { label: "Ziua mamei", month: 7, day: 15, event_type: "birthday" },
      ],
    });
    const d = isoToDate("2026-07-15");
    expect(classifyDay(d, cfg)).toBe("celebration");
  });

  it("classifies reflection weekday", () => {
    const cfg = makeConfig();
    // 2026-05-03 is a Sunday → weekday idx 6 → reflection
    const d = isoToDate("2026-05-03");
    expect(classifyDay(d, cfg)).toBe("reflection");
  });

  it("classifies rest weekday", () => {
    const cfg = makeConfig();
    // 2026-05-02 is a Saturday → weekday idx 5 → rest
    const d = isoToDate("2026-05-02");
    expect(classifyDay(d, cfg)).toBe("rest");
  });

  it("classifies productive weekday", () => {
    const cfg = makeConfig();
    // 2026-05-04 is Monday → weekday idx 0 → productive
    const d = isoToDate("2026-05-04");
    expect(classifyDay(d, cfg)).toBe("productive");
  });

  it("defaults to general without a profile", () => {
    expect(classifyDay(new Date(), {})).toBe("general");
  });

  it("formats the Romanian header", () => {
    const d = isoToDate("2026-05-04");
    const h = formatHeader(d);
    expect(h.weekday).toBe("Luni");
    expect(h.monthYear).toBe("mai 2026");
    expect(h.day).toBe(4);
  });
});
