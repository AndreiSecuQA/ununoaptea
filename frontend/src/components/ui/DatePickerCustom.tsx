import { useId } from "react";

interface Props {
  value: string | undefined;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

/**
 * Minimal native <input type="date"> wrapper — avoids the weight of react-datepicker
 * while still giving a good mobile experience (uses system picker).
 */
export default function DatePickerCustom({
  value,
  onChange,
  min,
  max,
  label,
  required,
  id,
}: Props) {
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
        id={inputId}
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        required={required}
        className="input-text"
      />
    </div>
  );
}
