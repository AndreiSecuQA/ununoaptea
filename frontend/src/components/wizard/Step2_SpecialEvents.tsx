import { useState } from "react";
import Button from "@/components/ui/Button";
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

export default function Step2_SpecialEvents() {
  const events = useWizardState((s) => s.data.special_events ?? []);
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);
  const back = useWizardState((s) => s.back);

  const [draft, setDraft] = useState<SpecialEvent>({
    label: "",
    month: 1,
    day: 1,
    event_type: "birthday",
  });

  function addEvent() {
    if (!draft.label.trim()) return;
    if (events.length >= 20) return;
    setField("special_events", [...events, { ...draft, label: draft.label.trim() }]);
    setDraft({ label: "", month: 1, day: 1, event_type: "birthday" });
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
                {e.day}/{e.month} ·{" "}
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
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            className="input-text"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={draft.month}
              onChange={(e) =>
                setDraft({ ...draft, month: Number(e.target.value) })
              }
              className="input-text"
              aria-label="Lună"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Luna {m}
                </option>
              ))}
            </select>
            <select
              value={draft.day}
              onChange={(e) =>
                setDraft({ ...draft, day: Number(e.target.value) })
              }
              className="input-text"
              aria-label="Zi"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Ziua {d}
                </option>
              ))}
            </select>
            <select
              value={draft.event_type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  event_type: e.target.value as EventType,
                })
              }
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
          <Button
            variant="secondary"
            onClick={addEvent}
            type="button"
            full
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
