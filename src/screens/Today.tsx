import { Link, useNavigate } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { SpalSymbol } from "../design-system/SpalSymbol";
import { firstName, todayLabel } from "../lib/format";
import { useAuth } from "../lib/auth";
import { moduleById } from "../profile/modules";
import { NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";
import { NEED_ICON } from "../profile/ui";

const DAY = 24 * 60 * 60 * 1000;

/** One next step, a short queue, and a quiet sense of progress. */
export function Today() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { recs, stored, done } = useProfile();
  const { next, upNext } = recs;

  const finished = Object.entries(stored.progress)
    .filter(([, p]) => p.doneAt)
    .sort((a, b) => (b[1].doneAt ?? "").localeCompare(a[1].doneAt ?? ""));
  const latest = finished[0];
  const recent = latest && Date.now() - new Date(latest[1].doneAt!).getTime() < DAY ? moduleById(latest[0]) : undefined;
  const ticked = next ? (stored.progress[next.module.id]?.steps.length ?? 0) : 0;

  return (
    <>
      <div className="page-head">
        <h1 className="title title--page">Hi, {firstName(session?.name)}</h1>
        <p>{todayLabel()}</p>
      </div>

      {recent && (
        <div className="callout enter" style={{ marginTop: "var(--space-6)" }}>
          <span className="check" aria-hidden="true">
            <Icon name="check" size={14} stroke={2.4} />
          </span>
          <p>
            <b>Nice work.</b>
            <span>You finished "{recent.title}". Keep going.</span>
          </p>
        </div>
      )}

      {next ? (
        <article className="hero enter" style={{ marginTop: "var(--space-6)", ["--i" as string]: 1 }} aria-labelledby="next-title">
          <div className="chips">
            <span className="chip">
              <Icon name="clock" size={14} />
              {next.module.minutes} min
            </span>
            <span className="chip">{NEED_LABEL[next.module.need]}</span>
          </div>
          <h2 id="next-title" className="hero__title">
            {next.module.title}
          </h2>
          <p className="hero__why">
            <b>Why this step</b>
            {next.reason}.
          </p>
          <Button fullWidth onClick={() => navigate(`/module/${next.module.id}`)}>
            {ticked > 0 ? `Continue (${ticked} of ${next.module.steps.length} done)` : "Start"}
          </Button>
        </article>
      ) : (
        <div className="empty enter">
          <SpalSymbol symbol="growth" size={72} />
          <h2>You've finished every step for now</h2>
          <p>New steps appear as your business grows. Check the Library for anything you want to revisit.</p>
        </div>
      )}

      {upNext.length > 0 && (
        <>
          <h2 className="section-title">Up next</h2>
          <div className="list enter" style={{ ["--i" as string]: 2 }}>
            {upNext.map(({ module: m }) => (
              <Link key={m.id} to={`/module/${m.id}`} className="row">
                <span className="tile">
                  <Icon name={NEED_ICON[m.need]} size={20} />
                </span>
                <span className="row__main">
                  <span className="row__title">{m.title}</span>
                  <span className="row__sub">
                    {m.minutes} min · {NEED_LABEL[m.need]}
                  </span>
                </span>
                <span className="row__end">
                  <Icon name="chevron-right" size={18} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {done.size > 0 && (
        <>
          <h2 className="section-title">Your progress</h2>
          <div className="card stack enter" style={{ ["--i" as string]: 3 }}>
            <div className="pills" aria-hidden="true">
              {Array.from({ length: Math.max(7, done.size) }).map((_, i) => (
                <i key={i} className={i < done.size ? "on" : ""} />
              ))}
            </div>
            <p className="hero__why">
              {done.size === 1 ? "1 step finished." : `${done.size} steps finished.`} Every one makes the next easier.
            </p>
          </div>
        </>
      )}
    </>
  );
}
