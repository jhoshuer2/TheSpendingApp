import { useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Button } from "../design-system/Button";
import { Icon } from "../design-system/Icon";
import { ProgressBar } from "../design-system/ProgressBar";
import { moduleById } from "../profile/modules";
import { NEED_LABEL } from "../profile/scoring";
import { useProfile } from "../profile/store";

/** A step with its checklist. Tick things off as you do them; finish when they're all done. */
export function ModuleDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { stored, toggleStep, finishModule, openModule } = useProfile();
  const m = moduleById(id);
  // Remember when this step was first opened (it helps SPAL learn your pace). Does nothing when learning is off.
  useEffect(() => {
    if (m) openModule(m.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m?.id]);
  if (!m) return <Navigate to="/app/today" replace />;

  const progress = stored.progress[m.id] ?? { steps: [] };
  const finished = Boolean(progress.doneAt);
  const ticked = progress.steps.length;
  const all = ticked === m.steps.length;

  return (
    <div className="screen">
      <header className="screen__header screen__header--bar">
        <button type="button" className="icon-btn" aria-label="Back" onClick={() => navigate(-1)}>
          <Icon name="chevron-left" size={20} />
        </button>
        <ProgressBar value={ticked} max={m.steps.length} label={`${ticked} of ${m.steps.length} steps done`} />
      </header>

      <main className="screen__body">
        <div className="chips enter">
          <span className="chip">
            <Icon name="clock" size={14} />
            {m.minutes} min
          </span>
          <span className="chip">{NEED_LABEL[m.need]}</span>
          {finished && (
            <span className="chip">
              <Icon name="check" size={14} />
              Finished
            </span>
          )}
        </div>
        <h1 className="title title--page enter" style={{ marginTop: "var(--space-4)", ["--i" as string]: 1 }}>
          {m.title}
        </h1>
        <p className="lede enter" style={{ ["--i" as string]: 2 }}>
          {m.why}
        </p>

        <h2 className="section-title">
          Steps <span className="row__sub">{ticked} of {m.steps.length}</span>
        </h2>
        <div className="list enter" role="group" aria-label="Steps" style={{ ["--i" as string]: 3 }}>
          {m.steps.map((s, i) => {
            const on = progress.steps.includes(i);
            return (
              <button
                key={i}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={finished}
                className="row row--step"
                onClick={() => toggleStep(m.id, i)}
              >
                <span className={`check${on ? " check--on" : ""}`} aria-hidden="true">
                  {on && <Icon name="check" size={14} stroke={2.4} />}
                </span>
                <span className="row__main">
                  <span className="row__title">{s}</span>
                </span>
              </button>
            );
          })}
        </div>
      </main>

      <footer className="screen__footer">
        {finished ? (
          <Button fullWidth onClick={() => navigate("/app/today", { replace: true })}>
            Back to Today
          </Button>
        ) : (
          <>
            {!all && <p className="caption">Tick each step as you finish it.</p>}
            <Button
              fullWidth
              disabled={!all}
              onClick={() => {
                finishModule(m.id);
                navigate("/app/today", { replace: true });
              }}
            >
              Finish this step
            </Button>
          </>
        )}
      </footer>
    </div>
  );
}
