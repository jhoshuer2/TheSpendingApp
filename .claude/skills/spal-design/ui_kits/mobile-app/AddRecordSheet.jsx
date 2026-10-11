const { useState: useStateAS, useEffect: useEffectAS } = React;

const SALE_CATS = ["Food", "Drinks", "Breakfast", "Lunch", "Dinner"];
const EXPENSE_CATS = ["Transport", "Groceries", "Utilities", "Rent", "Marketing"];

/** Two-option segmented control with a gliding thumb. */
function Segmented({ options, value, onChange }) {
  const idx = Math.max(0, options.findIndex(([k]) => k === value));
  return (
    <div style={{ position: "relative", display: "flex", height: 44, padding: 3, borderRadius: 999, background: "var(--surface-sunken)" }}>
      <span style={{ position: "absolute", top: 3, bottom: 3, left: 3, width: `calc((100% - 6px) / ${options.length})`, transform: `translateX(${idx * 100}%)`, borderRadius: 999, background: "var(--surface-card)", boxShadow: "var(--shadow-tactile-light)", transition: "transform var(--dur-3) var(--ease-out)" }} />
      {options.map(([k, l]) => (
        <button key={k} onClick={() => onChange(k)} style={{ position: "relative", flex: 1, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 14, color: value === k ? "var(--text-primary)" : "var(--text-secondary)" }}>{l}</button>
      ))}
    </div>
  );
}

/** Add sale / expense sheet — the core data-entry surface. */
function AddRecordSheet({ type, open, onClose }) {
  const { Button, PillChip, Input, Icon, SpalSymbol, Money } = window.SpalDesignSystem_6a1cb4;
  const [amount, setAmount] = useStateAS("");
  const [desc, setDesc] = useStateAS("");
  const [cat, setCat] = useStateAS("");
  const [status, setStatus] = useStateAS("paid");
  const [saved, setSaved] = useStateAS(false);
  const [closing, setClosing] = useStateAS(false);
  useEffectAS(() => { if (open) { setAmount(""); setDesc(""); setCat(""); setStatus("paid"); setSaved(false); setClosing(false); } }, [open, type]);
  if (!open) return null;
  const isSale = type === "sale";
  const cats = isSale ? SALE_CATS : EXPENSE_CATS;
  const value = Number(String(amount).replace(/[^0-9.]/g, "")) || 0;

  const close = () => { setClosing(true); setTimeout(onClose, 220); };
  const save = () => { setSaved(true); setTimeout(close, 1100); };
  const label = { display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", margin: "0 0 8px" };

  return (
    <>
      <div onClick={close} style={{ position: "absolute", inset: 0, background: "var(--backdrop-sheet)", zIndex: 55, opacity: closing ? 0 : 1, animation: "fade-in var(--dur-3) var(--ease-out)", transition: "opacity 220ms var(--ease-in)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 60, background: "var(--surface-card)", borderRadius: "var(--radius-xl) var(--radius-xl) 0 0", boxShadow: "var(--shadow-3)", maxHeight: "90%", display: "flex", flexDirection: "column", transform: closing ? "translateY(100%)" : "none", animation: "sheet-up var(--dur-3) var(--ease-out)", transition: "transform 220ms var(--ease-in)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 2px" }}><div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--ink-200)" }} /></div>
        {saved ? (
          <div className="enter" style={{ padding: "40px 20px 56px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}>
            <SpalSymbol symbol="profit" size={72} />
            <p style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: "-0.016em" }}>Nice one — saved</p>
            <Money value={value} direction={isSale ? (status === "owing" ? "owed" : "in") : "out"} size={20} />
          </div>
        ) : (
          <div style={{ padding: "10px 20px 28px", overflowY: "auto", overflowX: "hidden", scrollbarWidth: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: "-0.016em", whiteSpace: "nowrap", textWrap: "nowrap" }}>{isSale ? "New sale" : "New expense"}</h2>
              <button onClick={close} aria-label="Close" style={{ width: 32, height: 32, borderRadius: 999, background: "var(--surface-sunken)", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="x" size={16} /></button>
            </div>

            <div style={{ marginBottom: 20 }}><Input label="How much?" large prefix="₦" placeholder="0" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus /></div>
            <div style={{ marginBottom: 20 }}><Input label="What was it for?" placeholder={isSale ? "e.g. Suya, drinks, rice" : "e.g. Fuel, stock, salary"} value={desc} onChange={(e) => setDesc(e.target.value)} /></div>

            <span style={label}>Category</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {cats.map((c) => <PillChip key={c} label={c} size="sm" selected={cat === c} onClick={() => setCat(cat === c ? "" : c)} />)}
            </div>

            {isSale && (
              <div style={{ marginBottom: 24 }}>
                <span style={label}>Did they pay?</span>
                <Segmented options={[["paid", "Paid now"], ["owing", "Owes me"]]} value={status} onChange={setStatus} />
              </div>
            )}

            <Button size="lg" fullWidth disabled={!value} onClick={save}>{isSale ? "Save sale" : "Save expense"}</Button>
          </div>
        )}
      </div>
    </>
  );
}
window.AddRecordSheet = AddRecordSheet;
