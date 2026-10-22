import { Link } from "react-router-dom";
import { Aura } from "../design-system/Aura";
import { NumberCountUp } from "../design-system/CountUp";
import { Icon } from "../design-system/Icon";
import { Orb } from "../design-system/Orb";
import { ProgressBar } from "../design-system/ProgressBar";
import { WeekStrip } from "../design-system/WeekStrip";
import { shortDate } from "../lib/format";
import { moduleById } from "../profile/modules";
import { NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";

/** How far you've come: this week, your areas, milestones, and your steps. */
export function Journey() {
  const { stored, insights } = useProfile();
  const learning = stored.activity.learning;
  const entries = Object.entries(stored.progress).flatMap(([id, p]) => {
    const m = moduleById(id);
    return m ? [{ m, p }] : [];
  });
  const finished = entries.filter((e) => e.p.doneAt).sort((a, b) => b.p.doneAt!.localeCompare(a.p.doneAt!));
  const started = entries.filter((e) => !e.p.doneAt && !e.p.dismissed && e.p.steps.length > 0);
  const { week, areas, milestones, gap } = insights;
  const weekSummary = `Active on ${week.activeDays} of the last 7 days, ${week.stepsFinished} ${week.stepsFinished === 1 ? "step" : "steps"} finished this week.`;
  const unlocked = milestones.filter((m) => m.unlocked).length;

  if (entries.length === 0) {
    // Nothing to chart yet: just the one thing to do, not a dashboard of zeros.
    return (
      <>
        <div className="page-head">
          <h1 className="title title--page">Journey</h1>
          <p>Your progress builds up here.</p>
        </div>
        <div className="empty enter">
          <Link to="/assistant" className="orb-link orb-link--big" aria-label="Talk to SPAL Assistant">
            <Orb size={88} />
          </Link>
          <h2>Nothing finished yet</h2>
          <p>Finish a step from Today and you'll start to see how far you've come.</p>
          <Link to="/app/today" className="btn btn--secondary btn--md">
            Go to Today
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-head page-head--row">
        <h1 className="title title--page">Journey</h1>
        <Link to="/assistant" className="orb-link" aria-label="Talk to SPAL Assistant">
          <Orb size={44} />
        </Link>
      </div>

      <section className="stat enter" data-theme="night" style={{ marginTop: "var(--space-5)" }} aria-label="Your progress">
        <Aura variant="night" />
        <span className="stat__label">Steps finished</span>
        <NumberCountUp value={finished.length} className="stat__num" />
        <p className="stat__sub">{finished.length === 1 ? "1 step finished so far." : `${finished.length} steps finished so far.`}</p>
        {learning && <WeekStrip days={week.days} summary={weekSummary} />}
      </section>
      {!learning && <p className="note">Learning is off, so your weekly rhythm isn't shown. You can turn it on in Profile.</p>}

      {gap && (
        <div className="voice voice--plain enter">
          <b>A gap worth a look</b>
          <span>
            {gap.text} You could try "{gap.module.title}".
          </span>
          <Link to={`/module/${gap.module.id}`} className="btn btn--secondary btn--md">
            Take a look
          </Link>
        </div>
      )}

      {areas.some((a) => a.total > 0) && (
        <>
          <h2 className="section-title">Your areas</h2>
          <div className="list enter">
            {areas.map((a) => (
              <div className="area" key={a.need}>
                <div className="area__top">
                  <span className="row__title">{a.label}</span>
                  <span className="row__sub">
                    {a.finished} of {a.total}
                  </span>
                </div>
                <ProgressBar value={a.finished} max={a.total} label={`${a.label}: ${a.finished} of ${a.total} steps finished`} />
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">
        Milestones <span className="row__sub">{unlocked} of {milestones.length}</span>
      </h2>
      <div className="milestones enter">
        {milestones.map((m, i) => (
          <div key={m.id} className={`milestone${m.unlocked ? "" : " milestone--locked"}`} style={{ ["--i" as string]: i }}>
            <span className="tile">
              <Icon name={m.unlocked ? "check" : "trending-up"} size={20} />
            </span>
            <b>{m.title}</b>
            <span>{m.unlocked ? (m.at ? `${m.body} ${shortDate(m.at)}` : m.body) : m.body}</span>
          </div>
        ))}
      </div>

      {started.length > 0 && (
        <>
          <h2 className="section-title">In progress</h2>
          <div className="list">
            {started.map(({ m, p }) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <span className="tile">
                  <Icon name={NEED_ICON[m.need]} size={20} />
                </span>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">{p.steps.length} of {m.steps.length} steps done</span>
                </span>
                <span className="row__end">
                  <Icon name="chevron-right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {finished.length > 0 && (
        <>
          <h2 className="section-title">Finished</h2>
          <div className="list">
            {finished.map(({ m, p }) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <span className="tile">
                  <Icon name="check" size={20} />
                </span>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">
                    {NEED_LABEL[m.need]} · {shortDate(p.doneAt!)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
