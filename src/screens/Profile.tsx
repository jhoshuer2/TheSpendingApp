import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { Switch } from "../design-system/Switch";
import { shortDate } from "../lib/format";
import { useAuth } from "../lib/auth";
import { moduleById } from "../profile/modules";
import { BAND_LABEL, NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";

export function Profile() {
  const navigate = useNavigate();
  const { session, signOut, mode } = useAuth();
  const { profile, sync, prepareSignOut, stored, insights, setLearning, resetLearning, restore } = useProfile();
  const [confirmReset, setConfirmReset] = useState(false);
  const learning = stored.activity.learning;
  const saved =
    mode === "local" ? "Saved on this device only (demo mode)" : sync === "saving" ? "Saving…" : sync === "offline" ? "Waiting for a connection. We'll save your changes when you're back online." : "All changes saved";

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
      <div className="page-head">
        <h1 className="title title--page">Profile</h1>
      </div>

      <div className="card stack" style={{ marginTop: "var(--space-6)" }}>
        <p className="hero__title" style={{ fontSize: "var(--text-title-2)" }}>
          {session?.name}
        </p>
        <p className="row__sub">{session?.email}</p>
        <p className="row__sub" role="status">
          {saved}
        </p>
      </div>

      <h2 className="section-title">Your business</h2>
      <div className="card stack">
        <p className="row__sub">Where you are</p>
        <p className="row__title">{BAND_LABEL[profile.band]}</p>
      </div>

      <h2 className="section-title">What we're focusing on</h2>
      <div className="list">
        {profile.needs.slice(0, 3).map((n) => (
          <div className="row" key={n.id}>
            <span className="tile">
              <Icon name={NEED_ICON[n.id]} size={20} />
            </span>
            <span className="row__main">
              <span className="row__title">{NEED_LABEL[n.id]}</span>
              <span className="row__sub">{n.reasons[0]}</span>
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

      <div className="stack" style={{ marginTop: "var(--space-section-gap)", alignItems: "flex-start" }}>
        {confirmReset ? (
          <div className="card stack" role="alertdialog" aria-label="Forget what SPAL has noticed">
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
        ) : (
          <Button variant="secondary" size="md" onClick={() => setConfirmReset(true)}>
            Forget what SPAL has noticed
          </Button>
        )}
        <Button variant="secondary" size="md" onClick={() => navigate("/onboarding")}>
          Change my answers
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={async () => {
            await prepareSignOut();
            await signOut();
          }}
        >
          Log out
        </Button>
      </div>
    </>
  );
}
