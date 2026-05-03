import { useState } from "react";
import Button from "@/components/ui/Button";
import DatePickerCustom from "@/components/ui/DatePickerCustom";
import WizardNav from "./WizardNav";
import { useWizardState } from "@/hooks/useWizardState";
import type { SpecialEvent, EventType } from "@/types/calendar.types";

const TYPES: Array<{ value: EventType; label: string }> = [
  { value: "birthday", label: "Zi de naștere" },
  { value: "anniversary", label: "Aniversare" },
  { value: "celebration", label: "Celebrare" },
  { value: "reminder", label: "Reminder" },
  { value: "other", label: "Altceva" },
];

const RO_MONTHS = [
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

function yearFromStartDate(s: string | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{4})-/.exec(s);
  return m ? Number(m[1]) : null;
}

function parseIsoDate(iso: string): { month: number; day: number } | null {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { month: Number(m[1]), day: Number(m[2]) };
}

function formatEventDate(month: number, day: number): string {
  const monthName = RO_MONTHS[month - 1] ?? "";
  return `${day} ${monthName}`;
}

export default function Step2_SpecialEvents() {
  const events = useWizardState((s) => s.data.special_events ?? []);
  const startDate = useWizardState((s) => s.data.start_date);
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);
  const back = useWizardState((s) => s.back);

  // Year was picked in Step 1. Fallback to current year if somehow missing —
  // shouldn't happen since Step 1's "Continuă" is gated on a year being chosen.
  const year = yearFromStartDate(startDate) ?? new Date().getFullYear();

  // Date picker bounds: full calendar year.
  const minDate = `${year}-01-01`;
  const maxDate = `${year}-12-31`;

  // Draft is held as ISO so the picker stays in sync; we split into month/day
  // only when adding to the events list (which the backend stores).
  const [draftIso, setDraftIso] = useState<string>("");
  const [draftLabel, setDraftLabel] = useState<string>("");
  const [draftType, setDraftType] = useState<EventType>("birthday");

  function addEvent() {
    const trimmed = draftLabel.trim();
    if (!trimmed) return;
    if (!draftIso) return;
    if (events.length >= 20) return;
    const parsed = parseIsoDate(draftIso);
    if (!parsed) return;
    const ev: SpecialEvent = {
      label: trimmed,
      month: parsed.month,
      day: parsed.day,
      event_type: draftType,
    };
    setField("special_events", [...events, ev]);
    setDraftIso("");
    setDraftLabel("");
    setDraftType("birthday");
  }

  function removeEvent(idx: number) {
    setField(
      "special_events",
      events.filter((_, i) => i !== idx)
    );
  }

  return (
    <section className="max-w-2xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">Zilele tale speciale</h1>
      <p className="text-muted mb-8">
        Adaugă zilele importante din viața ta — ziua unui prieten, o aniversare,
        un moment de celebrat. Pe aceste zile calendarul tău va avea un salut special.
      </p>

      <ul className="space-y-2 mb-6">
        {events.map((e, i) => (
          <li
            key={i}
            className="flex items-center justify-between border border-ink/10 rounded-md px-4 py-3"
          >
            <div>
              <p className="text-sm text-ink">{e.label}</p>
              <p className="text-xs text-muted">
                {formatEventDate(e.month, e.day)} ·{" "}
                {TYPES.find((t) => t.value === e.event_type)?.label}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeEvent(i)}
              className="text-muted hover:text-red-600 text-sm"
              aria-label={`Șterge ${e.label}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {events.length < 20 && (
        <div className="border border-dashed border-ink/20 rounded-md p-4 space-y-3 bg-cream">
          <input
            type="text"
            placeholder="Ex: Ziua fratelui meu"
            maxLength={60}
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            className="input-text"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <DatePickerCustom
              value={draftIso}
              onChange={setDraftIso}
              min={minDate}
              max={maxDate}
              label={undefined}
            />
            <select
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as EventType)}
              className="input-text"
              aria-label="Tip"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-muted">
            Anul calendarului: {year}. Selectează ziua și luna.
          </p>
          <Button
            variant="secondary"
            onClick={addEvent}
            type="button"
            full
            disabled={!draftLabel.trim() || !draftIso}
          >
            + Adaugă eveniment
          </Button>
        </div>
      )}

      <WizardNav
        onBack={back}
        onNext={next}
        onSkip={next}
      />
    </section>
  );
}
