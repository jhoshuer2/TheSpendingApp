import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { IconTile, tintFor } from "../design-system/Identity";
import { Orb } from "../design-system/Orb";
import { Switch } from "../design-system/Switch";
import { shortDate } from "../lib/format";
import { useAuth } from "../lib/auth";
import { moduleById } from "../profile/modules";
import { NEED_LABEL, stageLabel } from "../profile/scoring";
import { useAssistant } from "../assistant/store";
import { useProfile } from "../profile/store";
import { streakInfo } from "../records/calc";
import { useRecords } from "../records/store";
import { NEED_ICON } from "../profile/ui";

export function Profile() {
  const navigate = useNavigate();
  const { session, signOut, mode } = useAuth();
  const assistant = useAssistant();
  const { profile, sync, prepareSignOut, stored, insights, setLearning, resetLearning, restore } = useProfile();
  const records = useRecords();
  const [confirmReset, setConfirmReset] = useState(false);
  // The confirm card replaces the button that opened it, so hand focus to the card, and back to the button when it closes.
  const confirmRef = useRef<HTMLDivElement>(null);
  const forgetRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirmReset) confirmRef.current?.focus();
    else if (wasConfirming.current) forgetRef.current?.focus();
    wasConfirming.current = confirmReset;
  }, [confirmReset]);
  const learning = stored.activity.learning;
  const streak = streakInfo(records.state, new Date());
  const refused = records.rejectedCount > 0 ? ` ${records.rejectedCount === 1 ? "1 record couldn't" : `${records.rejectedCount} records couldn't`} be saved to your account. ${records.rejectedCount === 1 ? "It's" : "They're"} kept on this phone.` : "";
  const saved =
    mode === "local" ? "Saved on this device only (demo mode)" : sync === "saving" || records.sync === "saving" ? "Saving…" : sync === "offline" || records.sync === "offline" ? "Waiting for a connection. We'll save your changes when you're back online." : "All changes saved";

  // Steps the person hid: "not for me" for good, "not now" until the date.
  const hidden = Object.entries(stored.progress).flatMap(([id, p]) => {
    const m = moduleById(id);
    if (!m) return [];
    if (p.dismissed) return [{ m, until: undefined as string | undefined }];
    if (p.snoozedUntil && Date.parse(p.snoozedUntil) > Date.now()) return [{ m, until: p.snoozedUntil }];
    return [];
  });

  // What SPAL has noticed, in plain words. Only what is true, only with learning on.
  const worked = insights.areas.filter((a) => a.finished > 0);
  const noticed: string[] = [];
  if (learning) {
    if (insights.paceDays) noticed.push(`You usually finish a step within about ${insights.paceDays} ${insights.paceDays === 1 ? "day" : "days"} of opening it.`);
    if (insights.prefersShort) noticed.push("Short steps seem to suit you, so SPAL leans towards them.");
    if (worked.length) noticed.push(`You've finished steps on ${worked.map((a) => `${a.label.toLowerCase()} (${a.finished})`).join(", ")}.`);
  }

  return (
    <>
      <div className="page-head page-head--row">
        <h1 className="title title--page">Profile</h1>
        <Link to="/assistant" className="orb-link" aria-label="Talk to SPAL Assistant">
          <Orb size={44} />
        </Link>
      </div>

      <section className="me enter" data-theme="night" style={{ marginTop: "var(--space-5)" }}>
        <span className="me__avatar" aria-hidden="true">
          {(session?.name ?? "?").trim().charAt(0).toUpperCase()}
        </span>
        <p className="profile__name">{session?.name}</p>
        <p className="me__email">{session?.email}</p>
        <div className="chips">
          <span className="chip">{stageLabel(stored.answers)}</span>
          {streak.count > 0 && (
            <span className="chip">
              <Icon name="flame" size={14} />
              {streak.count} {streak.count === 1 ? "day" : "days"} in a row
            </span>
          )}
        </div>
        <p className="me__status" role="status">
          {saved}
          {mode !== "local" && refused}
        </p>
      </section>

      <h2 className="section-title">What we're focusing on</h2>
      <div className="list">
        {profile.needs.slice(0, 3).map((n) => (
          <div className="row" key={n.id}>
            <IconTile icon={NEED_ICON[n.id]} tint={tintFor(NEED_LABEL[n.id])} />
            <span className="row__main">
              <span className="row__title">{NEED_LABEL[n.id]}</span>
            </span>
          </div>
        ))}
      </div>

      <h2 className="section-title">What SPAL has noticed</h2>
      <Switch
        label="Learn from how I use SPAL"
        hint="SPAL suggests better steps by noticing which you open, finish and skip, and which days you're active. It stays with your account."
        checked={learning}
        onChange={setLearning}
      />
      {learning && (
        <div className="card stack" style={{ marginTop: "var(--space-3)" }}>
          {noticed.length === 0 ? (
            <p className="hero__why">Nothing yet. SPAL learns as you finish and skip steps.</p>
          ) : (
            noticed.map((t) => (
              <p key={t} className="hero__why">
                {t}
              </p>
            ))
          )}
        </div>
      )}
      {!learning && <p className="note">Learning is off. SPAL is using only what you told it in your answers. Steps you've hidden stay hidden.</p>}

      {hidden.length > 0 && (
        <>
          <h2 className="section-title">Hidden steps</h2>
          <div className="list">
            {hidden.map(({ m, until }) => (
              <div className="row" key={m.id} style={{ cursor: "default" }}>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">{until ? `Back on ${shortDate(until)}` : "Hidden for good"}</span>
                </span>
                <Button variant="secondary" size="md" onClick={() => restore(m.id)}>
                  Bring back
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">Your business</h2>
      <div className="list">
        <Link to="/business" className="row">
          <IconTile icon="briefcase" tint="sky" />
          <span className="row__main">
            <span className="row__title">{stored.answers.businessName || "Business details"}</span>
            <span className="row__sub">{stored.answers.about || "Name, what you sell, where you are, your hours"}</span>
          </span>
          <span className="row__end">
            <Icon name="chevron-right" size={18} />
          </span>
        </Link>
      </div>

      <h2 className="section-title">Your answers and data</h2>
      <div className="list">
        <button type="button" className="row" onClick={() => navigate("/onboarding")}>
          <IconTile icon="pencil" tint="lilac" />
          <span className="row__main">
            <span className="row__title">Change my answers</span>
            <span className="row__sub">Redo the questions SPAL started from</span>
          </span>
          <span className="row__end">
            <Icon name="chevron-right" size={18} />
          </span>
        </button>
        {!confirmReset && (
          <button type="button" className="row" ref={forgetRef} onClick={() => setConfirmReset(true)}>
            <IconTile icon="eye" tint="sand" />
            <span className="row__main">
              <span className="row__title">Forget what SPAL has noticed</span>
              <span className="row__sub">Clears your active days and when you opened steps</span>
            </span>
            <span className="row__end">
              <Icon name="chevron-right" size={18} />
            </span>
          </button>
        )}
      </div>
      {confirmReset && (
        <div ref={confirmRef} tabIndex={-1} className="card stack" role="alertdialog" aria-label="Forget what SPAL has noticed" style={{ marginTop: "var(--space-3)" }}>
          <p className="hero__why">
            <b>Forget what SPAL has noticed?</b>
            This clears your active days and when you opened steps. Your finished steps and hidden steps stay.
          </p>
          <div className="inline-row">
            <Button
              size="md"
              onClick={() => {
                resetLearning();
                setConfirmReset(false);
              }}
            >
              Forget
            </Button>
            <Button variant="ghost" size="md" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="stack" style={{ marginTop: "var(--space-section-gap)", alignItems: "flex-start" }}>
        <Button
          variant="ghost"
          size="md"
          onClick={async () => {
            assistant.prepareSignOut();
            await Promise.all([prepareSignOut(), records.prepareSignOut()]);
            await signOut();
          }}
        >
          Log out
        </Button>
      </div>
    </>
  );
}
