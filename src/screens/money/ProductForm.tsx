import { useState, type FormEvent } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useBack } from "../../lib/useBack";
import { Button } from "../../design-system/Button";
import { Field } from "../../design-system/Field";
import { Icon } from "../../design-system/Icon";
import { Switch } from "../../design-system/Switch";
import { formatNaira, MAX_NAIRA, toKobo } from "../../records/money";
import { useRecords } from "../../records/store";
import { isTracked, stockLeft } from "../../records/stock";

const toNaira = (raw: string): number | null => {
  const t = raw.replace(/,/g, "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n <= MAX_NAIRA ? n : null;
};

/** Add or edit a product. Price is what you sell it for; cost (optional) is what it costs you to make or buy. */
export function ProductForm() {
  const { id } = useParams();
  const back = useBack("/money/products");
  const { state, saveProduct, archiveProduct } = useRecords();
  const existing = id && id !== "new" ? state.products[id] : undefined;

  const [name, setName] = useState(existing?.name ?? "");
  const [price, setPrice] = useState(existing ? formatNaira(existing.price).replace(/,/g, "") : "");
  const [cost, setCost] = useState(existing?.cost !== undefined ? formatNaira(existing.cost).replace(/,/g, "") : "");
  const left = existing ? stockLeft(state, existing) : null;
  const [track, setTrack] = useState(existing ? isTracked(existing) : false);
  const [count, setCount] = useState(left !== null ? String(Math.max(0, left)) : "");
  const [low, setLow] = useState(existing?.lowAt !== undefined ? String(existing.lowAt) : "");
  const [errors, setErrors] = useState<{ name?: string; price?: string; cost?: string; count?: string; low?: string }>({});

  if (id && id !== "new" && !existing) return <Navigate to="/money/products" replace />;

  const wholeNumber = (raw: string): number | null => (/^\d{1,7}$/.test(raw.trim()) && Number(raw) <= 1_000_000 ? Number(raw) : null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = toNaira(price);
    const c = cost.trim() === "" ? undefined : toNaira(cost);
    const n = track ? wholeNumber(count) : null;
    const lowN = track && low.trim() !== "" ? wholeNumber(low) : null;
    const next = {
      name: name.trim() ? undefined : "Enter the product's name",
      price: p === null ? "Enter a price, like 2500" : undefined,
      cost: c === null ? "Enter a number, like 1400, or leave it empty" : undefined,
      count: track && n === null ? "Enter how many you have, like 20. Use 0 if you have none." : undefined,
      low: track && low.trim() !== "" && lowN === null ? "Enter a whole number, like 5, or leave it empty" : undefined,
    };
    setErrors(next);
    if (next.name || next.price || next.cost || next.count || next.low || p === null || c === null) return;
    // Counting again only when the number was changed: leaving it alone keeps "what's left" counting down from the earlier count.
    const recount = track && n !== null && !(existing && isTracked(existing) && n === Math.max(0, left ?? 0));
    saveProduct({
      id: existing?.id, name, price: toKobo(p), cost: c === undefined ? undefined : toKobo(c),
      stock: !track ? null : recount ? n : undefined,
      lowAt: !track ? null : low.trim() === "" ? null : lowN,
    });
    back();
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">{existing ? "Edit product" : "Add a product"}</h1>
        <div className="form enter" style={{ ["--i" as string]: 1 }}>
          <Field label="Name" value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }} error={errors.name} maxLength={80} autoComplete="off" autoCapitalize="sentences" />
          <Field label="Price you sell it for" prefix="₦" inputMode="decimal" value={price} onChange={(e) => { setPrice(e.target.value); setErrors((x) => ({ ...x, price: undefined })); }} error={errors.price} autoComplete="off" />
          <Field label="What it costs you (optional)" prefix="₦" inputMode="decimal" value={cost} onChange={(e) => { setCost(e.target.value); setErrors((x) => ({ ...x, cost: undefined })); }} error={errors.cost} hint="What you spend to make or buy one. SPAL uses it to show how much you keep." autoComplete="off" />
          <div className="list">
            <Switch label="Track how many I have" hint="SPAL takes off what you sell when you pick this product, and tells you when it's running low." checked={track} onChange={(on) => { setTrack(on); setErrors((x) => ({ ...x, count: undefined, low: undefined })); }} />
          </div>
          {track && (
            <>
              <Field label="How many do you have now?" inputMode="numeric" value={count} onChange={(e) => { setCount(e.target.value.replace(/[^\d]/g, "")); setErrors((x) => ({ ...x, count: undefined })); }} error={errors.count} maxLength={7} hint={existing && isTracked(existing) ? "Change this if you've counted again." : "Count what's on your shelf today."} autoComplete="off" />
              <Field label="Tell me when it gets low (optional)" inputMode="numeric" value={low} onChange={(e) => { setLow(e.target.value.replace(/[^\d]/g, "")); setErrors((x) => ({ ...x, low: undefined })); }} error={errors.low} maxLength={7} hint="For example 5. You'll see a warning when you have this many or fewer." autoComplete="off" />
            </>
          )}
        </div>

        {existing && (
          <div style={{ marginTop: "var(--space-section-gap)" }}>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                archiveProduct(existing.id, true);
                back();
              }}
            >
              Remove this product
            </Button>
            <p className="caption" style={{ textAlign: "left", marginTop: "var(--space-1)" }}>
              Past sales keep their record. You can bring it back later.
            </p>
          </div>
        )}
      </main>

      <footer className="screen__footer">
        <Button type="submit" fullWidth>
          Save product
        </Button>
      </footer>
    </form>
  );
}
