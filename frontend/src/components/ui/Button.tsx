import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

export default function Button({
  variant = "primary",
  full,
  className,
  children,
  ...rest
}: Props) {
  const base =
    variant === "primary"
      ? "btn-primary"
      : variant === "secondary"
      ? "btn-secondary"
      : "text-ink hover:text-accent underline-offset-4 hover:underline px-2 py-1 text-sm";
  return (
    <button
      {...rest}
      className={clsx(base, full && "w-full", className)}
    >
      {children}
    </button>
  );
}
