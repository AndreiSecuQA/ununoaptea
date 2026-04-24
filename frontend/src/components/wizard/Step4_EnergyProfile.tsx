import { useMemo } from "react";
import WizardNav from "./WizardNav";
import ChipSelector from "@/components/ui/ChipSelector";
import { useWizardState } from "@/hooks/useWizardState";
import type {
  FocusArea,
  MorningStyle,
  MotivationStyle,
  QuoteStyle,
  UserProfile,
} from "@/types/calendar.types";

const WEEKDAYS = [
  { value: "0", label: "L" },
  { value: "1", label: "Ma" },
  { value: "2", label: "Mi" },
  { value: "3", label: "J" },
  { value: "4", label: "V" },
  { value: "5", label: "S" },
  { value: "6", label: "D" },
];

const MORNING: Array<{ value: MorningStyle; label: string }> = [
  { value: "energetic", label: "Energie & acțiune imediată" },
  { value: "slow", label: "Lent, cafea & liniște" },
  { value: "variable", label: "Depinde de zi" },
  { value: "no_routine", label: "Fără rutină clară" },
];

const MOTIVATION: Array<{ value: MotivationStyle; label: string }> = [
  { value: "challenging", label: "Îmi place să fiu provocat/ă" },
  { value: "gentle", label: "Prefer încurajare blândă" },
  { value: "mixed", label: "Combinație între cele două" },
  { value: "self", label: "Mă motivez singur/ă" },
];

const FOCUS: Array<{ value: FocusArea; label: string }> = [
  { value: "career", label: "Cariera și afacerile" },
  { value: "health", label: "Sănătatea și energia" },
  { value: "relationships", label: "Relațiile cu cei dragi" },
  { value: "creativity", label: "Creativitatea și proiectele" },
  { value: "peace", label: "Pacea interioară, mindfulness" },
  { value: "finance", label: "Finanțele, independența" },
  { value: "self_knowledge", label: "Cunoașterea de sine" },
];

const QUOTE_STYLES: Array<{
  value: QuoteStyle;
  label: string;
  hint: string;
}> = [
  {
    value: "stoic",
    label: "Stoici",
    hint: "Seneca, Marc Aureliu, Epictet",
  },
  {
    value: "modern",
    label: "Moderni",
    hint: "Jobs, Brené Brown, James Clear",
  },
  {
    value: "spiritual",
    label: "Spirituali",
    hint: "Rumi, Lao Tzu, Thich Nhat Hanh",
  },
  {
    value: "romanian_authors",
    label: "Autori români",
    hint: "Cioran, Eliade, Blaga, Preda",
  },
  {
    value: "existentialist",
    label: "Existențialiști",
    hint: "Camus, Sartre, Nietzsche",
  },
];

const DEFAULT_PROFILE: UserProfile = {
  productive_days: [0, 1, 2, 3, 4],
  rest_days: [5, 6],
  reflection_day: 6,
  morning_style: "slow",
  motivation_style: "gentle",
  focus_areas: ["peace"],
  quote_styles: ["stoic"],
};

export default function Step4_EnergyProfile() {
  const profile = useWizardState(
    (s) => s.data.user_profile ?? DEFAULT_PROFILE
  );
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);
  const back = useWizardState((s) => s.back);

  function update(patch: Partial<UserProfile>) {
    setField("user_profile", { ...profile, ...patch });
  }

  const errors: string[] = useMemo(() => {
    const out: string[] = [];
    if (profile.productive_days.length === 0) out.push("Alege cel puțin o zi productivă.");
    if (profile.rest_days.length === 0) out.push("Alege cel puțin o zi de odihnă.");
    const overlap = profile.productive_days.some((d) =>
      profile.rest_days.includes(d)
    );
    if (overlap) out.push("Zilele productive și de odihnă nu se pot suprapune.");
    if (
      profile.productive_days.includes(profile.reflection_day) ||
      profile.rest_days.includes(profile.reflection_day)
    ) {
      out.push("Ziua de reflecție trebuie diferită de productive/odihnă.");
    }
    if (profile.focus_areas.length === 0) out.push("Alege cel puțin un domeniu.");
    if (profile.quote_styles.length === 0) out.push("Alege cel puțin un stil de citate.");
    return out;
  }, [profile]);

  return (
    <section className="max-w-2xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">
        Hai să te cunoaștem mai bine.
      </h1>
      <p className="text-muted mb-8">
        Răspunsurile tale personalizează citatele și energia fiecărei zile.
      </p>

      <div className="space-y-8">
        <div>
          <p className="label-lg">Zile productive</p>
          <ChipSelector
            options={WEEKDAYS}
            selected={profile.productive_days.map(String)}
            onChange={(vs) =>
              update({ productive_days: vs.map(Number).sort() })
            }
            ariaLabel="Zile productive"
          />
        </div>
        <div>
          <p className="label-lg">Zile de odihnă</p>
          <ChipSelector
            options={WEEKDAYS.map((w) => ({
              ...w,
              disabled: profile.productive_days.includes(Number(w.value)),
            }))}
            selected={profile.rest_days.map(String)}
            onChange={(vs) => update({ rest_days: vs.map(Number).sort() })}
            ariaLabel="Zile de odihnă"
          />
        </div>
        <div>
          <p className="label-lg">Zi de reflecție</p>
          <ChipSelector
            options={WEEKDAYS.map((w) => ({
              ...w,
              disabled:
                profile.productive_days.includes(Number(w.value)) ||
                profile.rest_days.includes(Number(w.value)),
            }))}
            selected={[String(profile.reflection_day)]}
            onChange={(vs) =>
              update({ reflection_day: Number(vs[0] ?? profile.reflection_day) })
            }
            multi={false}
            ariaLabel="Zi de reflecție"
          />
        </div>
        <div>
          <p className="label-lg">Cum îți începi dimineața?</p>
          <ChipSelector
            options={MORNING}
            selected={[profile.morning_style]}
            onChange={(vs) =>
              update({ morning_style: (vs[0] as MorningStyle) ?? "slow" })
            }
            multi={false}
          />
        </div>
        <div>
          <p className="label-lg">Stilul tău de motivație</p>
          <ChipSelector
            options={MOTIVATION}
            selected={[profile.motivation_style]}
            onChange={(vs) =>
              update({
                motivation_style: (vs[0] as MotivationStyle) ?? "gentle",
              })
            }
            multi={false}
          />
        </div>
        <div>
          <p className="label-lg">
            Ce aspect vrei să lucrezi în acest an? (max 3)
          </p>
          <ChipSelector
            options={FOCUS}
            selected={profile.focus_areas}
            onChange={(vs) => update({ focus_areas: vs as FocusArea[] })}
            max={3}
          />
        </div>
        <div>
          <p className="label-lg">
            Ce stil de citate rezonează cu tine? (min 1)
          </p>
          <p className="text-xs text-muted mb-2">
            💡 Bifează minim 2 stiluri pentru varietate maximă de citate.
          </p>
          <ChipSelector
            options={QUOTE_STYLES}
            selected={profile.quote_styles}
            onChange={(vs) => update({ quote_styles: vs as QuoteStyle[] })}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="mt-6 text-xs text-red-600 list-disc pl-5 space-y-1">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <WizardNav
        onBack={back}
        onNext={next}
        nextDisabled={errors.length > 0}
      />
    </section>
  );
}
