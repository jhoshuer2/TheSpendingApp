import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "../../design-system/Button";
import { Field } from "../../design-system/Field";
import { Icon } from "../../design-system/Icon";
import { Segmented } from "../../design-system/Segmented";
import { LANGS, receiptMessage, reminderMessage, TONES } from "../../messages/templates";
import { copyText } from "../../messages/clipboard";
import { readMessagePrefs, writeMessagePrefs, type MessagePrefs } from "../../messages/prefs";
import { useBack } from "../../lib/useBack";
import { useToast } from "../../lib/toast";
import { buildCustomers, normName, whatsappLink, whatsappNumber } from "../../records/customers";
import { useProfile } from "../../profile/store";
import { useRecords } from "../../records/store";

/**
 * A message ready to send: a payment reminder to someone who owes you, or a receipt for a sale.
 * SPAL writes it from your books, you can change the words, and you send it yourself (WhatsApp, copy, or share).
 * Nothing is ever sent from here.
 */
export function MessageDraft({ kind }: { kind: "reminder" | "receipt" }) {
  const { key = "", id = "" } = useParams();
  const back = useBack("/app/money");
  const { show } = useToast();
  const { state } = useRecords();
  const { stored, saveAnswers } = useProfile();
  const [prefs, setPrefs] = useState<MessagePrefs>(readMessagePrefs);
  const [custom, setCustom] = useState<string | null>(null);
  const business = stored.answers.businessName ?? "";
  const [nameField, setNameField] = useState(business);

  const customers = useMemo(() => buildCustomers(state), [state]);
  const sale = kind === "receipt" ? state.sales[id] : undefined;
  const entry = kind === "reminder" ? customers.find((c) => c.key === key) : sale?.customer ? customers.find((c) => normName(c.name) === normName(sale.customer)) : undefined;

  const generated = useMemo(() => {
    if (kind === "reminder") return entry && entry.owed > 0 ? reminderMessage({ customerName: entry.name, sales: entry.owedSales, from: business, tone: prefs.tone, lang: prefs.lang }) : "";
    return sale && !sale.deletedAt ? receiptMessage({ sale, from: business, lang: prefs.lang }) : "";
  }, [kind, entry, sale, business, prefs]);

  if (kind === "reminder" && (!entry || entry.owed <= 0)) return <Navigate to={entry ? `/money/customer/${entry.key}` : "/money/customers"} replace />;
  if (kind === "receipt" && (!sale || sale.deletedAt)) return <Navigate to="/app/money" replace />;

  const text = custom ?? generated;
  const phone = entry?.phone;
  const hasNumber = whatsappNumber(phone) !== null;
  const link = whatsappLink(phone, text) ?? `https://wa.me/?text=${encodeURIComponent(text)}`;
  const choose = (p: Partial<MessagePrefs>) => {
    const next = { ...prefs, ...p };
    setPrefs(next);
    writeMessagePrefs(next);
    setCustom(null);
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nameChanged = nameField.trim().replace(/\s+/g, " ") !== business;

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>

      <main className="screen__body">
        <h1 className="title title--page enter">{kind === "reminder" ? "Payment reminder" : "Receipt"}</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          {kind === "reminder" ? `A kind message for ${entry!.name}. Change the words if you like. You send it yourself.` : "Change anything you like, then send it yourself."}
        </p>

        <div className="stack" style={{ marginTop: "var(--space-5)" }}>
          {kind === "reminder" && <Segmented label="How it sounds" value={prefs.tone} options={TONES} onChange={(tone) => choose({ tone })} />}
          <Segmented label="Language of the message" value={prefs.lang} options={LANGS} onChange={(lang) => choose({ lang })} />
        </div>

        <div style={{ marginTop: "var(--space-4)" }}>
          <label className="field__label" htmlFor="message-text">
            Message
          </label>
          <textarea id="message-text" className="textarea" rows={kind === "reminder" ? 7 : 11} value={text} maxLength={1200} onChange={(e) => setCustom(e.target.value)} style={{ marginTop: "var(--space-2)" }} />
          <p className="caption" style={{ textAlign: "left", marginTop: "var(--space-1)" }}>Changing the style or language writes the message again.</p>
        </div>

        <div style={{ marginTop: "var(--space-6)" }}>
          <Field label="Your business name (optional)" value={nameField} onChange={(e) => setNameField(e.target.value)} maxLength={60} hint="Signs your messages and heads your receipts." autoComplete="off" autoCapitalize="words" />
          {nameChanged && (
            <div style={{ marginTop: "var(--space-2)" }}>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  const { businessName: _old, ...rest } = stored.answers;
                  const n = nameField.trim().replace(/\s+/g, " ");
                  saveAnswers(n ? { ...rest, businessName: n } : rest);
                  setCustom(null);
                  show(n ? "Saved your business name." : "Removed your business name.");
                }}
              >
                Save name
              </Button>
            </div>
          )}
        </div>

        {entry && !hasNumber && (
          <p className="note" style={{ marginTop: "var(--space-5)" }}>
            {phone ? "That phone number doesn't look right, so WhatsApp will ask who to send it to. " : `No phone number saved for ${entry.name}, so WhatsApp will ask who to send it to. `}
            <Link to={`/money/customer/${entry.key}/edit`}>{phone ? "Fix it" : "Add one"}</Link>
          </p>
        )}
      </main>

      <footer className="screen__footer">
        <a className="btn btn--primary btn--lg btn--full" href={link} target="_blank" rel="noopener noreferrer">
          Open WhatsApp
        </a>
        <div className="actions">
          <Button
            variant="secondary"
            size="md"
            iconRight={<Icon name="copy" size={18} />}
            onClick={async () => show((await copyText(text)) ? "Message copied." : "Couldn't copy. Select the text and copy it.")}
          >
            Copy
          </Button>
          {canShare ? (
            <Button
              variant="secondary"
              size="md"
              iconRight={<Icon name="share" size={18} />}
              onClick={() => navigator.share({ text }).catch(() => undefined)}
            >
              Share
            </Button>
          ) : (
            <span />
          )}
        </div>
      </footer>
    </div>
  );
}
