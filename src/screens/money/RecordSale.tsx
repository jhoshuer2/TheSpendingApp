import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AmountPad } from "../../design-system/AmountPad";
import { Button } from "../../design-system/Button";
import { Field } from "../../design-system/Field";
import { Icon } from "../../design-system/Icon";
import { Money } from "../../design-system/Money";
import { Segmented } from "../../design-system/Segmented";
import { useBack } from "../../lib/useBack";
import { useToast } from "../../lib/toast";
import { buildCustomers, normName } from "../../records/customers";
import { digitsToKobo, naira, pressKey } from "../../records/money";
import { useRecords } from "../../records/store";
import type { SaleItem } from "../../records/types";
import { WhenPicker, whenToIso, type When } from "./WhenPicker";

type Mode = "quick" | "products";

/** Record a sale in a few taps: type the amount, or pick the products. Nothing else is needed. */
export function RecordSale() {
  const back = useBack("/app/money");
  const { show } = useToast();
  const { products, addSale, removeRecord, state } = useRecords();
  const [mode, setMode] = useState<Mode>("quick");
  const [digits, setDigits] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [paid, setPaid] = useState<"paid" | "owes">("paid");
  const [customer, setCustomer] = useState("");
  const [when, setWhen] = useState<When>({ kind: "today" });
  const [error, setError] = useState<string>();

  const items: SaleItem[] = useMemo(
    () => products.filter((p) => (qty[p.id] ?? 0) > 0).map((p) => ({ productId: p.id, name: p.name, qty: qty[p.id], unitPrice: p.price })),
    [products, qty],
  );
  const amount = mode === "quick" ? digitsToKobo(digits) : items.reduce((n, i) => n + i.qty * i.unitPrice, 0);

  // People you've sold to before, most recent first, narrowed as you type. Tapping one fills in the name exactly as saved.
  const suggestions = useMemo(() => {
    const typed = normName(customer);
    return buildCustomers(state)
      .filter((c) => c.sales.length > 0 || c.saved)
      .sort((a, b) => (b.lastAt ?? "").localeCompare(a.lastAt ?? ""))
      .map((c) => c.name)
      .filter((n) => normName(n) !== typed && (!typed || normName(n).includes(typed)))
      .slice(0, 5);
  }, [state, customer]);

  const bump = (id: string, by: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(999, (q[id] ?? 0) + by)) }));

  const save = () => {
    if (amount <= 0) return setError(mode === "quick" ? "Enter how much it was." : "Pick at least one product.");
    if (paid === "owes" && !customer.trim()) return setError("Who owes you? Add their name so you remember.");
    const at = whenToIso(when);
    if (at === null) return setError("Choose a date that isn't in the future.");
    const sale = addSale({ amount, items: mode === "products" ? items : [], note: mode === "quick" ? note : undefined, customer: customer.trim() || undefined, paid: paid === "paid", at });
    show(`Recorded ${naira(sale.amount)}.`, () => removeRecord("sale", sale.id));
    back();
  };

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">Record a sale</h1>
        <div style={{ marginTop: "var(--space-5)" }}>
          <Segmented label="How to enter it" value={mode} options={[{ value: "quick", label: "Type the amount" }, { value: "products", label: "Pick products" }]} onChange={(m) => { setMode(m); setError(undefined); }} />
        </div>

        <div className="amount" style={{ marginTop: "var(--space-4)" }} role="group" aria-label="Amount">
          <span className="amount__label">{mode === "quick" ? "How much?" : "Total"}</span>
          <Money kobo={amount} size={48} />
        </div>

        {mode === "quick" ? (
          <div style={{ marginTop: "var(--space-3)" }}>
            <AmountPad onKey={(k) => { setDigits((d) => pressKey(d, k)); setError(undefined); }} />
          </div>
        ) : products.length === 0 ? (
          <div className="empty">
            <p>You haven't added any products yet. Add them once, then record sales in a tap.</p>
            <Link to="/money/products" className="btn btn--secondary btn--md">
              Add a product
            </Link>
          </div>
        ) : (
          <div className="list" style={{ marginTop: "var(--space-3)" }}>
            {products.map((p) => (
              <div className="row" key={p.id} style={{ cursor: "default" }}>
                <span className="row__main">
                  <span className="row__title">{p.name}</span>
                  <span className="row__sub">{naira(p.price)}</span>
                </span>
                <span className="stepper">
                  <button type="button" aria-label={`Remove one ${p.name}`} disabled={!qty[p.id]} onClick={() => bump(p.id, -1)}>
                    <Icon name="minus" size={18} />
                  </button>
                  <output aria-label={`${p.name} quantity`}>{qty[p.id] ?? 0}</output>
                  <button type="button" aria-label={`Add one ${p.name}`} onClick={() => bump(p.id, 1)}>
                    <Icon name="plus" size={18} />
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="section-gap">
          {mode === "quick" && <Field label="What was it? (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} autoComplete="off" />}
          <div className="stack">
            <span className="field__label">Did they pay?</span>
            <Segmented label="Payment" value={paid} options={[{ value: "paid", label: "Paid" }, { value: "owes", label: "Owes me" }]} onChange={(v) => { setPaid(v); setError(undefined); }} />
          </div>
          <Field label={paid === "owes" ? "Who owes you?" : "Customer (optional)"} value={customer} onChange={(e) => { setCustomer(e.target.value); setError(undefined); }} maxLength={80} autoComplete="off" autoCapitalize="words" />
          {suggestions.length > 0 && (
            <div className="chips chips--pick" aria-label="People you've sold to before">
              {suggestions.map((n) => (
                <button key={n} type="button" className="chip-btn" onClick={() => { setCustomer(n); setError(undefined); }}>
                  {n}
                </button>
              ))}
            </div>
          )}
          <WhenPicker when={when} onChange={setWhen} />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </main>

      <footer className="screen__footer">
        <Button fullWidth disabled={amount <= 0} onClick={save}>
          {amount > 0 ? `Record ${naira(amount)}` : "Record sale"}
        </Button>
      </footer>
    </div>
  );
}
