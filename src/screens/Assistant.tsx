import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { Segmented } from "../design-system/Segmented";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { Switch } from "../design-system/Switch";
import { MAX_INPUT_CHARS, type ChatErrorKind, type Item } from "../assistant/engine";
import { useAssistant } from "../assistant/store";
import { describeProposal, type Draft } from "../assistant/tools";
import { copyText } from "../messages/clipboard";
import { buildCustomers, whatsappLink } from "../records/customers";
import { useToast } from "../lib/toast";
import { useBack } from "../lib/useBack";
import { firstName } from "../lib/format";
import { useAuth } from "../lib/auth";
import { liveExpenses, liveSales } from "../records/calc";
import { useRecords } from "../records/store";
import { useProfile } from "../profile/store";

const STARTERS = {
  en: ["I sold 3 plates of jollof for ₦4,500", "How much did I make this week?", "Who owes me money?"],
  pcm: ["I sell 3 plate jollof for 4,500 naira", "How much I make this week?", "Who dey owe me?"],
} as const;

const ERRORS: Record<ChatErrorKind, string> = {
  offline: "You're offline. Your message is kept. Try again when you have a connection.",
  signin: "Please sign in again to use the assistant.",
  quota: "You've used all your assistant messages for today. They come back tomorrow.",
  busy: "The assistant is busy. Try again in a moment.",
  too_long: "This chat has got too long. Clear it and start a new one.",
  failed: "The assistant couldn't answer just now. Try again.",
  unavailable: "The assistant isn't available right now.",
};

function Card({ item }: { item: Extract<Item, { kind: "proposal" }> }) {
  const a = useAssistant();
  const lines = describeProposal(item.proposal);
  const head = item.status === "pending" ? "Save this?" : item.status === "saved" ? (item.auto ? "Saved for you" : "Saved") : item.status === "undone" ? "Undone" : item.stale ? "Not saved" : "Not saved";
  return (
    <div className={`acard acard--${item.status}`} data-testid="proposal">
      <p className="acard__head">
        {item.status === "saved" && <Icon name="check" size={16} />}
        {head}
      </p>
      <ul className="acard__lines">
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
      {item.status === "pending" && (
        <div className="acard__actions">
          <Button size="md" onClick={() => a.save(item.id)}>
            Save
          </Button>
          <Button size="md" variant="secondary" onClick={() => a.dismiss(item.id)}>
            Not right
          </Button>
        </div>
      )}
      {item.status === "saved" && (
        <div className="acard__actions">
          <button type="button" className="link-btn" onClick={() => a.undo(item.id)}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

/** A message the assistant prepared. It is only ever shown: you read it, change it if you like, and send it yourself. */
function DraftCard({ draft }: { draft: Draft }) {
  const { state } = useRecords();
  const { show } = useToast();
  const phone = buildCustomers(state).find((c) => c.key === draft.customerKey)?.phone;
  const link = whatsappLink(phone, draft.text) ?? `https://wa.me/?text=${encodeURIComponent(draft.text)}`;
  const edit = draft.kind === "reminder" ? `/money/message/reminder/${draft.customerKey}` : `/money/message/receipt/${draft.saleId}`;
  return (
    <div className="acard acard--draft" data-testid="draft">
      <p className="acard__head">
        <Icon name={draft.kind === "reminder" ? "message-circle" : "receipt"} size={16} />
        {draft.title}
      </p>
      <p className="acard__message">{draft.text}</p>
      <div className="acard__actions">
        <a className="btn btn--primary btn--md" href={link} target="_blank" rel="noopener noreferrer">
          Open WhatsApp
        </a>
        <Button size="md" variant="secondary" onClick={async () => show((await copyText(draft.text)) ? "Message copied." : "Couldn't copy. Select the text and copy it.")}>
          Copy
        </Button>
      </div>
      <Link to={edit} className="link-btn" style={{ marginTop: "var(--space-1)" }}>
        Change the words or style
      </Link>
    </div>
  );
}

function Consent() {
  const a = useAssistant();
  const back = useBack("/app/today");
  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>
      <main className="screen__body">
        <h1 className="title title--page enter">Talk to SPAL</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          Tell it what you sold or spent, in English or Pidgin, and it will write it down. Ask it how your business is doing.
        </p>
        <div className="list enter" style={{ marginTop: "var(--space-6)", ["--i" as string]: 2 }}>
          <div className="row row--static"><span className="row__main"><span className="row__title">It asks before it saves</span><span className="row__sub">You check every sale and expense first, and you can undo it.</span></span></div>
          <div className="row row--static"><span className="row__main"><span className="row__title">What gets shared</span><span className="row__sub">Your messages, your first name and the figures it needs to answer you go to an AI service to write the replies. Your email and password are never sent.</span></span></div>
          <div className="row row--static"><span className="row__main"><span className="row__title">Keep private things out</span><span className="row__sub">Don't type ID numbers like your NIN or BVN, or bank PINs.</span></span></div>
        </div>
      </main>
      <footer className="screen__footer">
        <Button fullWidth onClick={a.consent}>I understand</Button>
      </footer>
    </div>
  );
}

export function Assistant() {
  const a = useAssistant();
  const { session } = useAuth();
  const back = useBack("/app/today");
  // A link can prefill what to say (for example "Write my Instagram bio"). It is never sent until the person taps Send.
  const [params] = useSearchParams();
  const [text, setText] = useState(() => (params.get("say") ?? "").slice(0, MAX_INPUT_CHARS));
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const items = a.chat.items;

  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [items.length, a.busy, a.error]);

  // Grow the box with the text, up to a few lines.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  if (!a.available) {
    return (
      <div className="screen">
        <header className="screen__header">
          <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
            <Icon name="chevron-left" size={20} />
          </button>
        </header>
        <main className="screen__body" style={{ display: "grid", placeItems: "center" }}>
          <div className="empty enter">
            <SpalSymbol symbol="focus" size={72} />
            <h2>The assistant needs an account</h2>
            <p>You're using SPAL in demo mode, where nothing is saved to a server. Connect SPAL to Supabase to use the assistant.</p>
          </div>
        </main>
      </div>
    );
  }
  if (!a.consented) return <Consent />;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || a.busy) return;
    a.send(text);
    setText("");
  };
  const starters = STARTERS[a.settings.replyLanguage];
  const err = a.error ?? (a.chat.failed ? { kind: "failed" as ChatErrorKind } : null);
  const blocked = a.error?.kind === "quota" || a.error?.kind === "unavailable" || a.error?.kind === "signin" || a.error?.kind === "too_long";

  return (
    <div className="screen">
      <header className="screen__header screen__header--bar">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
        <h1 className="screen__title">SPAL Assistant</h1>
        <Link to="/assistant/settings" className="icon-btn" aria-label="Assistant settings">
          <Icon name="sliders" size={20} />
        </Link>
      </header>

      <main className="screen__body chat" aria-label="Conversation">
        {items.length === 0 ? (
          <div className="chat__intro enter">
            <span className="chat__mark"><Icon name="sparkles" size={24} /></span>
            <h2>Hi {firstName(session?.name)}, what happened in your business?</h2>
            <p>{a.settings.replyLanguage === "pcm" ? "Tell me wetin you sell or spend, or ask me about your money." : "Tell me what you sold or spent, or ask about your money."}</p>
            <div className="chips chips--pick" style={{ justifyContent: "center" }}>
              {starters.map((s) => (
                <button key={s} type="button" className="chip-btn" onClick={() => a.send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="chat__list" aria-live="polite">
            {items.map((it) => (
              <li key={it.id} className={`msg msg--${it.kind}`}>
                {it.kind === "proposal" ? <Card item={it} /> : it.kind === "draft" ? <DraftCard draft={it.draft} /> : it.kind === "note" ? <p className="msg__note">{it.text}</p> : <p className="msg__text">{it.text}</p>}
              </li>
            ))}
            {a.busy && (
              <li className="msg msg--assistant" role="status">
                <span className="typing" aria-hidden="true"><i /><i /><i /></span>
                <span className="sr-only">The assistant is thinking</span>
              </li>
            )}
          </ol>
        )}
        {err && !a.busy && (
          <div className="chat__error" role="alert">
            <p>{ERRORS[err.kind]}</p>
            {a.chat.failed && !blocked && (
              <Button size="md" variant="secondary" onClick={a.retry}>
                Try again
              </Button>
            )}
            {err.kind === "too_long" && (
              <Button size="md" variant="secondary" onClick={a.clear}>
                Start a new chat
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </main>

      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="assistant-input">Message</label>
        <textarea
          id="assistant-input"
          ref={inputRef}
          className="composer__input"
          rows={1}
          maxLength={MAX_INPUT_CHARS}
          value={text}
          placeholder={a.settings.replyLanguage === "pcm" ? "Wetin happen today?" : "Type what happened…"}
          enterKeyHint="send"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
          }}
        />
        <button type="submit" className="composer__send" aria-label="Send" disabled={!text.trim() || a.busy}>
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  );
}

export function AssistantSettings() {
  const a = useAssistant();
  const { session } = useAuth();
  const { stored } = useProfile();
  const { state } = useRecords();
  const back = useBack("/assistant");
  const nav = useNavigate();
  const sales = liveSales(state).length, expenses = liveExpenses(state).length;
  const products = Object.values(state.products).filter((p) => !p.archived).length;

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>
      <main className="screen__body">
        <h1 className="title title--page enter">Assistant settings</h1>

        <h2 className="section-title">Language it replies in</h2>
        <Segmented label="Reply language" value={a.settings.replyLanguage} options={[{ value: "en", label: "English" }, { value: "pcm", label: "Pidgin" }]} onChange={(v) => a.setSettings({ replyLanguage: v })} />
        <p className="lede" style={{ marginTop: "var(--space-2)" }}>You can write to it in English or Pidgin, whichever you like. This only changes how it answers.</p>

        <h2 className="section-title">Saving</h2>
        <div className="list">
          <Switch
            label="Save without asking"
            hint="When it's sure about a sale or expense, it saves it and you can undo. It still asks first for anything above ₦500,000."
            checked={a.settings.autonomy === "auto"}
            onChange={(on) => a.setSettings({ autonomy: on ? "auto" : "ask" })}
          />
        </div>

        <h2 className="section-title">What it knows about you</h2>
        <div className="list">
          <div className="row row--static"><span className="row__main"><span className="row__title">Your first name</span><span className="row__sub">{firstName(session?.name)}</span></span></div>
          <div className="row row--static"><span className="row__main"><span className="row__title">Kind of business</span><span className="row__sub">{stored.answers.type ?? "Not told yet"}</span></span></div>
          <div className="row row--static"><span className="row__main"><span className="row__title">Your books</span><span className="row__sub">{sales} {sales === 1 ? "sale" : "sales"}, {expenses} {expenses === 1 ? "expense" : "expenses"}, {products} {products === 1 ? "product" : "products"}. It only looks at these when you ask.</span></span></div>
        </div>

        <div style={{ marginTop: "var(--space-8)" }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              a.clear();
              nav("/assistant", { replace: true });
            }}
          >
            Clear this chat
          </Button>
        </div>
      </main>
    </div>
  );
}
