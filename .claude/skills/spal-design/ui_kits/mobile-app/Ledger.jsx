const { useState: useStateLR, useEffect: useEffectLR } = React;

/** Count a number up to its target with the "settle" curve. */
function useCountUp(target, ms = 560) {
  const [v, setV] = useStateLR(0);
  useEffectLR(() => {
    const t0 = Date.now();
    const id = setInterval(() => {
      const p = Math.min((Date.now() - t0) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p >= 1) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, ms]);
  return v;
}

/** Screen header — date line + business name, bell and avatar. */
function ScreenHeader() {
  const { Icon } = window.SpalDesignSystem_6a1cb4;
  return (
    <div className="enter" style={{ padding: "56px 20px 0", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)" }}>Tuesday, 14 October</p>
        <h1 style={{ margin: "4px 0 0", fontSize: 26, fontWeight: 500, letterSpacing: "-0.022em", color: "var(--text-primary)", whiteSpace: "nowrap", textWrap: "nowrap" }}>Ada's Kitchen</h1>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="press" aria-label="Notifications" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "var(--surface-card)", boxShadow: "var(--shadow-1)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
          <Icon name="bell" size={19} />
          <span style={{ position: "absolute", top: 9, right: 10, width: 6, height: 6, borderRadius: 999, background: "var(--accent)", boxShadow: "0 0 0 2px var(--surface-card)" }} />
        </button>
        <button className="press" aria-label="Profile" style={{ width: 40, height: 40, borderRadius: 999, border: "none", background: "var(--ink-900)", color: "#EEF1ED", fontWeight: 500, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-display)" }}>A</button>
      </div>
    </div>
  );
}

/** Section title row. */
function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{children}</h2>
      {action && <button onClick={onAction} style={{ background: "none", border: "none", padding: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text-secondary)", cursor: "pointer", fontFamily: "var(--font-display)" }}>{action}</button>}
    </div>
  );
}

/** Ledger row — the signature list unit: 60px, sunken 40px tile, hairline inset after the tile. */
function LedgerRow({ r, first }) {
  const { Icon, Money, Badge } = window.SpalDesignSystem_6a1cb4;
  const isSale = r.type === "sale";
  return (
    <div className="row-press" style={{ position: "relative", height: "var(--row-h)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      {!first && <span style={{ position: "absolute", left: 52, right: 0, top: 0, height: 1, background: "var(--line)" }} />}
      <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--surface-sunken)", color: isSale ? "var(--money-in)" : "var(--money-out)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon name={isSale ? "arrow-down-left" : "arrow-up-right"} size={18} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.005em" }}>{r.desc}</p>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.customer ? `${r.customer} · ` : ""}{r.cat} · {r.time}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <Money value={r.amount} direction={r.owing ? "owed" : isSale ? "in" : "out"} size={15} />
        {r.owing && <Badge label="Owing" color="ochre" />}
      </div>
    </div>
  );
}

/** Grouped ledger list on a raised surface. */
function Ledger({ rows }) {
  return (
    <div style={{ background: "var(--surface-card)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-1), var(--highlight-top)", padding: "0 16px" }}>
      {rows.map((r, i) => <LedgerRow key={r.id} r={r} first={i === 0} />)}
    </div>
  );
}

Object.assign(window, { useCountUp, ScreenHeader, SectionTitle, LedgerRow, Ledger });
