import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { Field } from "../../design-system/Field";
import { Icon } from "../../design-system/Icon";
import { useBack } from "../../lib/useBack";
import { buildCustomers, normName, whatsappNumber } from "../../records/customers";
import { useRecords } from "../../records/store";

/** Add a customer, or add details (phone, note) to someone who already appears on your sales. */
export function CustomerForm() {
  const { key = "new" } = useParams();
  const navigate = useNavigate();
  const back = useBack("/money/customers");
  const { state, saveCustomer, archiveCustomer } = useRecords();
  const all = useMemo(() => buildCustomers(state), [state]);
  const existing = key === "new" ? undefined : all.find((c) => c.key === key);

  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  if (key !== "new" && !existing) return <Navigate to="/money/customers" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clash = all.find((c) => c.key !== existing?.key && normName(c.name) === normName(name));
    const next = {
      name: !name.trim() ? "Enter their name" : clash ? `You already have ${clash.name}` : undefined,
      phone: phone.trim() && !whatsappNumber(phone) ? "That doesn't look like a phone number. Try 0803 123 4567." : undefined,
    };
    setErrors(next);
    if (next.name || next.phone) return;
    const saved = saveCustomer({ id: existing?.saved?.id, name, phone, note });
    navigate(`/money/customer/${saved.id}`, { replace: true });
  };

  return (
    <form className="screen" onSubmit={submit} noValidate>
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">{existing ? "Customer details" : "Add a customer"}</h1>
        <div className="form enter" style={{ ["--i" as string]: 1 }}>
          <Field label="Name" value={name} onChange={(e) => { setName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }} error={errors.name} maxLength={80} autoComplete="off" autoCapitalize="words" />
          <Field
            label="Phone number (optional)"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/[^0-9+() -]/g, "")); setErrors((x) => ({ ...x, phone: undefined })); }}
            error={errors.phone}
            maxLength={20}
            hint="Used to open WhatsApp and to call. It stays in your account."
            autoComplete="off"
          />
          <Field label="A note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} hint="For example: pays on Fridays." autoComplete="off" />
        </div>

        {existing?.saved && (
          <div style={{ marginTop: "var(--space-section-gap)" }}>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => {
                archiveCustomer(existing.saved!.id);
                navigate("/money/customers", { replace: true });
              }}
            >
              Remove from my list
            </Button>
            <p className="caption" style={{ textAlign: "left", marginTop: "var(--space-1)" }}>
              Their sales stay in your books, and their name will still show up from those sales.
            </p>
          </div>
        )}
      </main>

      <footer className="screen__footer">
        <Button type="submit" fullWidth>
          Save customer
        </Button>
      </footer>
    </form>
  );
}
