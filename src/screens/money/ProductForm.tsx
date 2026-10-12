import { useState, type FormEvent } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useBack } from "../../lib/useBack";
import { Button } from "../../design-system/Button";
import { Field } from "../../design-system/Field";
import { Icon } from "../../design-system/Icon";
import { formatNaira, MAX_NAIRA, toKobo } from "../../records/money";
import { useRecords } from "../../records/store";

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
  const [errors, setErrors] = useState<{ name?: string; price?: string; cost?: string }>({});

  if (id && id !== "new" && !existing) return <Navigate to="/money/products" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = toNaira(price);
    const c = cost.trim() === "" ? undefined : toNaira(cost);
    const next = {
      name: name.trim() ? undefined : "Enter the product's name",
      price: p === null ? "Enter a price, like 2500" : undefined,
      cost: c === null ? "Enter a number, like 1400, or leave it empty" : undefined,
    };
    setErrors(next);
    if (next.name || next.price || next.cost || p === null || c === null) return;
    saveProduct({ id: existing?.id, name, price: toKobo(p), cost: c === undefined ? undefined : toKobo(c) });
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
