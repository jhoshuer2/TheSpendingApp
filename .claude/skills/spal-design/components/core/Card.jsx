import React from "react";
import { Aura } from "../brand/Aura.jsx";

const surfaces = {
  raised: { background: "var(--surface-card)", boxShadow: "var(--shadow-1), var(--highlight-top)" },
  sunken: { background: "var(--surface-sunken)", boxShadow: "none" },
  mist: { background: "var(--atmos-mist)", boxShadow: "var(--shadow-1)", aura: "mist" },
  night: { background: "#0B100E", boxShadow: "var(--highlight-top-dark)", color: "#EEF1ED", aura: "night" },
};
const hues = { green: "70,178,122", orange: "166,72,31", blue: "67,81,196", purple: "67,81,196" };

/** SPAL card — a hairline ring, not a shadow. Use sparingly; prefer ledger rows and open sections. */
export function Card({ surface = "raised", accent = "none", padding = "md", elevated = false, children, style, className = "", ...props }) {
  const paddings = { none: 0, sm: 12, md: 16, lg: 20 };
  const { aura, ...s } = surfaces[surface] || surfaces.raised;
  return (
    <div
      className={className}
      data-theme={surface === "night" ? "night" : undefined}
      style={{
        position: "relative", overflow: "hidden", borderRadius: "var(--radius-md)",
        padding: paddings[padding], ...s,
        ...(elevated ? { boxShadow: "var(--shadow-2)" } : null),
        ...style,
      }}
      {...props}
    >
      {accent !== "none" && hues[accent] && (
        <span aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,rgba(${hues[accent]},0) 0%,rgba(${hues[accent]},0.6) 50%,rgba(${hues[accent]},0) 100%)` }} />
      )}
      {aura && <Aura variant={aura} />}
      {aura ? <div style={{ position: "relative" }}>{children}</div> : children}
    </div>
  );
}
