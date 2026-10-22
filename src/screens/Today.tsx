import { Link, useNavigate } from "react-router-dom";
import { Aura } from "../design-system/Aura";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { Orb } from "../design-system/Orb";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { firstName, todayLabel } from "../lib/format";
import { useToast } from "../lib/toast";
import { useAuth } from "../lib/auth";
import { moduleById } from "../profile/modules";
import { NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";
import { streakInfo } from "../records/calc";
import { useRecords } from "../records/store";

const DAY = 24 * 60 * 60 * 1000;

/** One next step, said warmly, with the habit in view. Never guilt. */
export function Today() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { recs, stored, welcome, snooze, dismiss, restore } = useProfile();
  const { state: books } = useRecords();
  const { next, upNext } = recs;
  const { show } = useToast();
  const streak = streakInfo(books, new Date());

  const finished = Object.entries(stored.progress)
    .filter(([, p]) => p.doneAt)
    .sort((a, b) => (b[1].doneAt ?? "").localeCompare(a[1].doneAt ?? ""));
  const latest = finished[0];
  const recent = latest && Date.now() - new Date(latest[1].doneAt!).getTime() < DAY ? moduleById(latest[0]) : undefined;
  const ticked = next ? (stored.progress[next.module.id]?.steps.length ?? 0) : 0;

  // What the mascot says: one thing, most useful first.
  const voice = welcome ? (
    <>
      <b>Welcome back.</b>
      <span>{welcome.inProgress ? `You were partway through "${welcome.inProgress.title}".` : "Good to see you. Here's an easy one."}</span>
      {welcome.inProgress && welcome.inProgress.id !== next?.module.id && (
        <Button size="md" onClick={() => navigate(`/module/${welcome.inProgress!.id}`)}>
          Pick up where I left off
        </Button>
      )}
    </>
  ) : recent ? (
    <>
      <b>Nice work.</b>
      <span>You finished "{recent.title}".</span>
    </>
  ) : streak.count >= 2 ? (
    <>
      <b>{streak.count} days in a row.</b>
      <span>{streak.doneToday ? "Today is recorded." : "Record something today to keep it going."}</span>
    </>
  ) : (
    <b>{streak.doneToday ? "Today is recorded. Nice." : "Two minutes is all this takes."}</b>
  );

  const hide = (kind: "snooze" | "dismiss") => {
    if (!next) return;
    const m = next.module;
    if (kind === "snooze") snooze(m.id);
    else dismiss(m.id);
    show(kind === "snooze" ? `Okay. We'll bring "${m.title}" back in a week.` : `Okay. We won't suggest "${m.title}" again.`, () => restore(m.id));
  };

  return (
    <>
      <div className="page-head page-head--row">
        <div>
          <h1 className="title title--page">Hi, {firstName(session?.name)}</h1>
          <p>{todayLabel()}</p>
        </div>
        <Link to="/assistant" className="orb-link" aria-label="Talk to SPAL Assistant">
          <Orb size={44} />
        </Link>
      </div>

      <div className="voice enter">{voice}</div>

      {next ? (
        <article className="hero hero--night enter" data-theme="night" style={{ marginTop: "var(--space-5)", ["--i" as string]: 1 }} aria-labelledby="next-title">
          <Aura variant="night" />
          <div className="chips">
            <span className="chip">
              <Icon name="clock" size={14} />
              {next.module.minutes} min
            </span>
            <span className="chip">{NEED_LABEL[next.module.need]}</span>
            {next.module.kind === "do" && <span className="chip">Do it in SPAL</span>}
          </div>
          <h2 id="next-title" className="hero__title">
            {next.module.title}
          </h2>
          <p className="hero__why">
            <b>Why this step</b>
            {next.reason}.
          </p>
          {next.learned && (
            <p className="hero__why">
              <b>Based on how you use SPAL</b>
              {next.learned}
            </p>
          )}
          <Button fullWidth onClick={() => navigate(`/module/${next.module.id}`)}>
            {ticked > 0 ? `Continue (${ticked} of ${next.module.steps.length} done)` : "Start"}
          </Button>
          <div className="hero__actions">
            <button type="button" className="link-btn link-btn--quiet" onClick={() => hide("snooze")}>
              Not now
            </button>
            <button type="button" className="link-btn link-btn--quiet" onClick={() => hide("dismiss")}>
              Not for me
            </button>
          </div>
        </article>
      ) : (
        <div className="empty enter">
          <SpalSymbol symbol="growth" size={72} />
          <h2>You've finished every step for now</h2>
          <p>New steps appear as your business grows. Check the Library for anything you want to revisit or bring back.</p>
        </div>
      )}

      <div className="streak enter" style={{ ["--i" as string]: 2 }} role="img" aria-label={`${streak.count} ${streak.count === 1 ? "day" : "days"} in a row. Recorded on ${streak.days.filter((d) => d.done).length} of the last 7 days.`}>
        <span className={`streak__badge${streak.count > 0 ? " streak__badge--on" : ""}`}>
          <Icon name="flame" size={20} />
          {streak.count}
        </span>
        <div className="streak__days">
          {streak.days.map((d, i) => (
            <span key={d.key} className={`streak__day${d.done ? " streak__day--done" : ""}${d.today ? " streak__day--today" : ""}`} style={{ ["--i" as string]: i }}>
              <i />
              <span>{d.label}</span>
            </span>
          ))}
        </div>
      </div>

      {upNext.length > 0 && (
        <>
          <h2 className="section-title">Up next</h2>
          <div className="list enter" style={{ ["--i" as string]: 3 }}>
            {upNext.map(({ module: m }) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <span className="tile">
                  <Icon name={NEED_ICON[m.need]} size={20} />
                </span>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">{m.minutes} min</span>
                </span>
                <span className="row__end">
                  <Icon name="chevron-right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
