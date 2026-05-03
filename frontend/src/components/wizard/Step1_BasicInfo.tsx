import { useState } from "react";
import TextField from "@/components/ui/TextField";
import WizardNav from "./WizardNav";
import { useWizardState } from "@/hooks/useWizardState";

const NAME_RE = /^[a-zA-ZăâîșțĂÂÎȘȚ][a-zA-ZăâîșțĂÂÎȘȚ\s-]*$/;

// The calendar always covers a full Jan 1 → Dec 31 of one year. We let the
// user pick which year up front so Step 2 (special days) can offer a real
// date picker scoped to that single year — much easier than spinning through
// month/day dropdowns separately.
function yearChoices(): number[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  // If we're already past September, the current year only has ~3 months
  // left and is a poor "calendar of the year" choice — skip it.
  const offerCurrent = now.getMonth() < 9;
  return offerCurrent
    ? [currentYear, currentYear + 1, currentYear + 2]
    : [currentYear + 1, currentYear + 2];
}

function yearFromStartDate(s: string | undefined): number | null {
  if (!s) return null;
  const m = /^(\d{4})-/.exec(s);
  return m ? Number(m[1]) : null;
}

export default function Step1_BasicInfo() {
  const data = useWizardState((s) => s.data);
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);

  const [nameError, setNameError] = useState<string | null>(null);

  const firstName = data.first_name ?? "";
  const startDate = data.start_date ?? "";
  const selectedYear = yearFromStartDate(startDate);

  function validateName(v: string) {
    if (v.length === 0) return "Adaugă prenumele tău.";
    if (v.length > 40) return "Maxim 40 de caractere.";
    if (!NAME_RE.test(v)) return "Doar litere, spații și cratimă.";
    return null;
  }

  const canContinue = !validateName(firstName) && !!selectedYear;

  function pickYear(y: number) {
    setField("start_date", `${y}-01-01`);
  }

  function onContinue() {
    const err = validateName(firstName);
    if (err) {
      setNameError(err);
      return;
    }
    next();
  }

  const choices = yearChoices();

  return (
    <section className="max-w-xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">Cum te numești?</h1>
      <p className="text-muted mb-8">
        Numele tău apare pe fiecare pagină din calendar — un salut personal zilnic.
      </p>

      <div className="space-y-8">
        <TextField
          label="Prenumele tău"
          placeholder="Ana, Andrei, Mihai…"
          value={firstName}
          maxLength={40}
          onChange={(e) => {
            const v = e.target.value;
            setField("first_name", v);
            setNameError(validateName(v));
          }}
          error={nameError ?? undefined}
          autoFocus
        />

        <div>
          <p className="label-lg mb-3">Pentru ce an vrei calendarul?</p>
          <div className="grid grid-cols-3 gap-2">
            {choices.map((y) => {
              const active = selectedYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => pickYear(y)}
                  className={`px-4 py-3 rounded-md border text-base font-medium transition ${
                    active
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/20 bg-white text-ink hover:border-ink/50"
                  }`}
                  aria-pressed={active}
                >
                  {y}
                </button>
              );
            })}
          </div>
          {selectedYear && (
            <p className="text-xs text-muted mt-3">
              Calendarul tău: 1 ianuarie {selectedYear} → 31 decembrie{" "}
              {selectedYear}.
            </p>
          )}
        </div>
      </div>

      <WizardNav
        onNext={onContinue}
        nextDisabled={!canContinue}
        showBack={false}
      />
    </section>
  );
}
