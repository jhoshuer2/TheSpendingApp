import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "ink" | "outline";
  /** md = 48px, lg = 56px. (The design system's 36px "sm" is omitted: it is below the 44px touch target.) */
  size?: "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  iconRight?: ReactNode;
}

/** SPAL pill button. One primary per screen. */
export function Button({
  variant = "primary",
  size = "lg",
  loading = false,
  fullWidth = false,
  iconRight,
  disabled,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const cls = ["btn", `btn--${variant}`, `btn--${size}`, fullWidth && "btn--full", className].filter(Boolean).join(" ");
  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <span className="btn__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="sr-only">Loading</span>
        </>
      ) : (
        <>
          {children}
          {iconRight}
        </>
      )}
    </button>
  );
}
