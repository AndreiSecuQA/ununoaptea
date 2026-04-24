import { useState } from "react";
import TextField from "@/components/ui/TextField";
import DatePickerCustom from "@/components/ui/DatePickerCustom";
import WizardNav from "./WizardNav";
import { useWizardState } from "@/hooks/useWizardState";

const NAME_RE = /^[a-zA-ZăâîșțĂÂÎȘȚ][a-zA-ZăâîșțĂÂÎȘȚ\s-]*$/;

function todayISO(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export default function Step1_BasicInfo() {
  const data = useWizardState((s) => s.data);
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);

  const [nameError, setNameError] = useState<string | null>(null);

  const firstName = data.first_name ?? "";
  const startDate = data.start_date ?? "";

  function validateName(v: string) {
    if (v.length === 0) return "Adaugă prenumele tău.";
    if (v.length > 40) return "Maxim 40 de caractere.";
    if (!NAME_RE.test(v)) return "Doar litere, spații și cratimă.";
    return null;
  }

  const canContinue = !validateName(firstName) && !!startDate;

  function onContinue() {
    const err = validateName(firstName);
    if (err) {
      setNameError(err);
      return;
    }
    next();
  }

  const minDate = todayISO();
  const maxDate = todayISO(540);

  return (
    <section className="max-w-xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">Cum te numești?</h1>
      <p className="text-muted mb-8">
        Numele tău apare pe fiecare pagină din calendar — un salut personal zilnic.
      </p>

      <div className="space-y-6">
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

        <DatePickerCustom
          label="Când vrei să înceapă calendarul tău?"
          value={startDate}
          min={minDate}
          max={maxDate}
          onChange={(v) => setField("start_date", v)}
          required
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="chip"
            onClick={() => setField("start_date", todayISO())}
          >
            Azi
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              const nextYear = new Date().getFullYear() + 1;
              setField("start_date", `${nextYear}-01-01`);
            }}
          >
            1 Ianuarie {new Date().getFullYear() + 1}
          </button>
        </div>
        {startDate && (
          <p className="text-xs text-muted">
            Calendarul acoperă 365 de zile de la această dată.
          </p>
        )}
      </div>

      <WizardNav
        onNext={onContinue}
        nextDisabled={!canContinue}
        showBack={false}
      />
    </section>
  );
}
