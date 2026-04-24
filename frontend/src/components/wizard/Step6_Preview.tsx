import { useMemo, useState } from "react";
import WizardNav from "./WizardNav";
import CalendarPageCard from "@/components/preview/CalendarPageCard";
import { buildPreviewPages } from "@/services/previewRenderer";
import { useWizardState } from "@/hooks/useWizardState";

export default function Step6_Preview() {
  const data = useWizardState((s) => s.data);
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);
  const back = useWizardState((s) => s.back);

  const [reroll, setReroll] = useState(0);

  const pages = useMemo(
    () => buildPreviewPages(data, { extraSeed: reroll * 7 }),
    [data, reroll]
  );

  const defaultName = data.first_name
    ? `Calendarul lui ${data.first_name}`
    : "Calendarul meu";

  const calendarName = data.calendar_name ?? defaultName;
  const nameError =
    calendarName.trim().length < 3 || calendarName.trim().length > 60
      ? "Între 3 și 60 de caractere."
      : null;

  return (
    <section className="max-w-3xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">
        Gata! Iată cum arată calendarul tău.
      </h1>
      <p className="text-muted mb-6">
        Trei pagini de exemplu: începutul călătoriei, o zi productivă, o zi de odihnă.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {pages.map((p, i) => (
          <CalendarPageCard
            key={i}
            page={p}
            template={data.template ?? "template1"}
            scale={0.6}
          />
        ))}
      </div>

      <button
        type="button"
        className="chip mb-6"
        onClick={() => setReroll((r) => r + 1)}
      >
        🎲 Alt sample
      </button>

      <div className="space-y-5">
        <div>
          <label className="label-lg" htmlFor="calendar_name">
            Numele calendarului
          </label>
          <input
            id="calendar_name"
            type="text"
            value={calendarName}
            maxLength={60}
            onChange={(e) => setField("calendar_name", e.target.value)}
            className="input-text"
          />
          {nameError && (
            <p className="text-xs text-red-600 mt-1">{nameError}</p>
          )}
        </div>

        <div>
          <label className="label-lg" htmlFor="cover_message">
            Mesaj pe copertă (opțional)
          </label>
          <textarea
            id="cover_message"
            rows={3}
            maxLength={500}
            value={data.cover_message ?? ""}
            onChange={(e) => setField("cover_message", e.target.value)}
            className="input-text"
            placeholder="Un mesaj scurt care apare pe prima pagină a calendarului…"
          />
          <p className="text-xs text-muted mt-1">
            {(data.cover_message ?? "").length} / 500
          </p>
        </div>

        <div>
          <label className="label-lg" htmlFor="closing_message">
            Mesaj pe ultima pagină (opțional)
          </label>
          <textarea
            id="closing_message"
            rows={4}
            maxLength={1000}
            value={data.closing_message ?? ""}
            onChange={(e) => setField("closing_message", e.target.value)}
            className="input-text"
            placeholder="Un mesaj care rămâne cu tine la sfârșit…"
          />
          <p className="text-xs text-muted mt-1">
            {(data.closing_message ?? "").length} / 1000
          </p>
        </div>
      </div>

      <WizardNav
        onBack={back}
        onNext={() => {
          if (!data.calendar_name) setField("calendar_name", defaultName);
          next();
        }}
        nextLabel="Generează Calendarul Meu →"
        nextDisabled={!!nameError}
      />
    </section>
  );
}
