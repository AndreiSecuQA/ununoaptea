import clsx from "clsx";

interface Props {
  step: number; // 1..7
  total?: number;
  labels?: string[];
}

export default function ProgressBar({ step, total = 7, labels }: Props) {
  const pct = Math.round((step / total) * 100);
  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={step}
    >
      <div className="flex items-center justify-between text-xs text-muted mb-2">
        <span>
          Pas {step} din {total}
        </span>
        {labels?.[step - 1] && (
          <span className="hidden sm:inline">{labels[step - 1]}</span>
        )}
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
        <div
          className={clsx(
            "h-full bg-ink transition-all duration-300 ease-out"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
