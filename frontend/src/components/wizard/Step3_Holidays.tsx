import { useEffect, useState } from "react";
import WizardNav from "./WizardNav";
import CheckboxList from "@/components/ui/CheckboxList";
import { holidaysFor } from "@/lib/holidaysData";
import { useWizardState } from "@/hooks/useWizardState";

export default function Step3_Holidays() {
  const selected = useWizardState((s) => s.data.selected_holidays ?? []);
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);
  const back = useWizardState((s) => s.back);

  const [country, setCountry] = useState<"MD" | "RO">("MD");

  // Default to all holidays for chosen country the first time user lands here.
  useEffect(() => {
    if (selected.length === 0) {
      setField(
        "selected_holidays",
        holidaysFor(country).map((h) => h.id)
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = holidaysFor(country).map((h) => ({
    value: h.id,
    label: h.name_ro,
    hint: h.when,
  }));

  return (
    <section className="max-w-2xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">
        Ce sărbători vrei să incluzi?
      </h1>
      <p className="text-muted mb-6">
        Pe aceste zile calendarul tău va avea un salut festiv și un citat potrivit.
      </p>

      <div className="flex gap-2 mb-4">
        {(["MD", "RO"] as const).map((c) => (
          <button
            type="button"
            key={c}
            onClick={() => setCountry(c)}
            className={`chip ${country === c ? "chip-active" : ""}`}
          >
            {c === "MD" ? "Moldova" : "România"}
          </button>
        ))}
      </div>

      <CheckboxList
        items={items}
        selected={selected}
        onChange={(v) => setField("selected_holidays", v)}
        columns={2}
      />

      <WizardNav
        onBack={back}
        onNext={next}
        onSkip={() => {
          setField("selected_holidays", []);
          next();
        }}
      />
    </section>
  );
}
