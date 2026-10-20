import { useState } from "react";
import { AmountPad } from "../../design-system/AmountPad";
import { Button } from "../../design-system/Button";
import { Field } from "../../design-system/Field";
import { Icon } from "../../design-system/Icon";
import { Money } from "../../design-system/Money";
import { useBack } from "../../lib/useBack";
import { useToast } from "../../lib/toast";
import { digitsToKobo, naira, pressKey } from "../../records/money";
import { useRecords } from "../../records/store";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "../../records/types";
import { WhenPicker, whenToIso, type When } from "./WhenPicker";

/** Write down something you spent money on, so SPAL can show what you actually keep. */
export function RecordExpense() {
  const back = useBack("/app/money");
  const { show } = useToast();
  const { addExpense, removeRecord } = useRecords();
  const [digits, setDigits] = useState("");
  const [category, setCategory] = useState<ExpenseCategory | null>(null);
  const [note, setNote] = useState("");
  const [when, setWhen] = useState<When>({ kind: "today" });
  const [error, setError] = useState<string>();
  const amount = digitsToKobo(digits);

  const save = () => {
    if (amount <= 0) return setError("Enter how much you spent.");
    if (!category) return setError("Pick what it was for.");
    const at = whenToIso(when);
    if (at === null) return setError("Choose a date from the last 5 years, not in the future.");
    const e = addExpense({ amount, category, note, at });
    show(`Recorded ${naira(e.amount)} spent.`, () => removeRecord("expense", e.id));
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
        <h1 className="title title--page enter">Add an expense</h1>
        <div className="amount" style={{ marginTop: "var(--space-5)" }} role="group" aria-label="Amount">
          <span className="amount__label">How much did you spend?</span>
          <Money kobo={amount} size={48} />
        </div>
        <div style={{ marginTop: "var(--space-3)" }}>
          <AmountPad onKey={(k) => { setDigits((d) => pressKey(d, k)); setError(undefined); }} />
        </div>

        <div className="section-gap">
          <div className="stack">
            <span className="field__label">What was it for?</span>
            <div className="chips chips--pick" role="radiogroup" aria-label="Category">
              {EXPENSE_CATEGORIES.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={category === c.id} className="chip-btn" onClick={() => { setCategory(c.id); setError(undefined); }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} autoComplete="off" />
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
          {amount > 0 ? `Save ${naira(amount)}` : "Save expense"}
        </Button>
      </footer>
    </div>
  );
}
