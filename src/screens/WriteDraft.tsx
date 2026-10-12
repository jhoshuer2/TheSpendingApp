import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { Segmented } from "../design-system/Segmented";
import { copyText } from "../messages/clipboard";
import { factsOf, FACT_KEYS } from "../messages/facts";
import { readMessagePrefs, writeMessagePrefs, type MessagePrefs } from "../messages/prefs";
import { awayMessage, greetingMessage, LANGS, priceListMessage } from "../messages/templates";
import { useBack } from "../lib/useBack";
import { useToast } from "../lib/toast";
import { liveProducts } from "../records/calc";
import { useProfile } from "../profile/store";
import { useRecords } from "../records/store";

const KINDS = {
  prices: { title: "Price list", lede: "Your products and prices in one message. Share it on WhatsApp, in a status, or send it to a customer who asks." },
  greeting: { title: "Greeting message", lede: "WhatsApp Business can send this to anyone who messages you for the first time." },
  away: { title: "Away message", lede: "WhatsApp Business can send this when you're closed." },
} as const;
type Kind = keyof typeof KINDS;

/** A message about your business, written from your products and the facts you gave. Change it, then copy or share it yourself. */
export function WriteDraft() {
  const { kind = "" } = useParams();
  const back = useBack("/write");
  const { show } = useToast();
  const { stored } = useProfile();
  const { state } = useRecords();
  const [prefs, setPrefs] = useState<MessagePrefs>(readMessagePrefs);
  const [custom, setCustom] = useState<string | null>(null);
  const facts = factsOf(stored.answers);
  const products = useMemo(() => liveProducts(state), [state]);

  const generated = useMemo(() => {
    if (kind === "prices") return products.length ? priceListMessage({ products, facts, lang: prefs.lang }) : "";
    if (kind === "greeting") return greetingMessage({ facts, lang: prefs.lang });
    if (kind === "away") return awayMessage({ facts, lang: prefs.lang });
    return "";
  }, [kind, products, facts, prefs.lang]);

  if (!(kind in KINDS)) return <Navigate to="/write" replace />;
  const k = KINDS[kind as Kind];
  const text = custom ?? generated;
  const known = FACT_KEYS.filter((f) => facts[f]).length;
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>
      <main className="screen__body">
        <h1 className="title title--page enter">{k.title}</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          {k.lede}
        </p>

        {kind === "prices" && products.length === 0 ? (
          <div className="empty enter">
            <p>You haven't added any products yet. Add them once and your price list writes itself.</p>
            <Link to="/money/products" className="btn btn--secondary btn--md">
              Add a product
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginTop: "var(--space-5)" }}>
              <Segmented
                label="Language of the message"
                value={prefs.lang}
                options={LANGS}
                onChange={(lang) => {
                  const next = { ...prefs, lang };
                  setPrefs(next);
                  writeMessagePrefs(next);
                  setCustom(null);
                }}
              />
            </div>
            <div style={{ marginTop: "var(--space-4)" }}>
              <label className="field__label" htmlFor="write-text">
                Message
              </label>
              <textarea id="write-text" className="textarea" rows={kind === "prices" ? 10 : 6} value={text} maxLength={2000} onChange={(e) => setCustom(e.target.value)} style={{ marginTop: "var(--space-2)" }} />
              <p className="caption" style={{ textAlign: "left", marginTop: "var(--space-1)" }}>Changing the language writes the message again.</p>
            </div>
            {kind !== "prices" && (
              <p className="note" style={{ marginTop: "var(--space-4)" }}>
                To use it: in WhatsApp Business, look under Settings, then Business tools, for {kind === "greeting" ? "Greeting message" : "Away message"}, and paste this in.
              </p>
            )}
            {kind !== "prices" && known < 2 && (
              <div className="stack" style={{ marginTop: "var(--space-3)", alignItems: "flex-start" }}>
                <p className="note" style={{ margin: 0 }}>This is plain because SPAL doesn't know much yet. Add your business details and it will write more.</p>
                <Link to="/business" className="btn btn--secondary btn--md">
                  Add your business details
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      {text && (
        <footer className="screen__footer">
          {kind === "prices" && (
            <a className="btn btn--primary btn--lg btn--full" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
              Open WhatsApp
            </a>
          )}
          <div className="actions">
            <Button
              variant={kind === "prices" ? "secondary" : "primary"}
              size={kind === "prices" ? "md" : "lg"}
              style={canShare ? undefined : { gridColumn: "1 / -1" }}
              iconRight={<Icon name="copy" size={18} />}
              onClick={async () => show((await copyText(text)) ? "Message copied." : "Couldn't copy. Select the text and copy it.")}
            >
              Copy
            </Button>
            {canShare && (
              <Button variant="secondary" size={kind === "prices" ? "md" : "lg"} iconRight={<Icon name="share" size={18} />} onClick={() => navigator.share({ text }).catch(() => undefined)}>
                Share
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
