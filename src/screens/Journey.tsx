import { Link } from "react-router-dom";
import { Icon } from "../design-system/Icon";
import { ProgressBar } from "../design-system/ProgressBar";
import { SpalSymbol } from "../design-system/SpalSymbol";
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
  const { week, areas, milestones, gap, paceDays } = insights;
  const weekSummary = `Active on ${week.activeDays} of the last 7 days, ${week.stepsFinished} ${week.stepsFinished === 1 ? "step" : "steps"} finished this week.`;
  const unlocked = milestones.filter((m) => m.unlocked).length;

  return (
    <>
      <div className="page-head">
        <h1 className="title title--page">Journey</h1>
        <p>{finished.length === 0 ? "Your progress builds up here." : `${finished.length} ${finished.length === 1 ? "step" : "steps"} finished so far.`}</p>
      </div>

      {entries.length === 0 && (
        <div className="empty enter">
          <SpalSymbol symbol="growth" size={72} />
          <h2>Nothing finished yet</h2>
          <p>Finish a step from Today and you'll start to see how far you've come.</p>
        </div>
      )}

      {learning ? (
        <>
          <h2 className="section-title">This week</h2>
          <div className="card stack enter">
            <WeekStrip days={week.days} summary={weekSummary} />
            <p className="hero__why">
              {week.activeDays === 0 ? "A quiet week so far. Any step, big or small, gets you going." : `Active on ${week.activeDays} of the last 7 days.`} {week.stepsFinished} {week.stepsFinished === 1 ? "step" : "steps"} finished
              {week.prevStepsFinished > 0 ? `, ${week.prevStepsFinished} the week before.` : "."}
              {paceDays ? ` You usually finish a step within about ${paceDays} ${paceDays === 1 ? "day" : "days"}.` : ""}
            </p>
          </div>
        </>
      ) : (
        <p className="note">Learning is off, so your weekly rhythm isn't shown. You can turn it on in Profile.</p>
      )}

      {gap && (
        <div className="callout enter" style={{ marginTop: "var(--space-6)" }}>
          <span className="check" aria-hidden="true">
            <Icon name="compass" size={14} stroke={2} />
          </span>
          <div className="callout-body">
            <p>
              <b>A gap worth a look</b>
              <span>
                {gap.text} You could try "{gap.module.title}".
              </span>
            </p>
            <Link to={`/module/${gap.module.id}`} className="btn btn--secondary btn--md">
              Take a look
            </Link>
          </div>
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
        {milestones.map((m) => (
          <div key={m.id} className={`milestone${m.unlocked ? "" : " milestone--locked"}`}>
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
