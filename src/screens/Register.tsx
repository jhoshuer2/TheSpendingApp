import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Field } from "../design-system/Field";
import { Icon } from "../design-system/Icon";
import { useBack } from "../lib/useBack";
import { useToast } from "../lib/toast";
import { copyText } from "../messages/clipboard";
import { factsOf } from "../messages/facts";
import { useProfile } from "../profile/store";
import { CAC_PORTAL, CAC_SEARCH, CHECKED_ON, PORTAL_STEPS, READY_ITEMS, checkRegNumber, sensitiveWords } from "../registration/guide";

const longDay = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

function External({ href, children, variant = "secondary" }: { href: string; children: string; variant?: "primary" | "secondary" }) {
  return (
    <a className={`btn btn--${variant} ${variant === "primary" ? "btn--lg btn--full" : "btn--md"}`} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <Icon name="arrow-up-right" size={16} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/** Register a business name with CAC: get ready, then do it on CAC's own site, then check and save the number.
 *  SPAL guides and checks. It never registers anything, never asks for an ID number, and cannot look up CAC's records. */
export function Register() {
  const back = useBack("/business");
  const { show } = useToast();
  const { stored, saveAnswers } = useProfile();
  const facts = factsOf(stored.answers);
  const [names, setNames] = useState([facts.businessName ?? "", "", ""]);
  const [ready, setReady] = useState<boolean[]>(READY_ITEMS.map(() => false));
  const [num, setNum] = useState(stored.answers.registeredAs ?? "");
  const [day, setDay] = useState(stored.answers.registeredOn ?? "");
  const [error, setError] = useState<string>();
  const registered = stored.answers.registeredAs;

  const copy = async (label: string, text: string) => show((await copyText(text)) ? `Copied ${label}.` : "Couldn't copy. Press and hold the text to copy it.");
  const chosen = names.map((n) => n.replace(/\s+/g, " ").trim()).filter(Boolean);
  const pack: { label: string; text: string }[] = [
    ...(chosen.length ? [{ label: "your name choices", text: chosen.map((n, i) => `${i + 1}. ${n}`).join("\n") }] : []),
    ...(facts.about ? [{ label: "what you do", text: facts.about }] : []),
    ...(facts.place ? [{ label: "your address", text: facts.place }] : []),
  ];

  const save = (e: FormEvent) => {
    e.preventDefault();
    const r = checkRegNumber(num);
    if (!r.ok) return setError(r.error);
    const next = { ...stored.answers, registeredAs: r.value };
    if (day) next.registeredOn = day;
    else delete next.registeredOn;
    const have = new Set(next.have ?? []);
    have.delete("none");
    have.add("registered");
    next.have = [...have];
    saveAnswers(next);
    setNum(r.value);
    setError(undefined);
    show("Saved your registration number.");
  };

  return (
    <div className="screen">
      <header className="screen__header">
        <button type="button" className="icon-btn" aria-label="Back" onClick={back}>
          <Icon name="chevron-left" size={20} />
        </button>
      </header>
      <main className="screen__body">
        <h1 className="title title--page enter">Register your business name</h1>
        <p className="lede enter" style={{ ["--i" as string]: 1 }}>
          SPAL gets you ready and checks your work. You register on the CAC website yourself. SPAL doesn't send anything for you.
        </p>

        {registered && (
          <section className="card enter" style={{ marginTop: "var(--space-5)", ["--i" as string]: 2 }} aria-label="Your registration">
            <b>You're registered: {registered}</b>
            {stored.answers.registeredOn && <span className="row__sub" style={{ display: "block" }}>Since {longDay(stored.answers.registeredOn)}</span>}
            <span className="row__sub" style={{ display: "block", margin: "var(--space-2) 0 var(--space-3)" }}>
              Next: keep business money apart from your own. Business names usually have a yearly filing with CAC, often due by 30 June. Check the dates on the CAC website.
            </span>
            <Link to="/module/money-account" className="btn btn--secondary btn--md">Open a business account</Link>
          </section>
        )}

        <p className="caption" style={{ marginTop: "var(--space-4)" }}>
          Steps last checked {CHECKED_ON}. Fees and rules change, so look at the CAC website before you pay. This is a guide, not legal advice.
        </p>

        <h2 className="section-title">Pick your name</h2>
        <div className="form">
          {names.map((n, i) => {
            const hit = sensitiveWords(n);
            return (
              <Field
                key={i}
                label={["First choice", "Second choice", "Third choice"][i]}
                value={n}
                maxLength={60}
                autoComplete="off"
                autoCapitalize="words"
                onChange={(e) => setNames((x) => x.map((v, j) => (j === i ? e.target.value : v)))}
                hint={hit.length ? `Names with "${hit.join('", "')}" may need CAC's permission. Have a backup, or check on the CAC website.` : i === 0 ? "Keep a backup in case it's taken." : undefined}
              />
            );
          })}
        </div>

        <h2 className="section-title">
          Have these ready <span className="row__sub">{ready.filter(Boolean).length} of {READY_ITEMS.length}</span>
        </h2>
        <div className="list" role="group" aria-label="Have these ready">
          {READY_ITEMS.map((s, i) => (
            <button key={s} type="button" role="checkbox" aria-checked={ready[i]} className="row row--step" onClick={() => setReady((r) => r.map((v, j) => (j === i ? !v : v)))}>
              <span className={`check${ready[i] ? " check--on" : ""}`} aria-hidden="true">{ready[i] && <Icon name="check" size={14} stroke={2.4} />}</span>
              <span className="row__main"><span className="row__title">{s}</span></span>
            </button>
          ))}
        </div>
        <p className="caption">SPAL never asks for your ID number or photos. You upload them on the CAC website.</p>

        <h2 className="section-title">Your pack</h2>
        {pack.length ? (
          <div className="list">
            {pack.map((p) => (
              <div key={p.label} className="row">
                <span className="row__main">
                  <span className="row__title" style={{ whiteSpace: "pre-line" }}>{p.text}</span>
                </span>
                <Button variant="secondary" size="md" aria-label={`Copy ${p.label}`} onClick={() => copy(p.label, p.text)}>Copy</Button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <p className="caption">Add your name above, or fill in what you sell and where you are, and it shows here ready to copy.</p>
            <Link to="/business" className="btn btn--secondary btn--md">Fill in Your business</Link>
          </>
        )}

        <h2 className="section-title">On the CAC website</h2>
        <ol className="steps-list">
          {PORTAL_STEPS.map((s) => <li key={s}>{s}</li>)}
        </ol>
        <p className="caption">Many people do this themselves online. An accredited agent is optional and costs more.</p>

        <h2 className="section-title">Check it and save it</h2>
        <form className="form" onSubmit={save} noValidate>
          <Field label="Registration number" value={num} onChange={(e) => { setNum(e.target.value); setError(undefined); }} error={error} hint="From your certificate. For example: BN 1234567." autoComplete="off" autoCapitalize="characters" maxLength={20} />
          <Field label="Date registered (optional)" type="date" value={day} onChange={(e) => setDay(e.target.value)} />
          <p className="caption">SPAL can only check that the number looks right. To see that it's real, search it on CAC's site.</p>
          <div className="actions-row">
            <External href={CAC_SEARCH}>Search on CAC</External>
            <Button type="submit" variant="secondary" size="md">Save</Button>
          </div>
        </form>
      </main>
      <footer className="screen__footer">
        <External href={CAC_PORTAL} variant="primary">Open the CAC website</External>
      </footer>
    </div>
  );
}
