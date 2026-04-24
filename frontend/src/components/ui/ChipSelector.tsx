import clsx from "clsx";

export interface ChipOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  disabled?: boolean;
}

interface Props<T extends string> {
  options: ChipOption<T>[];
  selected: T[];
  onChange: (next: T[]) => void;
  multi?: boolean;
  min?: number;
  max?: number;
  ariaLabel?: string;
}

export default function ChipSelector<T extends string>({
  options,
  selected,
  onChange,
  multi = true,
  max,
  ariaLabel,
}: Props<T>) {
  function toggle(v: T) {
    if (!multi) {
      onChange([v]);
      return;
    }
    if (selected.includes(v)) {
      onChange(selected.filter((x) => x !== v));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, v]);
    }
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role={multi ? "group" : "radiogroup"}
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            type="button"
            key={opt.value}
            disabled={opt.disabled}
            onClick={() => toggle(opt.value)}
            className={clsx(
              "chip",
              active && "chip-active",
              opt.disabled && "opacity-40 cursor-not-allowed"
            )}
            title={opt.hint}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
