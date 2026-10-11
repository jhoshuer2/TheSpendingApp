import React from "react";

/** SPAL button — tactile, not glowing: a lit top edge, a weighted bottom edge, 0.98 press. Pill radius. */
export function Button({
  variant = "primary", size = "md", loading = false, fullWidth = false,
  icon, iconRight, disabled, children, style, className = "", ...props
}) {
  const variants = {
    primary: { background: "var(--accent)", color: "var(--text-on-accent)", boxShadow: "var(--shadow-tactile)" },
    secondary: { background: "var(--surface-card)", color: "var(--text-primary)", boxShadow: "var(--shadow-tactile-light)" },
    ghost: { background: "transparent", color: "var(--text-primary)", boxShadow: "none" },
    danger: { background: "var(--surface-card)", color: "var(--danger)", boxShadow: "var(--shadow-tactile-light)" },
  };
  const sizes = {
    sm: { height: "var(--control-h-sm)", padding: "0 14px", fontSize: 14, gap: 6 },
    md: { height: "var(--control-h)", padding: "0 22px", fontSize: 15, gap: 8 },
    lg: { height: "var(--control-h-lg)", padding: "0 28px", fontSize: 16, gap: 8 },
  };
  const isDisabled = disabled || loading;
  return (
    <button
      className={`spal-btn ${className}`}
      disabled={isDisabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "-0.01em", whiteSpace: "nowrap",
        borderRadius: "var(--radius-full)", border: "none", cursor: isDisabled ? "default" : "pointer",
        width: fullWidth ? "100%" : "auto", opacity: disabled && !loading ? 0.42 : 1,
        transition: "transform var(--dur-1) var(--ease-out), filter var(--dur-2) var(--ease-out), opacity var(--dur-2) var(--ease-out)",
        WebkitTapHighlightColor: "transparent",
        ...variants[variant], ...sizes[size], ...style,
      }}
      {...props}
    >
      {loading ? (
        <span style={{ display: "flex", gap: 5 }} aria-label="Loading">
          {[0, 1, 2].map((i) => <span key={i} className="spal-btn-dot" style={{ animationDelay: `${i * 0.14}s` }} />)}
        </span>
      ) : (
        <>
          {icon && <span style={{ display: "flex", flexShrink: 0 }}>{icon}</span>}
          {children}
          {iconRight && <span style={{ display: "flex", flexShrink: 0 }}>{iconRight}</span>}
        </>
      )}
      <style>{`
        .spal-btn:hover:not(:disabled){filter:brightness(1.04)}
        .spal-btn:active:not(:disabled){transform:scale(var(--press-scale))}
        .spal-btn:focus-visible{outline:none;box-shadow:var(--focus-ring)}
        .spal-btn-dot{width:5px;height:5px;border-radius:999px;background:currentColor;display:inline-block;animation:spal-btn-pulse 1s var(--ease-in-out) infinite}
        @keyframes spal-btn-pulse{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}
      `}</style>
    </button>
  );
}
