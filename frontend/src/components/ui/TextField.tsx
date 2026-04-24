import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, hint, error, className, id, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="label-lg">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        {...rest}
        aria-invalid={Boolean(error)}
        className={clsx(
          "input-text",
          error && "border-red-500 focus:border-red-500",
          className
        )}
      />
      {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
});

export default TextField;
