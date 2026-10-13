import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { Icon } from "../../design-system/Icon";
import { SpalSymbol } from "../../design-system/SpalSymbol";
import { useBack } from "../../lib/useBack";
import { useToast } from "../../lib/toast";
import { leftLabel, stockLines } from "../../records/stock";
import { liveProducts } from "../../records/calc";
import { useRecords } from "../../records/store";

/** Count what is on your shelf and type it in. From then on SPAL takes off what you sell, and tells you when something runs low. */
export function StockCount() {
  const back = useBack("/money/products");
  const { show } = useToast();
  const { state, setStock } = useRecords();
  const lines = useMemo(() => stockLines(state), [state]);
  const untracked = useMemo(() => liveProducts(state).filter((p) => p.stock === undefined), [state]);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>();
  const changed = lines.filter((l) => typed[l.product.id] !== undefined && typed[l.product.id] !== String(Math.max(0, l.left)));

  const save = () => {
    const bad = changed.find((l) => !/^\d{1,7}$/.test(typed[l.product.id]) || Number(typed[l.product.id]) > 1_000_000);
    if (bad) return setError(`Enter a whole number for ${bad.product.name}. Use 0 if you have none.`);
    for (const l of changed) setStock(l.product.id, Number(typed[l.product.id]));
    setTyped({});
    setError(undefined);
    show(changed.length === 1 ? "Saved your count." : `Saved ${changed.length} counts.`);
  };

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">Count your stock</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          Count what's on your shelf and type it in. From then on SPAL takes off what you sell, and tells you when it runs low.
        </p>

        {lines.length === 0 ? (
          <div className="empty enter">
            <SpalSymbol symbol="growth" size={72} />
            <h2>No stock counted yet</h2>
            <p>{untracked.length ? "Pick a product below and tell SPAL how many you have." : "Add your products first, then count them."}</p>
          </div>
        ) : (
          <div className="list enter" style={{ marginTop: "var(--space-6)", ["--i" as string]: 2 }}>
            {lines.map((l) => (
              <div className="row" key={l.product.id} style={{ cursor: "default" }}>
                <span className="row__main">
                  <span className="row__title">{l.product.name}</span>
                  <span className={`row__sub${l.status !== "ok" ? " row__sub--warn" : ""}`}>{l.status === "low" ? `Running low: ${leftLabel(l.left)}` : leftLabel(l.left)}</span>
                </span>
                <input
                  className="count-input"
                  aria-label={`How many ${l.product.name}`}
                  inputMode="numeric"
                  value={typed[l.product.id] ?? String(Math.max(0, l.left))}
                  maxLength={7}
                  onChange={(e) => {
                    setTyped((t) => ({ ...t, [l.product.id]: e.target.value.replace(/[^\d]/g, "") }));
                    setError(undefined);
                  }}
                />
              </div>
            ))}
          </div>
        )}
        {error && (
          <p className="form-error" role="alert" style={{ marginTop: "var(--space-3)" }}>
            {error}
          </p>
        )}

        {untracked.length > 0 && (
          <>
            <h2 className="section-title">Not counting yet</h2>
            <div className="list">
              {untracked.map((p) => (
                <Link key={p.id} to={`/money/product/${p.id}`} className="row">
                  <span className="row__main">
                    <span className="row__title">{p.name}</span>
                    <span className="row__sub">Tap to count it</span>
                  </span>
                  <span className="row__end">
                    <Icon name="chevron-right" size={18} />
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      {lines.length > 0 && (
        <footer className="screen__footer">
          <Button fullWidth disabled={changed.length === 0} onClick={save}>
            {changed.length === 0 ? "Save counts" : changed.length === 1 ? "Save 1 count" : `Save ${changed.length} counts`}
          </Button>
        </footer>
      )}
    </div>
  );
}
