import { useMemo, useState } from "react";
import clsx from "clsx";
import WizardNav from "./WizardNav";
import { ICON_GROUPS, ICONS, type IconId } from "@/lib/iconRegistry";
import IconRenderer from "@/components/preview/IconRenderer";
import { useWizardState } from "@/hooks/useWizardState";
import type { IconMapping } from "@/types/calendar.types";

type CatKey = keyof IconMapping;

const CATEGORIES: Array<{ key: CatKey; label: string; color: string }> = [
  { key: "productive", label: "Zile productive", color: "bg-orange-100" },
  { key: "rest", label: "Zile de odihnă", color: "bg-blue-100" },
  { key: "reflection", label: "Zile de reflecție", color: "bg-purple-100" },
  { key: "celebration", label: "Zile speciale / celebrare", color: "bg-yellow-100" },
  { key: "other", label: "Alte zile (fallback)", color: "bg-green-100" },
];

const DEFAULT_MAPPING: IconMapping = {
  productive: ["rocket"],
  rest: ["moon"],
  reflection: ["candle"],
  celebration: ["sparkle"],
  other: ["sun"],
};

const ALL_ICON_IDS = Object.keys(ICONS) as IconId[];

export default function Step5_Icons() {
  const mapping = useWizardState(
    (s) => s.data.icon_mapping ?? DEFAULT_MAPPING
  );
  const setField = useWizardState((s) => s.setField);
  const next = useWizardState((s) => s.next);
  const back = useWizardState((s) => s.back);

  const [active, setActive] = useState<CatKey>("productive");

  function toggleIcon(id: IconId) {
    const current = mapping[active] as IconId[];
    if (current.includes(id)) {
      if (current.length === 1) return; // need at least 1
      setField("icon_mapping", {
        ...mapping,
        [active]: current.filter((x) => x !== id),
      });
    } else {
      if (current.length >= 2) return;
      setField("icon_mapping", {
        ...mapping,
        [active]: [...current, id],
      });
    }
  }

  const errors = useMemo(() => {
    return CATEGORIES.filter(
      (c) => (mapping[c.key] as string[]).length === 0
    ).map((c) => `Alege o iconiță pentru "${c.label}".`);
  }, [mapping]);

  return (
    <section className="max-w-3xl">
      <h1 className="serif text-3xl sm:text-4xl mb-2">
        Alege iconițele care te reprezintă.
      </h1>
      <p className="text-muted mb-8">
        Aceste iconițe apar în colțul paginilor calendarului tău. Maxim 2 per categorie.
      </p>

      <div className="grid md:grid-cols-[1fr_220px] gap-6">
        {/* Pool */}
        <div>
          <p className="label-lg">Iconițe disponibile</p>
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {ICON_GROUPS.flatMap((g) => g.icons).map((id) => {
              const chosen = (mapping[active] as IconId[]).includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleIcon(id)}
                  className={clsx(
                    "aspect-square flex items-center justify-center border rounded-md transition-colors",
                    chosen
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/20 hover:border-accent text-ink"
                  )}
                  aria-label={id}
                  aria-pressed={chosen}
                >
                  <IconRenderer id={id} size={22} />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted mt-2">
            Apasă pe iconiță pentru a o adăuga în categoria {" "}
            <strong className="text-ink">
              {CATEGORIES.find((c) => c.key === active)?.label}
            </strong>
            .
          </p>
        </div>

        {/* Category slots */}
        <div className="space-y-2">
          {CATEGORIES.map((c) => {
            const chosen = (mapping[c.key] as IconId[]) ?? [];
            return (
              <button
                type="button"
                key={c.key}
                onClick={() => setActive(c.key)}
                className={clsx(
                  "w-full text-left border rounded-md p-3 flex items-center gap-3 transition-colors",
                  active === c.key
                    ? "border-ink bg-ink/5"
                    : "border-ink/20 hover:border-accent"
                )}
              >
                <span
                  className={clsx(
                    "w-2 h-2 rounded-full",
                    c.color.replace("bg-", "bg-")
                  )}
                />
                <div className="flex-1">
                  <p className="text-sm text-ink">{c.label}</p>
                  <div className="flex gap-2 mt-1">
                    {chosen.length === 0 ? (
                      <span className="text-xs text-muted">— gol —</span>
                    ) : (
                      chosen.map((id) => (
                        <IconRenderer
                          key={id}
                          id={id as IconId}
                          size={18}
                          className="text-ink"
                        />
                      ))
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            type="button"
            className="btn-secondary w-full text-xs"
            onClick={() => {
              // Auto-fill: 1 reasonable icon per category, ensuring variety.
              const fill: IconMapping = {
                productive: ["rocket"],
                rest: ["moon"],
                reflection: ["candle"],
                celebration: ["sparkle"],
                other: ["star"],
              };
              // Ensure all icons exist in registry
              (Object.keys(fill) as CatKey[]).forEach((k) => {
                fill[k] = fill[k].filter((i) =>
                  ALL_ICON_IDS.includes(i as IconId)
                );
              });
              setField("icon_mapping", fill);
            }}
          >
            ✨ Umple automat
          </button>
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
