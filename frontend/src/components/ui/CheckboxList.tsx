import clsx from "clsx";

export interface CheckboxItem {
  value: string;
  label: string;
  hint?: string;
}

interface Props {
  items: CheckboxItem[];
  selected: string[];
  onChange: (next: string[]) => void;
  columns?: 1 | 2;
}

export default function CheckboxList({
  items,
  selected,
  onChange,
  columns = 1,
}: Props) {
  function toggle(v: string) {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else onChange([...selected, v]);
  }

  return (
    <ul
      className={clsx(
        "grid gap-2",
        columns === 2 ? "sm:grid-cols-2" : "grid-cols-1"
      )}
    >
      {items.map((it) => {
        const active = selected.includes(it.value);
        return (
          <li key={it.value}>
            <label
              className={clsx(
                "flex items-start gap-3 border rounded-md px-3 py-3 cursor-pointer transition-colors",
                active
                  ? "border-ink bg-ink/5"
                  : "border-ink/20 hover:border-accent"
              )}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => toggle(it.value)}
                className="mt-1 accent-ink"
              />
              <span className="flex-1">
                <span className="block text-sm text-ink">{it.label}</span>
                {it.hint && (
                  <span className="block text-xs text-muted">{it.hint}</span>
                )}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
